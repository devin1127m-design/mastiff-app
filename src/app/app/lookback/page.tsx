import Link from "next/link";
import { Shell } from "@/components/Shell";
import { requireOrg, fmtMoney } from "@/lib/org";
import { createClient } from "@/lib/supabase/server";
import { runLookback } from "@/lib/actions";

export default async function Lookbacks({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  const { session, org, myName } = await requireOrg();
  const supabase = await createClient();
  const { data: runs } = await supabase.from("lookbacks").select("id, filename, created_at, payments, months, held, need_call, money").eq("org_id", org.id).order("created_at", { ascending: false });
  const action = runLookback.bind(null, org.id, myName);
  return (
    <Shell session={session} orgName={org.name}>
      <h1 className="mb-1">Look-back</h1>
      <p className="grey mb-8">Upload 12 to 18 months of payments. Mastiff shows what would have held, what looks paid twice, and what was paid in late fees. Nothing is sent anywhere; the file is read once and only the findings are kept.</p>

      <form action={action} className="card max-w-lg space-y-4 mb-10" encType="multipart/form-data">
        <h2>Upload a payment export</h2>
        <div className="field">
          <label htmlFor="file">CSV file</label>
          <input id="file" name="file" type="file" accept=".csv,text/csv" required />
          <div className="hint">QuickBooks: Reports, Transaction List by Vendor, last 18 months, Export to CSV. Or your bank's transaction download (Chase, Huntington, and the like: payee names are read out of the description). Columns it understands: date, payee or vendor, amount, and optionally method, check number, invoice, memo, account last 4. Full account numbers are cut to four on import.</div>
        </div>
        {error && <p className="text-sm">{error}</p>}
        <button className="btn fill">Run the look-back</button>
      </form>

      <h2 className="mb-3">Past runs</h2>
      {runs && runs.length ? (
        <table className="list"><thead><tr><th>When</th><th>File</th><th>Payments</th><th>Months</th><th>Would have held</th><th>Money worth checking</th></tr></thead><tbody>
          {runs.map((r) => {
            const money = r.money as { total?: number } | null;
            return (
              <tr key={r.id}>
                <td className="whitespace-nowrap">{new Date(r.created_at).toLocaleDateString()}</td>
                <td><Link href={`/app/lookback/${r.id}`} className="underline">{r.filename}</Link></td>
                <td>{r.payments}</td><td>{r.months}</td><td>{r.held}</td>
                <td>{money?.total ? fmtMoney(money.total) : "—"}</td>
              </tr>
            );
          })}
        </tbody></table>
      ) : <p className="grey">No look-backs yet.</p>}
    </Shell>
  );
}
