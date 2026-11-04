import Link from "next/link";
import { Shell } from "@/components/Shell";
import { requireOrg, fmtMoney } from "@/lib/org";
import { createClient } from "@/lib/supabase/server";
import { summarize, outcome, ADVISORY_LINE, NOT_ADVICE_LINE, SOURCE_LINE, RECORDED, NOT, type Req } from "@/lib/readout";

export default async function ReadoutPage({ searchParams }: { searchParams: Promise<{ from?: string; to?: string }> }) {
  const sp = await searchParams;
  const { session, org } = await requireOrg();
  const supabase = await createClient();
  const end = sp.to && /^\d{4}-\d{2}-\d{2}$/.test(sp.to) ? sp.to : new Date().toISOString().slice(0, 10);
  const start = sp.from && /^\d{4}-\d{2}-\d{2}$/.test(sp.from) ? sp.from : new Date(new Date(end).getTime() - 30 * 86400000).toISOString().slice(0, 10);
  const [{ data: rows }, { data: members }] = await Promise.all([
    supabase.from("requests").select("id, payee, amount, account_last4, source, submitted_by, verdict, reasons, status, straight_through, image_path, created_at, vendors(name, callback_phone, phone_on_file_since, verified_at), callbacks(called_at, number_called, who_answered, what_said, outcome, by_name), decisions(decided_at, decided_by, decision, note)")
      .eq("org_id", org.id).gte("created_at", start + "T00:00:00Z").lte("created_at", end + "T23:59:59Z").order("created_at"),
    supabase.from("memberships").select("name, role").eq("org_id", org.id),
  ]);
  const reqs: Req[] = (rows ?? []).map((r) => ({ ...r, vendor: (r.vendors as unknown as Req["vendor"]) ?? null, callbacks: (r.callbacks ?? []) as Req["callbacks"], decisions: (r.decisions ?? []) as Req["decisions"] })) as Req[];
  const ro = summarize(reqs, (members ?? []) as { name: string; role: string }[], Number(org.single_cap), start, end);
  const d = (s: string) => new Date(s.length === 10 ? s + "T00:00:00Z" : s).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });

  return (
    <Shell session={session} orgName={org.name}>
      <div className="flex items-start justify-between gap-4 mb-2 print:hidden">
        <div><p className="grey text-sm">Read-out</p><h1>{org.name}</h1></div>
        <form className="flex items-end gap-2">
          <div className="field"><label>From</label><input type="date" name="from" defaultValue={start} /></div>
          <div className="field"><label>To</label><input type="date" name="to" defaultValue={end} /></div>
          <button className="btn">Show</button>
          <Link href={`/app/readout/print?from=${start}&to=${end}`} className="btn fill" target="_blank">Print</Link>
        </form>
      </div>
      <h1 className="hidden print:block">{org.name}</h1>
      <p className="grey text-sm mb-4">{d(start)} to {d(end)}. Prepared from the office's own log.</p>

      <p className="serif text-xl border-y border-black py-3 mb-6">{ro.lineText}.</p>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <div className="card"><div className="grey text-xs uppercase tracking-wide">Checked</div><div className="serif text-3xl">{ro.checked}</div><div className="text-sm">{ro.straight} filed from a read with no tap</div></div>
        <div className="card"><div className="grey text-xs uppercase tracking-wide">Would have held</div><div className="serif text-3xl">{ro.holds}</div><div className="text-sm">{ro.open} still open</div></div>
        <div className="card"><div className="grey text-xs uppercase tracking-wide">Recorded not paid</div><div className="serif text-3xl">{fmtMoney(ro.amountNotPaid)}</div><div className="text-sm">{ro.rejected} {ro.rejected === 1 ? "payment" : "payments"}</div></div>
        <div className="card"><div className="grey text-xs uppercase tracking-wide">Verified by voice</div><div className="serif text-3xl">{ro.verifiedVendors.length}</div><div className="text-sm">vendors called back</div></div>
      </div>
      <p className="advisory mb-8">{ADVISORY_LINE} {NOT_ADVICE_LINE}</p>

      <h2 className="mb-2">Every hold</h2>
      {ro.holdRows.length ? (
        <table className="list mb-8"><thead><tr><th>Date</th><th>Payee</th><th className="text-right">Amount</th><th>Why</th><th>Called</th><th>Outcome</th><th>Decided by</th></tr></thead><tbody>
          {ro.holdRows.map((r) => <tr key={r.id}><td className="whitespace-nowrap">{d(r.created_at)}</td><td><Link href={`/app/requests/${r.id}`} className="underline print:no-underline">{r.payee}</Link></td><td className="text-right">{fmtMoney(r.amount)}</td><td className="text-sm">{r.reasons[0]}</td><td className="text-sm">{r.callbacks.length ? `${r.callbacks[0].by_name}, ${r.callbacks[0].number_called}` : "—"}</td><td className="text-sm">{outcome(r)}</td><td className="text-sm">{r.decisions[r.decisions.length - 1]?.decided_by ?? "—"}</td></tr>)}
        </tbody></table>
      ) : <p className="grey mb-8">Nothing held in this period.</p>}

      <h2 className="mb-1">Questions carriers commonly ask, and your record</h2>
      <p className="grey text-sm mb-3">{SOURCE_LINE} "Recorded" means the log shows it for every closed hold in the period; "Partly" means for some.</p>
      <table className="list mb-8"><thead><tr><th>No.</th><th>Question (verbatim)</th><th>Your record</th><th>Evidence</th></tr></thead><tbody>
        {ro.questions.map((q) => <tr key={q.num}><td>{q.num}</td><td className="text-sm">{q.text}<div className="grey text-xs mt-1">Asked by: {q.carriers}</div></td><td className="text-sm">{q.record}</td><td className="whitespace-nowrap text-sm">{q.status === RECORDED ? <span className="pill dark">{q.status}</span> : q.status === NOT ? <span className="grey">{q.status}</span> : <span className="pill">{q.status}</span>}</td></tr>)}
      </tbody></table>

      <h2 className="mb-1">The 13 log fields</h2>
      <p className="grey text-sm mb-3">What a callback log is expected to record, and how many of the {ro.closed} closed holds carry each one.</p>
      <table className="list mb-8"><thead><tr><th>No.</th><th>Field</th><th className="text-right">Filled</th><th>Note</th></tr></thead><tbody>
        {ro.fields.map((f) => <tr key={f.num}><td>{f.num}</td><td className="text-sm">{f.name}</td><td className="text-right">{f.inLog ? `${f.filled} of ${f.closed}` : "—"}</td><td className="grey text-sm">{f.note}</td></tr>)}
      </tbody></table>

      {ro.verifiedVendors.length > 0 && (<>
        <h2 className="mb-2">Vendors verified by voice</h2>
        <ul className="text-sm mb-8 columns-2">{ro.verifiedVendors.map(([name, at]) => <li key={name}>{name} <span className="grey">· {d(at)}</span></li>)}</ul>
      </>)}
      <p className="advisory">{ADVISORY_LINE}</p>
    </Shell>
  );
}
