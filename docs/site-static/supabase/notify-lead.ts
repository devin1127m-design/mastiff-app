// Supabase Edge Function (Deno). Called by a Database Webhook on INSERT into public.leads.
// Sends Devin an email through Resend. Keys come from secrets; nothing is hard-coded.
// Secrets: RESEND_API_KEY, NOTIFY_TO, optional NOTIFY_FROM (an address on your verified domain).

const esc = (v: unknown) =>
  String(v ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]!));

Deno.serve(async (req) => {
  const apiKey = Deno.env.get("RESEND_API_KEY");
  const to = Deno.env.get("NOTIFY_TO");
  const from = Deno.env.get("NOTIFY_FROM") ?? "Mastiff <onboarding@resend.dev>";
  if (!apiKey || !to) return new Response("missing secrets", { status: 500 });

  let payload: { type?: string; record?: Record<string, unknown> };
  try {
    payload = await req.json();
  } catch {
    return new Response("bad request", { status: 400 });
  }
  const r = payload.record;
  if (payload.type !== "INSERT" || !r) return new Response("ignored", { status: 200 });

  const html =
    `<p>New pilot request.</p><ul>` +
    `<li>Name: ${esc(r.name)}</li><li>Firm: ${esc(r.firm)}</li>` +
    `<li>Email: ${esc(r.email)}</li><li>Phone: ${esc(r.phone)}</li>` +
    `<li>Payments per month: ${esc(r.payments_per_month)}</li>` +
    `<li>Note: ${esc(r.note)}</li><li>Source: ${esc(r.source)}</li></ul>`;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({ from, to: [to], subject: `Mastiff pilot request: ${String(r.firm ?? "")}`, html }),
  });
  return new Response(res.ok ? "sent" : "send failed", { status: res.ok ? 200 : 502 });
});
