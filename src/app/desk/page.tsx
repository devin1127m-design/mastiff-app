import Link from "next/link";
import { redirect } from "next/navigation";
import { Shell, getSession } from "@/components/Shell";
import { fmtMoney, fmtDate, STATUS_LABEL } from "@/lib/org";
import { createClient } from "@/lib/supabase/server";
import { createOrg } from "@/lib/actions";

export default async function Desk() {
  const session = await getSession();
  if (!session.isStaff) redirect("/app");
  const supabase = await createClient();
  const since = new Date(Date.now() - 7 * 86400000).toISOString();
  const [{ data: holds }, { data: orgs }, { count: weekCount }] = await Promise.all([
    supabase.from("requests").select("id, payee, amount, created_at, reasons, status, orgs(name)").in("status", ["open", "not_confirmed", "confirmed"]).order("created_at"),
    supabase.from("orgs").select("id, name, slug, inbound_email, created_at").order("name"),
    supabase.from("requests").select("id", { count: "exact", head: true }).gte("created_at", since),
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
      <form action={createOrg} className="card max-w-md space-y-3">
        <h2>Add an office</h2>
        <div className="field"><label>Office name</label><input name="name" required placeholder="Oakland Builders" /></div>
        <div className="field"><label>Short name (for the forwarding address)</label><input name="slug" required placeholder="oaklandbuilders" pattern="[a-z0-9-]+" /><div className="hint">Lowercase letters, numbers and dashes. Becomes name@requests.mastiff.app.</div></div>
        <button className="btn fill">Add office</button>
        <p className="advisory">Then add the bookkeeper and the second person in Supabase: Authentication → invite by email, and a row in memberships (owner, bookkeeper or approver). A self-serve invite screen comes next.</p>
      </form>
    </Shell>
  );
}
