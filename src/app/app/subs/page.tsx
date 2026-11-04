import { Shell } from "@/components/Shell";
import { requireOrg, fmtMoney } from "@/lib/org";
import { createClient } from "@/lib/supabase/server";
import { saveSub, importSubs, unmarkSub } from "@/lib/actions";
import { build, SUB_ADVISORY, type Sub } from "@/lib/subs";

export default async function Subs() {
  const { session, org } = await requireOrg();
  const supabase = await createClient();
  const [{ data: vendors }, { data: paid }] = await Promise.all([
    supabase.from("vendors").select("id, name, is_sub, gl_expires, wc_expires, wc_exempt, auto_expires, additional_insured, waiver_through").eq("org_id", org.id).order("name"),
    supabase.from("requests").select("vendor_id, amount, created_at").eq("org_id", org.id).in("status", ["passed", "confirmed", "released"]).not("vendor_id", "is", null),
  ]);
  const subs = (vendors ?? []).filter((v) => v.is_sub) as Sub[];
  const others = (vendors ?? []).filter((v) => !v.is_sub);
  const rep = build(subs, (paid ?? []).map((p) => ({ vendor_id: p.vendor_id!, amount: Number(p.amount), created_at: p.created_at })));
  return (
    <Shell session={session} orgName={org.name}>
      <h1 className="mb-1">Subcontractors</h1>
      <p className="grey mb-6">Certificate dates and the last lien waiver for each sub, checked against what you have paid them. {SUB_ADVISORY}</p>

      {subs.length > 0 && (
        <>
          <p className="serif text-xl border-y border-black py-3 mb-4">{rep.line}</p>
          {rep.items.length ? (
            <table className="list mb-10"><thead><tr><th>Sub</th><th>Kind</th><th>Worth checking</th><th className="text-right">Amount</th><th>What to do</th></tr></thead><tbody>
              {rep.items.map((i, n) => <tr key={n}><td>{i.payee}</td><td className="text-sm">{i.kind}</td><td className="text-sm">{i.finding}</td><td className="text-right">{i.amount ? fmtMoney(i.amount) : ""}</td><td className="grey text-sm">{i.check}</td></tr>)}
            </tbody></table>
          ) : <p className="grey mb-10">Every sub has current certificates on file and a waiver covering what has been paid.</p>}
        </>
      )}

      <h2 className="mb-3">The register</h2>
      <p className="grey text-sm mb-3">Dates as YYYY-MM-DD. Workers' comp "exempt" for a sole proprietor with no employees. Leave a date blank if there is no certificate on file.</p>
      {subs.length ? (
        <div className="space-y-2 mb-8">
          {subs.map((s) => (
            <form key={s.id} action={saveSub.bind(null, org.id, s.id)} className="card grid grid-cols-2 md:grid-cols-7 gap-2 items-end">
              <div className="md:col-span-7 font-semibold">{s.name}</div>
              <div className="field"><label>GL expires</label><input name="gl_expires" type="date" defaultValue={s.gl_expires ?? ""} /></div>
              <div className="field"><label>WC expires</label><input name="wc_expires" type="date" defaultValue={s.wc_expires ?? ""} /></div>
              <div className="field"><label>WC exempt</label><select name="wc_exempt" defaultValue={s.wc_exempt ? "yes" : "no"}><option value="no">No</option><option value="yes">Yes</option></select></div>
              <div className="field"><label>Auto expires</label><input name="auto_expires" type="date" defaultValue={s.auto_expires ?? ""} /></div>
              <div className="field"><label>Additional insured</label><select name="additional_insured" defaultValue={s.additional_insured === null ? "" : s.additional_insured ? "yes" : "no"}><option value="">Unknown</option><option value="yes">Yes</option><option value="no">No</option></select></div>
              <div className="field"><label>Waiver through</label><input name="waiver_through" type="date" defaultValue={s.waiver_through ?? ""} /></div>
              <div className="flex gap-2"><button className="btn small fill">Save</button><button formAction={unmarkSub.bind(null, org.id, s.id)} className="btn small">Not a sub</button></div>
            </form>
          ))}
        </div>
      ) : <p className="grey mb-8">No subcontractors marked yet.</p>}

      <div className="grid md:grid-cols-2 gap-8">
        <form action={saveSub.bind(null, org.id, "")} className="card space-y-3">
          <h2>Mark a vendor as a sub</h2>
          <div className="field"><label>Vendor</label>
            <select name="vendor_id" required defaultValue=""><option value="" disabled>Choose</option>{others.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}</select>
            <div className="hint">Must be on the vendor file first.</div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="field"><label>GL expires</label><input name="gl_expires" type="date" /></div>
            <div className="field"><label>WC expires</label><input name="wc_expires" type="date" /></div>
            <div className="field"><label>Waiver through</label><input name="waiver_through" type="date" /></div>
            <div className="field"><label>Additional insured</label><select name="additional_insured" defaultValue=""><option value="">Unknown</option><option value="yes">Yes</option><option value="no">No</option></select></div>
          </div>
          <input type="hidden" name="wc_exempt" value="no" />
          <button className="btn fill">Add</button>
        </form>
        <form action={importSubs.bind(null, org.id)} className="card space-y-3">
          <h2>Paste the register</h2>
          <p className="text-sm grey">Same columns as the Mastiff template: Vendor, GL expires, WC expires, Auto expires, Additional insured, Waiver through. Vendors not on file are added.</p>
          <div className="field"><textarea name="csv" rows={6} placeholder={"Vendor,GL expires,WC expires,Auto expires,Additional insured,Waiver through\nExample Drywall LLC,2027-03-31,2027-03-31,,yes,2026-09-30"} /></div>
          <button className="btn">Import</button>
        </form>
      </div>

      <div className="card mt-8 max-w-lg">
        <h2 className="mb-1">Positive pay export</h2>
        <p className="text-sm grey mb-3">A CSV of released and passed requests (date, check or reference, payee, amount) for you to upload to your bank's positive pay. Mastiff never sends anything to a bank.</p>
        <a href="/app/log/positive-pay" className="btn">Download CSV</a>
      </div>
    </Shell>
  );
}
