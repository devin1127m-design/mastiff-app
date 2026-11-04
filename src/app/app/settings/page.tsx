import { Shell } from "@/components/Shell";
import { requireOrg, fmtDate } from "@/lib/org";
import { createClient } from "@/lib/supabase/server";
import { saveSettings, pullQuickBooks, disconnectQuickBooks } from "@/lib/actions";
import { qboConfigured } from "@/lib/qbo";

const QBO_MSG: Record<string, string> = {
  connected: "QuickBooks is connected. Pull when you are ready.",
  disconnected: "QuickBooks is disconnected. Nothing was changed there.",
  failed: "QuickBooks did not connect. Try again.",
  owneronly: "Only the owner can connect QuickBooks, with their own login.",
  notconfigured: "QuickBooks is not switched on for this desk yet.",
};

export default async function Settings({ searchParams }: { searchParams: Promise<{ qbo?: string; msg?: string }> }) {
  const sp = await searchParams;
  const { session, org, role, myName } = await requireOrg();
  const supabase = await createClient();
  const { data: conn } = role === "owner" ? await supabase.from("connections").select("realm_id, connected_by, connected_at, last_pulled_at, last_result").eq("org_id", org.id).eq("provider", "qbo").maybeSingle() : { data: null };
  const action = saveSettings.bind(null, org.id);
  const notice = sp.msg ?? (sp.qbo ? QBO_MSG[sp.qbo] : null);
  return (
    <Shell session={session} orgName={org.name}>
      <h1 className="mb-1">Settings</h1>
      <p className="grey mb-8">The three numbers the owner sets on day one.</p>
      {notice && <p className="card max-w-lg mb-6 text-sm">{notice}</p>}
      <form action={action} className="card max-w-lg space-y-4 mb-8">
        <div className="field"><label>Single-payment cap ($)</label><input name="single_cap" defaultValue={org.single_cap} inputMode="decimal" /><div className="hint">Any request above this holds, whoever the payee is.</div></div>
        <div className="field"><label>Range multiple</label><input name="range_multiple" defaultValue={org.range_multiple} inputMode="decimal" /><div className="hint">A request more than this many times a vendor's usual maximum holds. 2 is the default; loosen it if more than 1 in 10 requests hold.</div></div>
        <div className="grid grid-cols-2 gap-3">
          <div className="field"><label>Payment hours start</label><input name="hours_start" type="number" min={0} max={23} defaultValue={org.hours_start} /></div>
          <div className="field"><label>Payment hours end</label><input name="hours_end" type="number" min={1} max={24} defaultValue={org.hours_end} /></div>
        </div>
        <div className="field"><label>Forwarding address</label><input value={org.inbound_email} readOnly /><div className="hint">Forward vendor invoices here, or set a rule in your email to copy anything with "invoice" in the subject. Mastiff reads and checks each one.</div></div>
        <button className="btn fill">Save</button>
      </form>

      <div className="card max-w-lg space-y-3">
        <h2>QuickBooks Online</h2>
        <p className="text-sm grey">Read only. Mastiff pulls your vendor list and unpaid bills with your own QuickBooks login and checks each bill like any other request. It never writes anything back and never sees your bank.</p>
        {role !== "owner" ? (
          <p className="text-sm">Only the owner can connect this.</p>
        ) : conn ? (
          <>
            <p className="text-sm">Connected by {conn.connected_by} on {fmtDate(conn.connected_at)}.{conn.last_pulled_at && <> Last pull {fmtDate(conn.last_pulled_at)}: {conn.last_result}</>}</p>
            <div className="flex gap-2">
              <form action={pullQuickBooks.bind(null, org.id, myName)}><button className="btn fill">Pull vendors and unpaid bills</button></form>
              <form action={disconnectQuickBooks.bind(null, org.id)}><button className="btn">Disconnect</button></form>
            </div>
          </>
        ) : qboConfigured() ? (
          <a href={`/api/qbo/connect?org=${org.id}`} className="btn fill">Connect QuickBooks</a>
        ) : (
          <p className="text-sm">Not switched on for this desk yet.</p>
        )}
      </div>
    </Shell>
  );
}
