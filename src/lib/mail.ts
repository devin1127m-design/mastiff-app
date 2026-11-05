// Mail out (step 2). Notifications are rows in `notifications`; this sends the
// pending ones through Resend and marks them. Silence means Pass: only holds,
// callback results and the Monday digest are ever sent.
//
// Env: RESEND_API_KEY, MAIL_FROM (e.g. "Mastiff <desk@mastiff.app>"),
// MASTIFF_INBOUND_SECRET (matches webhook_secrets.inbound in the database).

import { createClient as createPlain } from "@supabase/supabase-js";

export function plainClient() {
  return createPlain(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, { auth: { persistSession: false, autoRefreshToken: false } });
}
export const SECRET = () => process.env.MASTIFF_INBOUND_SECRET ?? "";
export const mailConfigured = () => !!process.env.RESEND_API_KEY && !!process.env.MAIL_FROM;

export async function sendMail(to: string, subject: string, text: string): Promise<{ ok: boolean; error?: string }> {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: process.env.MAIL_FROM, to: [to], subject, text }),
  });
  if (res.ok) return { ok: true };
  return { ok: false, error: `${res.status} ${(await res.text()).slice(0, 200)}` };
}

// Send what is pending. Safe to call after any action; does nothing until mail is configured.
export async function flushNotifications(limit = 50): Promise<{ sent: number; failed: number; pending: number; configured: boolean }> {
  if (!SECRET()) return { sent: 0, failed: 0, pending: 0, configured: false };
  const db = plainClient();
  const { data: rows, error } = await db.rpc("notifications_take", { p_secret: SECRET(), p_limit: limit });
  if (error || !rows) return { sent: 0, failed: 0, pending: 0, configured: mailConfigured() };
  if (!mailConfigured()) return { sent: 0, failed: 0, pending: rows.length, configured: false };
  let sent = 0, failed = 0;
  for (const n of rows as { id: string; to_email: string; subject: string; body: string }[]) {
    const r = await sendMail(n.to_email, n.subject, n.body);
    await db.rpc("notifications_mark", { p_secret: SECRET(), p_id: n.id, p_status: r.ok ? "sent" : "failed", p_error: r.error ?? null });
    if (r.ok) sent++; else failed++;
  }
  return { sent, failed, pending: 0, configured: true };
}

const money = (n: number) => "$" + Number(n).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// The Monday digest: one email per person per office. Plain text, reads like a note from the desk.
export function composeDigest(orgName: string, name: string, c: { checked: number; passed: number; held: number; open: number; waiting: number; holds: { payee: string; amount: number; reason: string | null; status: string }[] }): { subject: string; body: string } {
  const lines: string[] = [];
  lines.push(`${name},`, "");
  lines.push(`Last week at ${orgName}: ${c.checked} payment request${c.checked === 1 ? "" : "s"} checked, ${c.passed} passed, ${c.held} would have held.`);
  if (c.held === 0) lines.push("Nothing held. Pay as usual.");
  else {
    lines.push("", "What held:");
    for (const h of c.holds) lines.push(`- ${h.payee}, ${money(h.amount)}: ${h.reason ?? ""} (${h.status.replace("_", " ")})`);
  }
  if (c.open > 0) lines.push("", `${c.open} hold${c.open === 1 ? " is" : "s are"} still waiting for your decision: https://mastiffdesk.com/app`);
  if (c.waiting > 0) lines.push("", `${c.waiting} invoice${c.waiting === 1 ? "" : "s"} Mastiff read ${c.waiting === 1 ? "is" : "are"} waiting for a look: https://mastiffdesk.com/app`);
  lines.push("", "Mastiff flags. Your firm makes every payment decision.", "", "— The Mastiff desk");
  return { subject: `Mastiff, week of ${new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" })}: ${c.held === 0 ? "nothing held" : `${c.held} held`}`, body: lines.join("\n") };
}
