// Intake: read an invoice image or PDF into the four fields, then decide (Rule 5)
// whether it goes straight into the pay run or waits for a tap.
//
// The model reads. It is given no office data and keeps nothing. Everything it
// returns is checked here by plain code before anything is stored.

import Anthropic from "@anthropic-ai/sdk";
import type { Vendor, Verdict } from "@/lib/rules";

export type Extracted = {
  payee: string | null;
  amount: number | null;
  invoice_no: string | null;
  invoice_date: string | null;   // YYYY-MM-DD
  due_date: string | null;       // YYYY-MM-DD
  account_last4: string | null;  // never more than four digits
  full_account_visible: boolean; // the image shows a full account number
  confidence: number;            // 0 to 1, the model's own read
  notes: string | null;          // anything a person should know, one line
};

export const MODEL = process.env.MASTIFF_MODEL || "claude-sonnet-5-5";
export const CONFIDENT = 0.85;

const PROMPT = `You are reading one supplier invoice for a small business's accounts payable desk.
Return only a JSON object with these keys and nothing else:
{"payee": string|null, "amount": number|null, "invoice_no": string|null, "invoice_date": "YYYY-MM-DD"|null, "due_date": "YYYY-MM-DD"|null, "account_last4": string|null, "full_account_visible": boolean, "confidence": number, "notes": string|null}

Rules:
- payee is the business being paid (the sender of the invoice), as printed, without "LLC"/"Inc" cleanup.
- amount is the total due now, as a number with no currency symbol. If several totals appear, choose the amount due.
- account_last4 is the LAST FOUR DIGITS ONLY of any bank account printed in a "remit to" / "pay by ACH" / "wire" section. Never return more than four digits for any account, routing number or tax ID, anywhere in the output, including notes.
- full_account_visible is true if a complete bank account number, routing number or tax ID is printed on the document.
- confidence is your honest 0 to 1 estimate that payee and amount are both exactly right.
- notes: one short line only if something matters (handwritten changes, a "new bank details" notice, a past-due stamp, more than one page). Otherwise null.
- If this is not an invoice or bill, return all nulls, confidence 0, and say what it is in notes.`;

export function isConfigured(): boolean {
  return !!process.env.ANTHROPIC_API_KEY;
}

// Parse and sanitise whatever the model returned. Plain code is the last word.
export function parseExtracted(text: string): Extracted {
  const m = text.match(/\{[\s\S]*\}/);
  if (!m) throw new Error("no JSON in model reply");
  const j = JSON.parse(m[0]) as Record<string, unknown>;
  const str = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : null);
  const date = (v: unknown) => { const s = str(v); return s && /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : null; };
  const amtRaw = j.amount;
  const amount = typeof amtRaw === "number" && Number.isFinite(amtRaw) && amtRaw > 0 ? Math.round(amtRaw * 100) / 100
    : typeof amtRaw === "string" ? (Number(amtRaw.replace(/[^0-9.]/g, "")) || null) : null;
  const digits = (str(j.account_last4) ?? "").replace(/\D/g, "");
  const conf = typeof j.confidence === "number" ? Math.max(0, Math.min(1, j.confidence)) : 0;
  const mask = (s: string | null) => s && s.replace(/\d(?:[ -]?\d){7,}/g, (run) => "****" + run.replace(/\D/g, "").slice(-4));
  const notes = mask(str(j.notes))?.slice(0, 240) ?? null;
  return {
    payee: mask(str(j.payee))?.slice(0, 120) ?? null,
    amount,
    invoice_no: mask(str(j.invoice_no))?.slice(0, 40) ?? null,
    invoice_date: date(j.invoice_date),
    due_date: date(j.due_date),
    account_last4: digits.length >= 4 ? digits.slice(-4) : null,
    full_account_visible: j.full_account_visible === true,
    confidence: conf,
    notes,
  };
}

export async function readInvoice(bytes: Uint8Array, mime: string): Promise<Extracted> {
  const client = new Anthropic({ timeout: 25_000, maxRetries: 1 });
  const data = Buffer.from(bytes).toString("base64");
  const block = mime === "application/pdf"
    ? { type: "document" as const, source: { type: "base64" as const, media_type: "application/pdf" as const, data } }
    : { type: "image" as const, source: { type: "base64" as const, media_type: mime as "image/jpeg" | "image/png" | "image/webp", data } };
  const res = await client.messages.create({
    model: MODEL,
    max_tokens: 600,
    messages: [{ role: "user", content: [block, { type: "text", text: PROMPT }] }],
  });
  const text = res.content.filter((c) => c.type === "text").map((c) => (c as { text: string }).text).join("\n");
  return parseExtracted(text);
}

// Rule 5. Returns null when the request can go straight into the pay run,
// otherwise the one plain-words reason a person is asked to look.
export function needsTap(x: Extracted, v: Verdict, vendor: Vendor | null): string | null {
  if (!x.payee || !x.amount) return "Mastiff could not read the payee or the amount.";
  if (x.confidence < CONFIDENT) return "Mastiff is not sure it read this correctly.";
  if (!vendor) return "This vendor is not on file yet.";
  if (v.verdict === "hold") return "It would hold: " + v.reasons[0];
  const passUnder = (vendor as Vendor & { pass_under?: number | null }).pass_under;
  if (passUnder != null && x.amount <= Number(passUnder)) return null; // an owner's standing instruction (step 8)
  if (vendor.usual_min == null && vendor.usual_max == null) return "Mastiff does not know this vendor's usual amount yet. After three payments it will suggest one on the Vendors page.";
  if (vendor.usual_min != null && x.amount < Number(vendor.usual_min)) return `Amount is below this vendor's usual range (from $${Number(vendor.usual_min).toLocaleString()}).`;
  if (vendor.usual_max != null && x.amount > Number(vendor.usual_max)) return `Amount is above this vendor's usual range (to $${Number(vendor.usual_max).toLocaleString()}).`;
  if (x.notes && /new bank|bank (details|account) (change|updat)|remit(tance)? (change|updat)|handwrit/i.test(x.notes)) return "The invoice mentions a change: " + x.notes;
  return null;
}
