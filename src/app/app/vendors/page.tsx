import { Shell } from "@/components/Shell";
import { requireOrg } from "@/lib/org";
import { createClient } from "@/lib/supabase/server";
import { addVendor, importVendors, deleteVendor } from "@/lib/actions";

export default async function Vendors() {
  const { session, org } = await requireOrg();
  const supabase = await createClient();
  const { data: vendors } = await supabase.from("vendors").select("*").eq("org_id", org.id).order("name");
  const add = addVendor.bind(null, org.id);
  const imp = importVendors.bind(null, org.id);
  return (
    <Shell session={session} orgName={org.name}>
      <h1 className="mb-1">Vendor file</h1>
      <p className="grey mb-8">Everyone you pay, the number you already call them on, and the last four digits of their account. Nothing longer is ever stored.</p>

      <div className="grid md:grid-cols-2 gap-8 mb-10">
        <form action={add} className="card space-y-3">
          <h2>Add a vendor</h2>
          <div className="field"><label>Name</label><input name="name" required /></div>
          <div className="grid grid-cols-2 gap-3">
            <div className="field"><label>Callback phone</label><input name="callback_phone" placeholder="248-555-0100" /><div className="hint">The number already in use. Never one from an email.</div></div>
            <div className="field"><label>On file since</label><input name="phone_on_file_since" type="date" /></div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="field"><label>Account last 4</label><input name="account_last4" inputMode="numeric" maxLength={4} pattern="[0-9]{4}" placeholder="4471" /></div>
            <div className="field"><label>Usual min $</label><input name="usual_min" inputMode="decimal" /></div>
            <div className="field"><label>Usual max $</label><input name="usual_max" inputMode="decimal" /></div>
          </div>
          <div className="field"><label>Notes</label><input name="notes" /></div>
          <button className="btn fill">Add vendor</button>
        </form>
        <form action={imp} className="card space-y-3">
          <h2>Import from a spreadsheet</h2>
          <p className="text-sm grey">Paste CSV with a header row. Columns it understands: Vendor (or Name), Phone, Last4 (or Account). Full account numbers are cut to the last four on import.</p>
          <div className="field"><textarea name="csv" rows={8} placeholder={"Vendor,Phone,Last4\nRay's Drywall,248-555-0101,2208\nMetro Fasteners,248-555-0102,9931"} /></div>
          <button className="btn">Import</button>
        </form>
      </div>

      <table className="list"><thead><tr><th>Vendor</th><th>Callback</th><th>Last 4</th><th>Usual</th><th>Verified</th><th></th></tr></thead><tbody>
        {(vendors ?? []).map((v) => (
          <tr key={v.id}>
            <td>{v.name}{v.notes && <div className="grey text-xs">{v.notes}</div>}</td>
            <td>{v.callback_phone ?? <span className="grey">missing</span>}{v.phone_on_file_since && <div className="grey text-xs">since {v.phone_on_file_since}</div>}</td>
            <td>{v.account_last4 ? `····${v.account_last4}` : <span className="grey">—</span>}</td>
            <td className="text-sm">{v.usual_min || v.usual_max ? `$${Number(v.usual_min ?? 0).toLocaleString()} – $${Number(v.usual_max ?? 0).toLocaleString()}` : <span className="grey">—</span>}</td>
            <td className="text-sm">{v.verified_at ? <>by voice, {new Date(v.verified_at).toLocaleDateString()}<div className="grey text-xs">{v.verified_by}</div></> : <span className="grey">not yet</span>}</td>
            <td><form action={deleteVendor.bind(null, org.id, v.id)}><button className="btn small">Remove</button></form></td>
          </tr>
        ))}
        {!vendors?.length && <tr><td colSpan={6} className="grey">No vendors yet. Add one or paste your list.</td></tr>}
      </tbody></table>
    </Shell>
  );
}
