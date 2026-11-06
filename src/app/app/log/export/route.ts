import { createClient } from "@/lib/supabase/server";

function csv(v: unknown) {
  const s = v == null ? "" : String(v);
  const v = /^[=+\-@\t\r]/.test(s) ? "'" + s : s; // never let a payee name run as a spreadsheet formula
  return /[",\n']/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
}

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new Response("Sign in", { status: 401 });
  const { data: m } = await supabase.from("memberships").select("org_id, orgs(slug)").eq("user_id", user.id).limit(1).maybeSingle();
  if (!m) return new Response("No office", { status: 403 });
  const { data: rows } = await supabase.from("requests")
    .select("created_at, payee, amount, account_last4, invoice_no, source, submitted_by, verdict, reasons, cautions, status, callbacks(called_at, number_called, who_answered, what_said, outcome, by_name), decisions(decided_at, decision, decided_by, note)")
    .eq("org_id", m.org_id).order("created_at", { ascending: false });
  const head = ["Submitted", "Payee", "Amount", "Account last 4", "Invoice", "Source", "Submitted by", "Verdict", "Reasons", "Cautions", "Status", "Callback at", "Number called", "Who answered", "What they said", "Callback outcome", "Called by", "Decided at", "Decision", "Decided by", "Decision note"];
  const lines = [head.join(",")];
  type CB = { called_at: string; number_called: string; who_answered: string | null; what_said: string | null; outcome: string; by_name: string };
  type DC = { decided_at: string; decision: string; decided_by: string; note: string | null };
  for (const r of rows ?? []) {
    const cb = ((r.callbacks as CB[]) ?? []).slice(-1)[0];
    const dc = ((r.decisions as DC[]) ?? []).slice(-1)[0];
    lines.push([
      r.created_at, r.payee, r.amount, r.account_last4, r.invoice_no, r.source, r.submitted_by, r.verdict,
      (r.reasons as string[]).join(" | "), (r.cautions as string[]).join(" | "), r.status,
      cb?.called_at, cb?.number_called, cb?.who_answered, cb?.what_said, cb?.outcome, cb?.by_name,
      dc?.decided_at, dc?.decision, dc?.decided_by, dc?.note,
    ].map(csv).join(","));
  }
  const slug = (m.orgs as unknown as { slug: string } | null)?.slug ?? "office";
  return new Response(lines.join("\n"), {
    headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="mastiff-log-${slug}.csv"` },
  });
}
