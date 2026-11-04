// Step 10: a bookkeeping firm sees all its client offices in one view.
import Link from "next/link";
import { redirect } from "next/navigation";
import { Shell, getSession } from "@/components/Shell";
import { fmtMoney, fmtDate } from "@/lib/org";
import { createClient } from "@/lib/supabase/server";

export default async function Partner() {
  const session = await getSession();
  const supabase = await createClient();
  const { data: partners } = await supabase.from("partners").select("id, name, partner_members(user_id)").order("name");
  const mine = (partners ?? []).filter((p) => session.isStaff || (p.partner_members as { user_id: string }[]).some((m) => m.user_id === session.userId));
  if (!mine.length) redirect(session.isStaff ? "/desk" : "/app");
  const ids = mine.map((p) => p.id);
  const since = new Date(Date.now() - 7 * 86400000).toISOString();
  const { data: orgs } = await supabase.from("orgs").select("id, name, slug, partner_id, created_at").in("partner_id", ids).order("name");
  const orgIds = (orgs ?? []).map((o) => o.id);
  const [{ data: open }, { data: week }, { data: intakes }, { data: last }] = orgIds.length ? await Promise.all([
    supabase.from("requests").select("id, org_id, payee, amount, created_at, reasons, status").in("org_id", orgIds).in("status", ["open", "confirmed", "not_confirmed"]).order("created_at"),
    supabase.from("requests").select("org_id, verdict").in("org_id", orgIds).gte("created_at", since),
    supabase.from("intakes").select("id, org_id").in("org_id", orgIds).is("request_id", null),
    supabase.from("requests").select("org_id, created_at").in("org_id", orgIds).order("created_at", { ascending: false }).limit(500),
  ]) : [{ data: [] }, { data: [] }, { data: [] }, { data: [] }];
  const count = (rows: { org_id: string }[] | null, id: string) => (rows ?? []).filter((r) => r.org_id === id).length;
  const lastAt = new Map<string, string>();
  for (const r of last ?? []) if (!lastAt.has(r.org_id)) lastAt.set(r.org_id, r.created_at);
  const byOrg = new Map((orgs ?? []).map((o) => [o.id, o.name]));

  return (
    <Shell session={session}>
      <h1 className="mb-1">{mine.map((p) => p.name).join(", ")}</h1>
      <p className="grey mb-8">Every client office in one view. Open an office to work it exactly as its bookkeeper would.</p>

      <h2 className="mb-3">Holds across all offices</h2>
      {open && open.length ? (
        <table className="list mb-10"><thead><tr><th>Office</th><th>When</th><th>Payee</th><th>Amount</th><th>Why</th></tr></thead><tbody>
          {open.map((r) => <tr key={r.id}><td>{byOrg.get(r.org_id)}</td><td className="whitespace-nowrap">{fmtDate(r.created_at)}</td><td><Link href={`/app/requests/${r.id}`} className="underline">{r.payee}</Link></td><td>{fmtMoney(r.amount)}</td><td className="text-sm">{r.reasons[0]}</td></tr>)}
        </tbody></table>
      ) : <p className="grey mb-10">Nothing is waiting in any office.</p>}

      <h2 className="mb-3">Offices</h2>
      <table className="list"><thead><tr><th>Office</th><th>This week</th><th>Held</th><th>Open</th><th>Waiting for a look</th><th>Last request</th><th></th></tr></thead><tbody>
        {(orgs ?? []).map((o) => {
          const w = (week ?? []).filter((r) => r.org_id === o.id);
          return <tr key={o.id}><td>{o.name}</td><td>{w.length}</td><td>{w.filter((r) => r.verdict === "hold").length}</td><td>{count(open, o.id)}</td><td>{count(intakes, o.id)}</td><td className="text-sm">{lastAt.get(o.id) ? fmtDate(lastAt.get(o.id)!) : <span className="grey">none yet</span>}</td><td><Link href={`/app/switch?org=${o.id}`} className="btn small">Open</Link></td></tr>;
        })}
        {!orgs?.length && <tr><td colSpan={7} className="grey">No client offices are attached yet. Mastiff attaches them from the Desk.</td></tr>}
      </tbody></table>
    </Shell>
  );
}
