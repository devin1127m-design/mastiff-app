// Positive pay: the office uploads this to its bank. Mastiff never sends to a bank.
import { requireOrg } from "@/lib/org";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: Request) {
  const { org } = await requireOrg();
  const supabase = await createClient();
  const since = new URL(req.url).searchParams.get("since") ?? new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
  const { data } = await supabase.from("requests").select("id, created_at, payee, amount, invoice_no, status, decisions(decided_at, decision)").eq("org_id", org.id).in("status", ["passed", "released"]).gte("created_at", since).order("created_at");
  const safe = (s: string) => { const t = (s ?? "").replace(/"/g, '""'); return /^[=+\-@]/.test(t) ? `"'${t}"` : `"${t}"`; };
  const rows = [["Issue date", "Check or reference", "Payee", "Amount", "Mastiff request"].join(",")];
  for (const r of data ?? []) {
    const decs = (r.decisions ?? []) as { decided_at: string; decision: string }[];
    const last = decs[decs.length - 1];
    if (last?.decision === "reject") continue;
    const when = (last?.decided_at ?? r.created_at).slice(0, 10);
    rows.push([when, safe(r.invoice_no ?? ""), safe(r.payee), Number(r.amount).toFixed(2), r.id].join(","));
  }
  return new Response(rows.join("\n") + "\n", { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="positive-pay-${org.slug}-${since}.csv"` } });
}
