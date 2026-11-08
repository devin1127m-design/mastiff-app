"use client";

// The look-back, run entirely in the browser. The file is read here, scanned here,
// and never sent anywhere. Same code as the app's look-back; no account, no upload.

import { useState } from "react";
import Link from "next/link";
import { readPayments, LookbackError, type ImportResult } from "@/lib/lookback/importer";
import { scan, findMoney, summarize, HELD, RULE_NAMES, type Flag, type Money, type Summary } from "@/lib/lookback/scan";

const money = (n: number) => "$" + Number(n).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const d = (s: string) => new Date(s + "T00:00:00Z").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });

type Result = { name: string; res: ImportResult; flags: Flag[]; money: Money; sum: Summary };

export function LocalScan() {
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onFile(file: File | undefined) {
    if (!file) return;
    setError(null); setResult(null); setBusy(true);
    try {
      const text = await file.text();
      const res = readPayments(text);
      const flags = scan(res.items);
      const mon = findMoney(res.items);
      const sum = summarize(res.items, flags);
      setResult({ name: file.name, res, flags, money: mon, sum });
    } catch (e) {
      setError(e instanceof LookbackError ? e.message : "Could not read that file. Export it as CSV and try again.");
    } finally { setBusy(false); }
  }

  if (!result) {
    return (
      <div className="ticket form">
        <h2>Pick your payment export</h2>
        <p className="grey">QuickBooks: Reports → Transaction List by Vendor → last 18 months → Export to CSV. Or your bank's transaction download. The file is read on this page and nowhere else.</p>
        <div className="field">
          <label htmlFor="csv">CSV file</label>
          <input id="csv" type="file" accept=".csv,text/csv,text/plain" onChange={(e) => onFile(e.target.files?.[0])} disabled={busy} />
        </div>
        {busy && <p className="text-sm">Reading…</p>}
        {error && <p className="text-sm">{error}</p>}
        <p className="advisory">Nothing is uploaded. You can turn your wifi off first and it still works. Close the tab and it is gone.</p>
      </div>
    );
  }

  const { res, flags, money: mon, sum } = result;
  const byRow = new Map<number, Flag[]>();
  for (const f of flags) { if (!byRow.has(f.row)) byRow.set(f.row, []); byRow.get(f.row)!.push(f); }
  const rows = [...byRow.entries()].map(([row, fs]) => { fs.sort((a, b) => b.weight - a.weight || a.rule - b.rule); return { row, fs, held: fs.some((f) => f.verdict === HELD), first: fs[0] }; })
    .sort((a, b) => b.first.weight - a.first.weight || a.first.date.localeCompare(b.first.date));
  const bankMode = res.bankMode;

  return (
    <div className="scan-report">
      <div className="row-between print:hidden" style={{ marginBottom: 12 }}>
        <p className="grey text-sm">{result.name} · read on this page only</p>
        <div className="row gap">
          <button className="btn" onClick={() => window.print()}>Print</button>
          <button className="btn" onClick={() => setResult(null)}>Another file</button>
        </div>
      </div>
      <p className="serif text-xl border-y border-black py-3 my-4">{sum.payments} payments, {sum.months} month{sum.months === 1 ? "" : "s"} ({d(sum.first)} to {d(sum.last)}), {sum.held} would have held, {sum.need_call} worth a call.</p>
      {bankMode && <p className="text-sm mb-4">This is a bank export, so payee names were read out of the description line and checks show only a number. Invoice wording and the vendor's account on file are not in a bank file, so late fees and account changes are not checked here; the books export covers those.</p>}
      <p className="advisory mb-6">Mastiff flags. Your firm makes every payment decision. This report says what is worth checking, not that any payment was wrong.{res.masked > 0 && ` ${res.masked} account-number-like values were cut to the last four digits as the file was read.`}{res.skipped.length > 0 && ` ${res.skipped.length} rows could not be read and were skipped.`}</p>

      <h2 className="mb-2">Money worth checking</h2>
      {mon.total > 0 ? (
        <>
          <p className="serif text-3xl mb-1">Up to {money(mon.total)}</p>
          <p className="mb-4">{mon.summary}</p>
          {mon.duplicates.length > 0 && (<>
            <h3 className="text-base font-semibold mt-4 mb-1">Possible duplicate payments: {money(mon.duplicate_total)}</h3>
            <p className="grey text-sm mb-2">The later payment of each pair. A payment can repeat for a good reason (rent, a deposit then a balance); confirm each before asking the vendor for a credit.</p>
            <table className="list mb-4"><thead><tr><th>Vendor</th><th>First paid</th><th>Paid again</th><th className="text-right">Amount</th><th>Match</th></tr></thead><tbody>
              {mon.duplicates.map((x) => <tr key={x.second_row}><td>{x.vendor}</td><td>{d(x.first_date)}</td><td>{d(x.second_date)}</td><td className="text-right">{money(x.amount)}</td><td className="text-sm">{x.by_invoice ? "same invoice number" : "same amount, days apart"}</td></tr>)}
            </tbody></table>
          </>)}
          {mon.late_fees.length > 0 && (<>
            <h3 className="text-base font-semibold mt-4 mb-1">Late fees and interest paid: {money(mon.late_total)}</h3>
            <table className="list mb-4"><thead><tr><th>Vendor</th><th>Date</th><th className="text-right">Amount</th><th>Wording</th></tr></thead><tbody>
              {mon.late_fees.map((x) => <tr key={x.row}><td>{x.vendor}</td><td>{d(x.date)}</td><td className="text-right">{money(x.amount)}</td><td className="text-sm">"{x.matched}" in {x.field}</td></tr>)}
            </tbody></table>
          </>)}
        </>
      ) : <p className="grey mb-6">No payments look paid twice and no late fees were found in the wording.</p>}

      <h2 className="mt-8 mb-1">Payments worth a look</h2>
      <p className="grey text-sm mb-3">Heaviest first. {rows.length} of {sum.payments}.</p>
      {rows.length ? (
        <div className="space-y-3">
          {rows.map((r) => (
            <div key={r.row} className="card">
              <div className="flex flex-wrap items-baseline justify-between gap-2 mb-2">
                <div><span className={`pill ${r.held ? "dark" : ""}`}>{r.held ? "Would have held" : "Worth checking"}</span> <strong className="ml-2">{r.first.payee}</strong> <span className="grey">· {d(r.first.date)} · {money(r.first.amount)}</span></div>
              </div>
              {r.fs.map((f, i) => <p key={i} className="text-sm mb-1"><strong>{RULE_NAMES[f.rule]}.</strong> {f.reason} <span className="grey">What to check: {f.check}</span></p>)}
            </div>
          ))}
        </div>
      ) : <p className="grey">Nothing in this file would have held under Mastiff's rules, and nothing is worth a second look.</p>}

      <h2 className="mt-10 mb-2">The rules</h2>
      <p className="grey text-sm">Rules 1, 2 and 5 are the checks that would have held a payment. Rules 3, 4 and 6 are worth checking.</p>
      <ol className="text-sm mt-2 space-y-1">{Object.entries(RULE_NAMES).map(([n, name]) => <li key={n}>{n}. {name}</li>)}</ol>
      <p className="grey text-sm mt-4">Columns read: {Object.entries(res.mapping).map(([f, h]) => `${h} → ${f.replace("_", " ")}`).join(", ")}.</p>

      <div className="ticket mt-10 print:hidden">
        <h2>Want this on every payment, before it goes out?</h2>
        <p className="lead">The live check does the same three rules on each bill as it arrives, and calls the vendor when one holds. Free for thirty days.</p>
        <Link href="/pilot" className="btn fill lg">Start a free pilot</Link>
      </div>
      <p className="advisory mt-6">Mastiff flags. Your firm makes every payment decision.</p>
    </div>
  );
}
