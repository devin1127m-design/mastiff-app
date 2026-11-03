import Link from "next/link";
import { redirect } from "next/navigation";
import { Shell, getSession } from "@/components/Shell";
import { fmtMoney, fmtDate, STATUS_LABEL } from "@/lib/org";
import { createClient } from "@/lib/supabase/server";
import { createOrg, inviteMember, removeInvite } from "@/lib/actions";

export default async function Desk() {
  const session = await getSession();
  if (!session.isStaff) redirect("/app");
  const supabase = await createClient();
  const since = new Date(Date.now() - 7 * 86400000).toISOString();
  const [{ data: holds }, { data: orgs }, { count: weekCount }, { data: invites }, { data: members }] = await Promise.all([
    supabase.from("requests").select("id, payee, amount, created_at, reasons, status, orgs(name)").in("status", ["open", "not_confirmed", "confirmed"]).order("created_at"),
    supabase.from("orgs").select("id, name, slug, inbound_email, created_at").order("name"),
    supabase.from("requests").select("id", { count: "exact", head: true }).gte("created_at", since),
    supabase.from("invites").select("id, email, role, name, claimed_at, orgs(name)").order("created_at", { ascending: false }),
    supabase.from("memberships").select("org_id, role, name"),
  ]);
  const now = Date.now();
  return (
    <Shell session={session}>
      <div className="flex items-start justify-between gap-4 mb-8">
        <div>
          <h1>Desk</h1>
          <p className="grey">Every open hold across every office, oldest first. Answer within the hour, Monday to Friday, 7 am to 7 pm.</p>
        </div>
        <div className="card text-center min-w-28"><div className="serif text-3xl">{weekCount ?? 0}</div><div className="text-xs grey">checked this week</div></div>
      </div>

      <h2 className="mb-3">Holds queue</h2>
      {holds && holds.length ? (
        <table className="list mb-10"><thead><tr><th>Waiting</th><th>Office</th><th>Payee</th><th>Amount</th><th>Why</th><th>Status</th></tr></thead><tbody>
          {holds.map((r) => {
            const mins = Math.round((now - new Date(r.created_at).getTime()) / 60000);
            const late = r.status === "open" && mins > 60;
            return (
              <tr key={r.id}>
                <td className={late ? "font-semibold" : ""}>{mins < 60 ? `${mins} min` : `${Math.floor(mins / 60)} h ${mins % 60} m`}{late && " ⚠"}<div className="grey text-xs">{fmtDate(r.created_at)}</div></td>
                <td>{(r.orgs as unknown as { name: string } | null)?.name}</td>
                <td><Link href={`/app/requests/${r.id}`} className="underline">{r.payee}</Link></td>
                <td>{fmtMoney(r.amount)}</td>
                <td className="text-sm">{r.reasons[0]}</td>
                <td className="text-sm">{STATUS_LABEL[r.status]}</td>
              </tr>
            );
          })}
        </tbody></table>
      ) : <p className="grey mb-10">Queue is empty.</p>}

      <h2 className="mb-3">Offices</h2>
      <table className="list mb-6"><thead><tr><th>Office</th><th>Forwarding address</th><th>Since</th></tr></thead><tbody>
        {(orgs ?? []).map((o) => <tr key={o.id}><td>{o.name}</td><td>{o.inbound_email}</td><td>{new Date(o.created_at).toLocaleDateString()}</td></tr>)}
        {!orgs?.length && <tr><td colSpan={3} className="grey">No offices yet.</td></tr>}
      </tbody></table>
      <div className="grid md:grid-cols-2 gap-8">
      <form action={createOrg} className="card space-y-3">
        <h2>Add an office</h2>
        <div className="field"><label>Office name</label><input name="name" required placeholder="Oakland Builders" /></div>
        <div className="field"><label>Short name (for the forwarding address)</label><input name="slug" required placeholder="oaklandbuilders" pattern="[a-z0-9-]+" /><div className="hint">Lowercase letters, numbers and dashes. Becomes name@requests.mastiff.app.</div></div>
        <button className="btn fill">Add office</button>
      </form>
      <form action={inviteMember} className="card space-y-3">
        <h2>Invite a person to an office</h2>
        <div className="field"><label>Office</label>
          <select name="org_id" required defaultValue="">
            <option value="" disabled>Choose</option>
            {(orgs ?? []).map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="field"><label>Name</label><input name="name" required placeholder="Linda Carter" /></div>
          <div className="field"><label>Role</label>
            <select name="role" defaultValue="bookkeeper">
              <option value="bookkeeper">Bookkeeper (submits requests)</option>
              <option value="approver">Second person (signs off)</option>
              <option value="owner">Owner (both)</option>
            </select>
          </div>
        </div>
        <div className="field"><label>Email</label><input name="email" type="email" required /><div className="hint">They sign in at this site with this email and a 6-digit code. Nothing else to set up.</div></div>
        <button className="btn fill">Invite</button>
      </form>
      </div>

      <h2 className="mt-10 mb-3">People</h2>
      <table className="list"><thead><tr><th>Office</th><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th></th></tr></thead><tbody>
        {(invites ?? []).map((i) => (
          <tr key={i.id}>
            <td>{(i.orgs as unknown as { name: string } | null)?.name}</td><td>{i.name}</td><td>{i.email}</td><td>{i.role}</td>
            <td className="text-sm">{i.claimed_at ? "Signed in" : "Invited, not yet signed in"}</td>
            <td>{!i.claimed_at && <form action={removeInvite.bind(null, i.id)}><button className="btn small">Cancel</button></form>}</td>
          </tr>
        ))}
        {!invites?.length && <tr><td colSpan={6} className="grey">Nobody invited yet. {members?.length ?? 0} membership{(members?.length ?? 0) === 1 ? "" : "s"} exist.</td></tr>}
      </tbody></table>
    </Shell>
  );
}
