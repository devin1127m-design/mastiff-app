// Step 8: instructions to Mastiff. "Always pass Metro Fasteners under $500."
// "Pay discount invoices on day 9." The model maps a sentence onto one of a
// fixed set of settings; plain code checks the mapping and writes the sentence
// the owner will confirm. Nothing is applied until they do.

import Anthropic from "@anthropic-ai/sdk";
import { MODEL } from "@/lib/intake";
import { nameKey } from "@/lib/rules";

export type Proposal =
  | { kind: "vendor_pass_under"; vendor_id: string; vendor: string; amount: number }
  | { kind: "vendor_usual_range"; vendor_id: string; vendor: string; min: number; max: number }
  | { kind: "vendor_phone"; vendor_id: string; vendor: string; phone: string }
  | { kind: "vendor_note"; vendor_id: string; vendor: string; note: string }
  | { kind: "single_cap"; amount: number }
  | { kind: "range_multiple"; multiple: number }
  | { kind: "hours"; start: number; end: number }
  | { kind: "unclear"; why: string };

export type VendorLite = { id: string; name: string; name_key: string };

const PROMPT = `You turn one instruction from a small business owner into exactly one setting for their payment desk.
Return only JSON, one of:
{"kind":"vendor_pass_under","vendor":"<name as given>","amount":<number>}   // "always pass X under $N", "don't bother me about X below N"
{"kind":"vendor_usual_range","vendor":"<name>","min":<number>,"max":<number>}   // "X is usually between A and B"
{"kind":"vendor_phone","vendor":"<name>","phone":"<digits as given>"}   // "call X at 248-555-0100"
{"kind":"vendor_note","vendor":"<name>","note":"<short>"}   // anything else about one vendor: "pay X on day 9 for the discount", "X invoices come from Carol"
{"kind":"single_cap","amount":<number>}   // "hold anything over $N"
{"kind":"range_multiple","multiple":<number>}   // "hold anything more than 3x usual"
{"kind":"hours","start":<0-23>,"end":<1-24>}   // "we pay between 8 and 5"
{"kind":"unclear","why":"<one line>"}   // when it is not one of these, or asks to skip a callback, release a hold, pay something, or change who can decide
Rules: never invent a vendor name; copy it as written. Amounts are plain numbers. If the sentence asks for anything other than these settings, return unclear.`;

export async function propose(text: string, vendors: VendorLite[]): Promise<Proposal> {
  if (!process.env.ANTHROPIC_API_KEY) return { kind: "unclear", why: "Instructions are not switched on for this desk yet." };
  const client = new Anthropic({ timeout: 20_000, maxRetries: 1 });
  const res = await client.messages.create({ model: MODEL, max_tokens: 200, system: PROMPT, messages: [{ role: "user", content: `Vendors on file: ${vendors.map((v) => v.name).join("; ") || "none"}\n\nInstruction: ${text.slice(0, 400)}` }] });
  const raw = res.content.filter((c) => c.type === "text").map((c) => (c as { text: string }).text).join("");
  return checkProposal(raw, vendors);
}

// Plain code is the last word: the vendor must exist, numbers must make sense.
export function checkProposal(raw: string, vendors: VendorLite[]): Proposal {
  const m = raw.match(/\{[\s\S]*\}/);
  if (!m) return { kind: "unclear", why: "Mastiff could not make a setting out of that." };
  let j: Record<string, unknown>;
  try { j = JSON.parse(m[0]); } catch { return { kind: "unclear", why: "Mastiff could not make a setting out of that." }; }
  const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : typeof v === "string" ? Number(v.replace(/[^0-9.]/g, "")) : NaN);
  const findVendor = () => {
    const name = String(j.vendor ?? "").trim();
    if (!name) return null;
    const key = nameKey(name);
    return vendors.find((v) => v.name_key === key) ?? vendors.find((v) => v.name_key.includes(key) || key.includes(v.name_key)) ?? null;
  };
  const needVendor = (): VendorLite | Proposal => findVendor() ?? { kind: "unclear", why: `No vendor on file called "${String(j.vendor ?? "")}". Add them on the Vendors page first.` };
  switch (j.kind) {
    case "vendor_pass_under": { const v = needVendor(); if ("kind" in v) return v; const a = num(j.amount); if (!(a > 0)) return { kind: "unclear", why: "The amount was not clear." }; return { kind: "vendor_pass_under", vendor_id: v.id, vendor: v.name, amount: a }; }
    case "vendor_usual_range": { const v = needVendor(); if ("kind" in v) return v; const lo = num(j.min), hi = num(j.max); if (!(hi > 0) || !(lo >= 0) || lo > hi) return { kind: "unclear", why: "The range was not clear." }; return { kind: "vendor_usual_range", vendor_id: v.id, vendor: v.name, min: lo, max: hi }; }
    case "vendor_phone": { const v = needVendor(); if ("kind" in v) return v; const p = String(j.phone ?? "").replace(/[^0-9+() -]/g, "").trim(); if (p.replace(/\D/g, "").length < 10) return { kind: "unclear", why: "The phone number was not clear." }; return { kind: "vendor_phone", vendor_id: v.id, vendor: v.name, phone: p }; }
    case "vendor_note": { const v = needVendor(); if ("kind" in v) return v; const n = String(j.note ?? "").trim().slice(0, 200); if (!n) return { kind: "unclear", why: "The note was empty." }; return { kind: "vendor_note", vendor_id: v.id, vendor: v.name, note: n }; }
    case "single_cap": { const a = num(j.amount); if (!(a > 0)) return { kind: "unclear", why: "The amount was not clear." }; return { kind: "single_cap", amount: a }; }
    case "range_multiple": { const x = num(j.multiple); if (!(x >= 1 && x <= 20)) return { kind: "unclear", why: "The multiple must be between 1 and 20." }; return { kind: "range_multiple", multiple: x }; }
    case "hours": { const s = num(j.start), e = num(j.end); if (!(s >= 0 && s <= 23 && e >= 1 && e <= 24 && s < e)) return { kind: "unclear", why: "The hours were not clear." }; return { kind: "hours", start: s, end: e }; }
    default: return { kind: "unclear", why: String(j.why ?? "That is not a setting Mastiff can change. Holds, callbacks and decisions stay with people.") };
  }
}

const money = (n: number) => "$" + n.toLocaleString("en-US");
const hour = (h: number) => (h === 0 || h === 24 ? "midnight" : h === 12 ? "noon" : h < 12 ? `${h} am` : `${h - 12} pm`);

export function summary(p: Proposal): string {
  switch (p.kind) {
    case "vendor_pass_under": return `A confident read of a ${p.vendor} invoice under ${money(p.amount)} goes straight into the pay run, even if it is outside their usual range. The three holds still apply.`;
    case "vendor_usual_range": return `${p.vendor}'s usual range becomes ${money(p.min)} to ${money(p.max)}. Outside it, a read waits for a look; above ${p.max.toLocaleString()} × the range multiple, it holds.`;
    case "vendor_phone": return `${p.vendor}'s callback number becomes ${p.phone}, on file from today. Mastiff calls only this number.`;
    case "vendor_note": return `Shown beside every ${p.vendor} request: "${p.note}"`;
    case "single_cap": return `Any request above ${money(p.amount)} holds, whoever the payee is.`;
    case "range_multiple": return `A request more than ${p.multiple}× a vendor's usual maximum holds.`;
    case "hours": return `Payment hours become ${hour(p.start)} to ${hour(p.end)}; a request outside them is noted, never held on its own.`;
    case "unclear": return p.why;
  }
}
