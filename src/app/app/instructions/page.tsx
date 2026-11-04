import { Shell } from "@/components/Shell";
import { requireOrg, fmtDate } from "@/lib/org";
import { createClient } from "@/lib/supabase/server";
import { proposeInstruction, decideInstruction } from "@/lib/actions";

const EXAMPLES = ["Always pass Metro Fasteners under $500.", "Ray's Drywall is usually between $2,000 and $5,000.", "Pay Oakland Concrete on day 9 for the discount.", "Hold anything over $8,000.", "Call Metro Fasteners at 248-555-0102."];

export default async function Instructions() {
  const { session, org, role, myName } = await requireOrg();
  const supabase = await createClient();
  const { data: rows } = await supabase.from("instructions").select("*").eq("org_id", org.id).order("created_at", { ascending: false }).limit(50);
  const canDecide = role === "owner" || role === "approver";
  return (
    <Shell session={session} orgName={org.name}>
      <h1 className="mb-1">Instructions to Mastiff</h1>
      <p className="grey mb-6">Tell it how your office pays, in a sentence. Mastiff says what it understood; nothing changes until you confirm. It can set a vendor's usual range, a small-bill pass, a callback number, a note, the cap, the multiple and the hours. It cannot skip a callback, release a hold, or pay anything.</p>
      {canDecide ? (
        <form action={proposeInstruction.bind(null, org.id, myName)} className="card max-w-lg space-y-3 mb-8">
          <div className="field"><label>Instruction</label><input name="text" required maxLength={400} placeholder={EXAMPLES[0]} list="ins-ex" /><datalist id="ins-ex">{EXAMPLES.map((e) => <option key={e} value={e} />)}</datalist></div>
          <button className="btn fill">See what Mastiff understood</button>
        </form>
      ) : <p className="card max-w-lg mb-8 text-sm">The owner or approver gives instructions. You can read them here.</p>}

      {rows && rows.length ? (
        <div className="space-y-3">
          {rows.map((r) => (
            <div key={r.id} className="card">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="serif text-lg">"{r.text}"</p>
                <span className="grey text-sm">{r.asked_by} · {fmtDate(r.created_at)}</span>
              </div>
              <p className="mt-2"><span className="grey">Mastiff understood:</span> {r.summary}</p>
              <div className="mt-3 flex items-center gap-3">
                {r.status === "proposed" && canDecide && (
                  <>
                    <form action={decideInstruction.bind(null, org.id, myName, r.id, true)}><button className="btn fill small">Confirm</button></form>
                    <form action={decideInstruction.bind(null, org.id, myName, r.id, false)}><button className="btn small">No, leave it</button></form>
                  </>
                )}
                {r.status === "proposed" && !canDecide && <span className="pill">Waiting for the owner</span>}
                {r.status === "confirmed" && <span className="pill dark">Confirmed by {r.decided_by}</span>}
                {r.status === "declined" && <span className="grey text-sm">Declined by {r.decided_by}</span>}
                {r.status === "unclear" && <span className="grey text-sm">Not applied</span>}
              </div>
            </div>
          ))}
        </div>
      ) : <p className="grey">No instructions yet.</p>}
    </Shell>
  );
}
