// Step 4: the activity feed. Everything Mastiff did for an office, newest first,
// built from the tables themselves so it can never disagree with them.

import type { SupabaseClient } from "@supabase/supabase-js";

export type Event = {
  at: string;
  who: "mastiff" | "office" | "desk";
  text: string;
  href?: string;
  requestId?: string;
};

const money = (n: number) => "$" + Number(n).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export async function buildFeed(supabase: SupabaseClient, orgId: string, limit = 40): Promise<Event[]> {
  const [{ data: reqs }, { data: intakes }, { data: mails }, { data: notes }] = await Promise.all([
    supabase.from("requests").select("id, payee, amount, verdict, reasons, status, source, submitted_by, straight_through, created_at").eq("org_id", orgId).order("created_at", { ascending: false }).limit(limit),
    supabase.from("intakes").select("id, extracted, needs_tap_because, created_by, request_id, created_at").eq("org_id", orgId).order("created_at", { ascending: false }).limit(limit),
    supabase.from("inbound_emails").select("id, from_email, subject, status, request_id, intake_id, received_at").eq("org_id", orgId).order("received_at", { ascending: false }).limit(limit),
    supabase.from("notifications").select("id, kind, to_email, subject, status, sent_at, created_at").eq("org_id", orgId).eq("status", "sent").order("sent_at", { ascending: false }).limit(limit),
  ]);
  const ids = (reqs ?? []).map((r) => r.id);
  const [{ data: calls }, { data: decs }] = ids.length ? await Promise.all([
    supabase.from("callbacks").select("id, request_id, number_called, outcome, by_name, called_at").in("request_id", ids),
    supabase.from("decisions").select("id, request_id, decision, decided_by, decided_at").in("request_id", ids),
  ]) : [{ data: [] }, { data: [] }];
  const byId = new Map((reqs ?? []).map((r) => [r.id, r]));
  const ev: Event[] = [];

  for (const r of reqs ?? []) {
    const href = `/app/requests/${r.id}`;
    const how = r.source === "photo" ? "from a photo" : r.source === "upload" ? "from an upload" : r.source === "email" ? "from a forwarded email" : r.source === "qbo" ? "pulled from QuickBooks" : `typed in by ${r.submitted_by}`;
    if (r.verdict === "hold") ev.push({ at: r.created_at, who: "mastiff", text: `Held ${r.payee}, ${money(r.amount)} (${how}): ${r.reasons[0] ?? ""}`, href, requestId: r.id });
    else if (r.straight_through) ev.push({ at: r.created_at, who: "mastiff", text: `Read ${r.payee}, ${money(r.amount)} ${how} and filed it: vendor on file, usual amount, passed the three checks.`, href, requestId: r.id });
    else ev.push({ at: r.created_at, who: "mastiff", text: `Passed ${r.payee}, ${money(r.amount)} (${how}).`, href, requestId: r.id });
  }
  for (const i of intakes ?? []) {
    const x = i.extracted as { payee?: string | null; amount?: number | null } | null;
    const what = x?.payee ? `${x.payee}${x.amount ? ", " + money(x.amount) : ""}` : "an invoice it could not read";
    ev.push({ at: i.created_at, who: "mastiff", text: `Read ${what} and asked for a look: ${i.needs_tap_because ?? ""}`, href: i.request_id ? `/app/requests/${i.request_id}` : `/app/requests/new?intake=${i.id}` });
  }
  for (const m of mails ?? []) {
    if (m.status === "no_attachment") ev.push({ at: m.received_at, who: "mastiff", text: `Email from ${m.from_email} ("${m.subject ?? ""}") had no invoice attached; nothing filed.` });
  }
  for (const c of calls ?? []) {
    const r = byId.get(c.request_id);
    if (!r) continue;
    const out = c.outcome === "confirmed" ? "they confirmed it" : c.outcome === "not_confirmed" ? "they did not request it" : "no answer, will retry";
    ev.push({ at: c.called_at, who: "desk", text: `${c.by_name} called ${r.payee} at ${c.number_called} (the number on file): ${out}.`, href: `/app/requests/${r.id}`, requestId: r.id });
  }
  for (const d of decs ?? []) {
    const r = byId.get(d.request_id);
    if (!r) continue;
    const what = d.decision === "pay" ? "pay as requested" : d.decision === "change" ? "pay to the account on file" : "not pay";
    ev.push({ at: d.decided_at, who: "office", text: `${d.decided_by} decided to ${what}: ${r.payee}, ${money(r.amount)}.`, href: `/app/requests/${r.id}`, requestId: r.id });
  }
  for (const n of notes ?? []) {
    ev.push({ at: n.sent_at ?? n.created_at, who: "mastiff", text: `Emailed ${n.to_email}: ${n.subject}` });
  }
  ev.sort((a, b) => b.at.localeCompare(a.at));
  return ev.slice(0, limit);
}
