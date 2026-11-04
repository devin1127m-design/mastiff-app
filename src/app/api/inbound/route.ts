// Step 1: the email door. Resend posts here when mail reaches <slug>@requests.<domain>.
// We verify the signature, fetch the attachment, read it, run the rules in plain
// code, and file the result through receive_email(). No session, no service key.
//
// Env: RESEND_API_KEY, RESEND_WEBHOOK_SECRET (whsec_...), MASTIFF_INBOUND_SECRET.

import { NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "node:crypto";
import { plainClient, SECRET } from "@/lib/mail";
import { readInvoice, needsTap, isConfigured, type Extracted } from "@/lib/intake";
import { check, type Vendor, type Org } from "@/lib/rules";

export const runtime = "nodejs";
export const maxDuration = 60;

function verify(raw: string, headers: Headers): boolean {
  const secret = process.env.RESEND_WEBHOOK_SECRET;
  if (!secret) return process.env.NODE_ENV !== "production"; // never skip in production
  const id = headers.get("svix-id"), ts = headers.get("svix-timestamp"), sigs = headers.get("svix-signature");
  if (!id || !ts || !sigs) return false;
  if (Math.abs(Date.now() / 1000 - Number(ts)) > 300) return false;
  const key = Buffer.from(secret.replace(/^whsec_/, ""), "base64");
  const expected = createHmac("sha256", key).update(`${id}.${ts}.${raw}`).digest();
  return sigs.split(" ").some((s) => {
    const [, v] = s.split(",");
    if (!v) return false;
    const got = Buffer.from(v, "base64");
    return got.length === expected.length && timingSafeEqual(got, expected);
  });
}

const resend = (path: string) => fetch(`https://api.resend.com${path}`, { headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}` } });
const ACCEPT: Record<string, string> = { "application/pdf": "pdf", "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };

export async function POST(req: Request) {
  const raw = await req.text();
  if (!verify(raw, req.headers)) return NextResponse.json({ error: "bad signature" }, { status: 401 });
  if (!SECRET()) return NextResponse.json({ error: "inbound not configured" }, { status: 503 });
  const evt = JSON.parse(raw) as { type: string; data: { email_id: string; from: string; to: string[]; subject?: string; attachments?: { id: string; filename: string; content_type: string }[] } };
  if (evt.type !== "email.received") return NextResponse.json({ ignored: evt.type });
  const d = evt.data;
  const to = (d.to?.[0] ?? "").toLowerCase();
  const db = plainClient();

  // Which office, and what it has on file.
  const { data: orgJ } = await db.rpc("org_for_inbound", { p_secret: SECRET(), p_to: to });
  const org = orgJ as (Org & { id: string; name: string; vendors: Vendor[] }) | null;

  // Body text (for the record) and the first attachment that looks like an invoice.
  let bodyText = "";
  let attachments = d.attachments ?? [];
  if (process.env.RESEND_API_KEY) {
    const r = await resend(`/emails/receiving/${d.email_id}`);
    if (r.ok) {
      const full = await r.json() as { text?: string | null; html?: string | null; attachments?: typeof attachments };
      bodyText = full.text ?? (full.html ?? "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
      if (full.attachments?.length) attachments = full.attachments;
    }
  }
  const stored: { name: string; mime: string; path: string }[] = [];
  let imagePath: string | null = null, imageMime = "", imageBytes: Uint8Array | null = null;
  if (org && process.env.RESEND_API_KEY) {
    for (const a of attachments) {
      const ext = ACCEPT[a.content_type];
      if (!ext) continue;
      const meta = await resend(`/emails/receiving/${d.email_id}/attachments/${a.id}`);
      if (!meta.ok) continue;
      const { download_url } = await meta.json() as { download_url: string };
      const file = await fetch(download_url);
      if (!file.ok) continue;
      const bytes = new Uint8Array(await file.arrayBuffer());
      if (bytes.byteLength > 15 * 1024 * 1024) continue;
      const path = `inbound/${crypto.randomUUID()}.${ext}`;
      const { error } = await db.storage.from("invoices").upload(path, bytes, { contentType: a.content_type });
      if (error) continue;
      stored.push({ name: a.filename, mime: a.content_type, path });
      if (!imagePath) { imagePath = path; imageMime = a.content_type; imageBytes = bytes; }
    }
  }

  // Read and check, in that order; the rules are the last word.
  let extracted: Extracted | null = null, readError: string | null = null, tap: string | null = null;
  let verdict: ReturnType<typeof check> | null = null;
  if (org && imageBytes) {
    if (!isConfigured()) readError = "Reading is not switched on for this desk yet.";
    else {
      try { extracted = await readInvoice(imageBytes, imageMime); }
      catch (e) { readError = "Mastiff could not read this one. (" + (e instanceof Error ? e.message.slice(0, 80) : "read failed") + ")"; }
    }
    if (extracted?.payee && extracted.amount) {
      verdict = check({ payee: extracted.payee, amount: extracted.amount, account_last4: extracted.account_last4, note: extracted.notes, submittedAt: new Date() }, org.vendors, org);
      tap = needsTap(extracted, verdict, verdict.vendor);
    } else tap = readError ?? (extracted ? needsTap(extracted, { verdict: "hold", reasons: [], cautions: [], vendor: null }, null) : "Forwarded by email; not read yet.");
  }

  const { data: out, error } = await db.rpc("receive_email", {
    p_secret: SECRET(), p_provider_id: d.email_id, p_from: d.from, p_to: to, p_subject: d.subject ?? null, p_body: bodyText,
    p_attachments: stored, p_org_id: org?.id ?? null, p_image_path: imagePath,
    p_extracted: extracted, p_confidence: extracted?.confidence ?? null, p_tap_reason: tap, p_read_error: readError,
    p_verdict: verdict?.verdict ?? null, p_reasons: verdict?.reasons ?? null, p_cautions: verdict?.cautions ?? null,
    p_vendor_id: verdict?.vendor?.id ?? null, p_straight_through: !!(extracted && verdict && !tap),
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  // Tell the office straight away if it held.
  const { flushNotifications } = await import("@/lib/mail");
  await flushNotifications(10).catch(() => null);
  return NextResponse.json(out);
}
