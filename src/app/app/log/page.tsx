import Link from "next/link";
import { Shell } from "@/components/Shell";
import { requireOrg, fmtMoney, fmtDate, STATUS_LABEL } from "@/lib/org";
import { createClient } from "@/lib/supabase/server";

export default async function Log({ searchParams }: { searchParams: Promise<{ holds?: string }> }) {
  const { holds } = await searchParams;
  const { session, org } = await requireOrg();
  const supabase = await createClient();
  let q = supabase.from("requests").select("id, created_at, payee, amount, account_last4, invoice_no, verdict, reasons, cautions, status, submitted_by").eq("org_id", org.id).order("created_at", { ascending: false }).limit(500);
  if (holds) q = q.eq("verdict", "hold");
  const { data: rows } = await q;
  return (
    <Shell session={session} orgName={org.name}>
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="mb-1">Log</h1>
          <p className="grey">Every request, verdict, callback and decision.</p>
        </div>
        <div className="flex gap-2">
          <Link href={holds ? "/app/log" : "/app/log?holds=1"} className="btn">{holds ? "Show all" : "Holds only"}</Link>
          <a href="/app/log/export" className="btn fill">Download CSV</a>
        </div>
      </div>
      <table className="list"><thead><tr><th>When</th><th>Payee</th><th>Amount</th><th>Last 4</th><th>Invoice</th><th>Verdict</th><th>Reason</th><th>Status</th><th>By</th></tr></thead><tbody>
        {(rows ?? []).map((r) => (
          <tr key={r.id}>
            <td className="whitespace-nowrap">{fmtDate(r.created_at)}</td>
            <td><Link href={`/app/requests/${r.id}`} className="underline">{r.payee}</Link></td>
            <td className="whitespace-nowrap">{fmtMoney(r.amount)}</td>
            <td>{r.account_last4 ?? "—"}</td>
            <td>{r.invoice_no ?? "—"}</td>
            <td>{r.verdict === "hold" ? <span className="pill dark">Hold</span> : <span className="pill">Pass</span>}</td>
            <td className="text-xs">{r.reasons[0] ?? (r.cautions[0] ? `Noted: ${r.cautions[0]}` : "")}</td>
            <td className="text-xs">{STATUS_LABEL[r.status]}</td>
            <td className="text-xs">{r.submitted_by}</td>
          </tr>
        ))}
        {!rows?.length && <tr><td colSpan={9} className="grey">Nothing logged yet.</td></tr>}
      </tbody></table>
    </Shell>
  );
}
