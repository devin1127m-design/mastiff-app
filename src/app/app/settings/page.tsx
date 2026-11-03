import { Shell } from "@/components/Shell";
import { requireOrg } from "@/lib/org";
import { saveSettings } from "@/lib/actions";

export default async function Settings() {
  const { session, org } = await requireOrg();
  const action = saveSettings.bind(null, org.id);
  return (
    <Shell session={session} orgName={org.name}>
      <h1 className="mb-1">Settings</h1>
      <p className="grey mb-8">The three numbers the owner sets on day one.</p>
      <form action={action} className="card max-w-lg space-y-4">
        <div className="field"><label>Single-payment cap ($)</label><input name="single_cap" defaultValue={org.single_cap} inputMode="decimal" /><div className="hint">Any request above this holds, whoever the payee is.</div></div>
        <div className="field"><label>Range multiple</label><input name="range_multiple" defaultValue={org.range_multiple} inputMode="decimal" /><div className="hint">A request more than this many times a vendor's usual maximum holds. 2 is the default; loosen it if more than 1 in 10 requests hold.</div></div>
        <div className="grid grid-cols-2 gap-3">
          <div className="field"><label>Payment hours start</label><input name="hours_start" type="number" min={0} max={23} defaultValue={org.hours_start} /></div>
          <div className="field"><label>Payment hours end</label><input name="hours_end" type="number" min={1} max={24} defaultValue={org.hours_end} /></div>
        </div>
        <div className="field"><label>Forwarding address</label><input value={org.inbound_email} readOnly /><div className="hint">Forward vendor invoices here, or set a rule in your email to copy anything with "invoice" in the subject. Mastiff enters it for you.</div></div>
        <button className="btn fill">Save</button>
      </form>
    </Shell>
  );
}
