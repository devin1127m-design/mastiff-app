import Link from "next/link";
import { Shell } from "@/components/Shell";
import { requireOrg, fmtMoney, fmtDate, STATUS_LABEL } from "@/lib/org";
import { createClient } from "@/lib/supabase/server";
import { buildFeed } from "@/lib/feed";

export default async function OrgHome() {
  const { session, org } = await requireOrg();
  const supabase = await createClient();
  const since = new Date(Date.now() - 7 * 86400000).toISOString();
  const [{ data: open }, { data: recent }, { count: weekCount }, { count: vendorCount }, { count: verifiedCount }, { data: intakes }] = await Promise.all([
    supabase.from("requests").select("id, payee, amount, created_at, reasons, status").eq("org_id", org.id).in("status", ["open", "confirmed", "not_confirmed"]).order("created_at"),
    supabase.from("requests").select("id, payee, amount, created_at, verdict, status").eq("org_id", org.id).order("created_at", { ascending: false }).limit(10),
    supabase.from("requests").select("id", { count: "exact", head: true }).eq("org_id", org.id).gte("created_at", since),
    supabase.from("vendors").select("id", { count: "exact", head: true }).eq("org_id", org.id),
    supabase.from("vendors").select("id", { count: "exact", head: true }).eq("org_id", org.id).not("verified_at", "is", null),
    supabase.from("intakes").select("id, created_at, created_by, extracted, needs_tap_because").eq("org_id", org.id).is("request_id", null).order("created_at", { ascending: false }),
  ]);
  const feed = await buildFeed(supabase, org.id, 25);
  return (
    <Shell session={session} orgName={org.name}>
      <div className="flex items-start justify-between gap-4 mb-8">
        <div>
          <h1>{org.name}</h1>
          <p className="grey">Forward invoices to <strong className="text-black">{org.inbound_email}</strong>, or enter one below.</p>
        </div>
        <div className="flex gap-2"><Link href="/app/lookback" className="btn">Look-back</Link><Link href="/app/requests/new" className="btn fill">Send an invoice</Link></div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
        <div className="card"><div className="grey text-xs uppercase tracking-wide">This week</div><div className="serif text-3xl">{weekCount ?? 0}</div><div className="text-sm">requests checked</div></div>
        <div className="card"><div className="grey text-xs uppercase tracking-wide">Needs you</div><div className="serif text-3xl">{open?.length ?? 0}</div><div className="text-sm">holds waiting</div></div>
        <div className="card"><div className="grey text-xs uppercase tracking-wide">Vendors</div><div className="serif text-3xl">{vendorCount ?? 0}</div><div className="text-sm">on file</div></div>
        <div className="card"><div className="grey text-xs uppercase tracking-wide">Verified</div><div className="serif text-3xl">{verifiedCount ?? 0}</div><div className="text-sm">confirmed by voice</div></div>
      </div>

      {intakes && intakes.length > 0 && (
        <>
          <h2 className="mb-3">Waiting for a look</h2>
          <table className="list mb-10"><thead><tr><th>When</th><th>Read as</th><th>Why</th><th></th></tr></thead><tbody>
            {intakes.map((i) => {
              const x = i.extracted as { payee?: string | null; amount?: number | null } | null;
              return <tr key={i.id}><td>{fmtDate(i.created_at)}</td><td>{x?.payee ? `${x.payee}${x.amount ? " · " + fmtMoney(x.amount) : ""}` : <span className="grey">could not read</span>}</td><td className="text-sm">{i.needs_tap_because}</td><td><Link href={`/app/requests/new?intake=${i.id}`} className="btn small">Confirm</Link></td></tr>;
            })}
          </tbody></table>
        </>
      )}

      <h2 className="mb-3">Holds</h2>
      {open && open.length ? (
        <table className="list mb-10"><thead><tr><th>When</th><th>Payee</th><th>Amount</th><th>Why</th><th>Status</th></tr></thead><tbody>
          {open.map((r) => (
            <tr key={r.id}><td>{fmtDate(r.created_at)}</td><td><Link href={`/app/requests/${r.id}`} className="underline">{r.payee}</Link></td><td>{fmtMoney(r.amount)}</td><td className="text-sm">{r.reasons[0]}</td><td className="text-sm">{STATUS_LABEL[r.status]}</td></tr>
          ))}
        </tbody></table>
      ) : <p className="grey mb-10">Nothing is waiting. Every request on file has passed or been decided.</p>}

      <div className="grid md:grid-cols-[1fr_360px] gap-8 mb-10 items-start">
        <div>
          <h2 className="mb-3">What Mastiff did</h2>
          {feed.length ? (
            <ol className="space-y-2">
              {feed.map((e, i) => (
                <li key={i} className="text-sm flex gap-3 border-b hair pb-2">
                  <span className="grey whitespace-nowrap w-24 shrink-0">{fmtDate(e.at)}</span>
                  <span className={`pill shrink-0 ${e.who === "mastiff" ? "dark" : ""}`}>{e.who === "mastiff" ? "Mastiff" : e.who === "desk" ? "Desk" : "Office"}</span>
                  <span>{e.href ? <Link href={e.href} className="underline-offset-2 hover:underline">{e.text}</Link> : e.text}</span>
                </li>
              ))}
            </ol>
          ) : <p className="grey">Nothing yet. The first invoice you send starts the record.</p>}
          <p className="advisory mt-3">Every line is something you can open and take over. Mastiff flags; your firm makes every payment decision.</p>
        </div>
        <div className="card">
          <h2 className="mb-1">Text Mastiff</h2>
          <p className="grey text-sm mb-3">"Why did the last one hold?" "What have we paid Ray's this year?" "Always pass Metro under $500." One thread, saved.</p>
          <Link href="/app/chat" className="btn fill w-full">Open the thread</Link>
        </div>
      </div>

      <h2 className="mb-3">Recent</h2>
      {recent && recent.length ? (
        <table className="list"><thead><tr><th>When</th><th>Payee</th><th>Amount</th><th>Verdict</th><th>Status</th></tr></thead><tbody>
          {recent.map((r) => (
            <tr key={r.id}><td>{fmtDate(r.created_at)}</td><td><Link href={`/app/requests/${r.id}`} className="underline">{r.payee}</Link></td><td>{fmtMoney(r.amount)}</td><td>{r.verdict === "hold" ? <span className="pill dark">Hold</span> : <span className="pill">Pass</span>}</td><td className="text-sm">{STATUS_LABEL[r.status]}</td></tr>
          ))}
        </tbody></table>
      ) : <p className="grey">No requests yet. <Link href="/app/requests/new" className="underline">Enter the first one</Link> or <Link href="/app/vendors" className="underline">load your vendor list</Link>.</p>}
    </Shell>
  );
}
