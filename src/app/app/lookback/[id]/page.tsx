import Link from "next/link";
import { notFound } from "next/navigation";
import { Shell, getSession } from "@/components/Shell";
import { fmtMoney } from "@/lib/org";
import { createClient } from "@/lib/supabase/server";
import { markRow } from "@/lib/actions";
import { HELD, RULE_NAMES, type Flag, type Money } from "@/lib/lookback/scan";

const MARKS: Record<string, string> = {
  to_verify: "To verify", verified_fine: "Verified fine", legitimate_repeat: "Legitimate repeat (rent, retainer)",
  wrong_vendor_match: "Two different vendors", confirmed_issue: "Confirmed: needs action", recovered: "Recovered",
};

export default async function LookbackReport({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  const supabase = await createClient();
  const { data: lb } = await supabase.from("lookbacks").select("*, orgs(name)").eq("id", id).maybeSingle();
  if (!lb) notFound();
  const { data: marks } = await supabase.from("lookback_marks").select("*").eq("lookback_id", id);
  const markByRow = new Map((marks ?? []).map((m) => [m.row, m]));
  const membership = session.memberships.find((m) => m.org_id === lb.org_id);
  const myName = session.staffName ?? membership?.name ?? session.email;
  const org = lb.orgs as unknown as { name: string } | null;
  const flags = lb.flags as Flag[];
  const money = lb.money as Money;
  const byRow = new Map<number, Flag[]>();
  for (const f of flags) { if (!byRow.has(f.row)) byRow.set(f.row, []); byRow.get(f.row)!.push(f); }
  const rows = [...byRow.entries()].map(([row, fs]) => {
    fs.sort((a, b) => b.weight - a.weight || a.rule - b.rule);
    return { row, fs, verdict: fs.some((f) => f.verdict === HELD) ? HELD : "worth checking", first: fs[0] };
  }).sort((a, b) => b.first.weight - a.first.weight || a.first.date.localeCompare(b.first.date));
  const recovered = (marks ?? []).reduce((t, m) => t + Number(m.amount_recovered ?? 0), 0);
  const unresolved = rows.filter((r) => !markByRow.get(r.row) || markByRow.get(r.row)!.mark === "to_verify").length;
  const d = (s: string) => new Date(s + "T00:00:00Z").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });

  return (
    <Shell session={session} orgName={org?.name}>
      <div className="flex items-start justify-between gap-4 mb-2">
        <div>
          <p className="grey text-sm">Look-back · {lb.filename} · uploaded {new Date(lb.created_at).toLocaleDateString()} by {lb.uploaded_by}</p>
          <h1>{org?.name}</h1>
        </div>
        <Link href="/app/lookback" className="btn">All look-backs</Link>
      </div>
      <p className="serif text-xl border-y border-black py-3 my-4">{lb.payments} payments, {lb.months} month{lb.months === 1 ? "" : "s"} ({d(lb.first_date)} to {d(lb.last_date)}), {lb.held} would have held, {lb.need_call} need a call this week.</p>
      <p className="advisory mb-8">Mastiff flags. Your firm makes every payment decision. This report says what is worth checking, not that any payment was wrong.{lb.masked > 0 && ` ${lb.masked} account-number-like values were cut to the last four digits on import.`}{lb.skipped > 0 && ` ${lb.skipped} rows could not be read and were skipped.`}</p>

      <h2 className="mb-2">Money worth checking</h2>
      {money.total > 0 ? (
        <>
          <p className="serif text-3xl mb-1">Up to {fmtMoney(money.total)}</p>
          <p className="mb-4">{money.summary}{recovered > 0 && <> So far marked recovered: <strong>{fmtMoney(recovered)}</strong>.</>}</p>
          {money.duplicates.length > 0 && (
            <>
              <h3 className="text-base font-semibold mt-4 mb-1">Possible duplicate payments: {fmtMoney(money.duplicate_total)}</h3>
              <p className="grey text-sm mb-2">The later payment of each pair. A payment can repeat for a good reason (rent, a deposit then a balance); confirm each before asking the vendor for a credit.</p>
              <table className="list mb-4"><thead><tr><th>Vendor</th><th>First paid</th><th>Paid again</th><th className="text-right">Amount</th><th>Match</th></tr></thead><tbody>
                {money.duplicates.map((x) => <tr key={x.second_row}><td>{x.vendor}</td><td>{d(x.first_date)}</td><td>{d(x.second_date)}</td><td className="text-right">{fmtMoney(x.amount)}</td><td className="text-sm">{x.by_invoice ? "same invoice number" : "same amount, days apart"}</td></tr>)}
              </tbody></table>
            </>
          )}
          {money.late_fees.length > 0 && (
            <>
              <h3 className="text-base font-semibold mt-4 mb-1">Late fees and interest paid: {fmtMoney(money.late_total)}</h3>
              <p className="grey text-sm mb-2">Found in the payee, memo or invoice wording. Paying these bills on time stops this. A memo can mislead; check the statement.</p>
              <table className="list mb-4"><thead><tr><th>Vendor</th><th>Date</th><th className="text-right">Amount</th><th>Wording</th></tr></thead><tbody>
                {money.late_fees.map((x) => <tr key={x.row}><td>{x.vendor}</td><td>{d(x.date)}</td><td className="text-right">{fmtMoney(x.amount)}</td><td className="text-sm">"{x.matched}" in {x.field}</td></tr>)}
              </tbody></table>
            </>
          )}
        </>
      ) : <p className="grey mb-8">No payments look paid twice and no late fees were found in the wording.</p>}

      <h2 className="mt-8 mb-1">Payments worth a look</h2>
      <p className="grey text-sm mb-3">Heaviest first. {unresolved} of {rows.length} still to verify. Mark each one; the marks teach the next scan what is normal for this office.</p>
      {rows.length ? (
        <div className="space-y-3">
          {rows.map((r) => {
            const mk = markByRow.get(r.row);
            return (
              <div key={r.row} className="card">
                <div className="flex flex-wrap items-baseline justify-between gap-2 mb-2">
                  <div><span className={`pill ${r.verdict === HELD ? "dark" : ""}`}>{r.verdict === HELD ? "Would have held" : "Worth checking"}</span> <strong className="ml-2">{r.first.payee}</strong> <span className="grey">· {d(r.first.date)} · {fmtMoney(r.first.amount)}</span></div>
                  <span className="grey text-sm">{mk ? `${MARKS[mk.mark]} · ${mk.marked_by}` : "Not yet marked"}</span>
                </div>
                {r.fs.map((f, i) => (
                  <p key={i} className="text-sm mb-1"><strong>{RULE_NAMES[f.rule]}.</strong> {f.reason} <span className="grey">What to check: {f.check}</span></p>
                ))}
                <form action={markRow.bind(null, id, r.row, myName)} className="flex flex-wrap items-end gap-2 mt-3">
                  <div className="field"><label>Mark</label>
                    <select name="mark" defaultValue={mk?.mark ?? ""} className="min-w-56">
                      <option value="" disabled>Choose</option>
                      {Object.entries(MARKS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                    </select>
                  </div>
                  <div className="field"><label>Note</label><input name="note" defaultValue={mk?.note ?? ""} className="min-w-56" /></div>
                  {r.fs.some((f) => f.rule === 3) && <div className="field"><label>Recovered $</label><input name="amount_recovered" inputMode="decimal" defaultValue={mk?.amount_recovered ?? ""} className="w-28" /></div>}
                  <button className="btn small">Save</button>
                </form>
              </div>
            );
          })}
        </div>
      ) : <p className="grey">Nothing in this file would have held under Mastiff's rules, and nothing is worth a second look.</p>}

      <h2 className="mt-10 mb-2">The rules</h2>
      <p className="grey text-sm">Rules 1, 2 and 5 are the checks that would have held a payment. Rules 3, 4 and 6 are worth checking.</p>
      <ol className="text-sm mt-2 space-y-1">{Object.entries(RULE_NAMES).map(([n, name]) => <li key={n}>{n}. {name}</li>)}</ol>
      <p className="grey text-sm mt-4">Columns read: {Object.entries(lb.mapping as Record<string, string>).map(([f, h]) => `${h} → ${f.replace("_", " ")}`).join(", ")}.</p>
    </Shell>
  );
}
