import Link from "next/link";
import { notFound } from "next/navigation";
import { Shell, getSession } from "@/components/Shell";
import { fmtMoney, fmtDate, STATUS_LABEL } from "@/lib/org";
import { createClient } from "@/lib/supabase/server";
import { logCallback, recordDecision, askForALook } from "@/lib/actions";
import { InvoiceImage } from "@/components/InvoiceImage";

export default async function RequestPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  const supabase = await createClient();
  const { data: r } = await supabase.from("requests").select("*, orgs(name), vendors(name, callback_phone, account_last4, phone_on_file_since, instructions)").eq("id", id).maybeSingle();
  if (!r) notFound();
  const [{ data: calls }, { data: decs }, { data: history }] = await Promise.all([
    supabase.from("callbacks").select("*").eq("request_id", id).order("called_at"),
    supabase.from("decisions").select("*").eq("request_id", id).order("decided_at"),
    r.vendor_id ? supabase.from("requests").select("amount, created_at, invoice_no").eq("vendor_id", r.vendor_id).neq("id", id).order("created_at", { ascending: false }).limit(3) : Promise.resolve({ data: [] as { amount: number; created_at: string; invoice_no: string | null }[] }),
  ]);
  const membership = session.memberships.find((m) => m.org_id === r.org_id);
  const myName = session.staffName ?? membership?.name ?? session.email;
  const canCall = session.isStaff;
  const canDecide = !!membership && (membership.role === "owner" || membership.role === "approver");
  const isHold = r.verdict === "hold";
  const resolved = ["released", "rejected"].includes(r.status);
  const vendor = r.vendors as { name: string; callback_phone: string | null; account_last4: string | null; phone_on_file_since: string | null; instructions: string | null } | null;
  const org = r.orgs as { name: string } | null;

  return (
    <Shell session={session} orgName={org?.name}>
      <div className="grid md:grid-cols-[1fr_320px] gap-8">
        <div>
          <div className="flex items-center gap-4 mb-6">
            <span className={`stamp ${isHold ? "hold" : ""}`}>{isHold ? "Hold" : "Pass"}</span>
            <span className="grey text-sm">{STATUS_LABEL[r.status]}</span>
          </div>
          <h1 className="mb-1">{r.payee}</h1>
          <p className="serif text-2xl mb-2">{fmtMoney(r.amount)}{r.invoice_no && <span className="grey text-base"> · invoice {r.invoice_no}</span>}</p>
          {r.image_path && (
            <p className="advisory mb-6">{r.straight_through
              ? "Read by Mastiff and filed without a tap: vendor on file, usual amount, passed the three checks. Compare the picture with the numbers before you pay."
              : "Read by Mastiff, confirmed by " + r.submitted_by + "."}</p>
          )}
          {!r.image_path && <div className="mb-4" />}

          {isHold ? (
            <div className="card mb-6">
              <h2 className="mb-2">Why it held</h2>
              <ul className="list-disc pl-5 space-y-1">{r.reasons.map((x: string) => <li key={x}>{x}</li>)}</ul>
              {r.cautions.length > 0 && <p className="grey text-sm mt-3">Also noted: {r.cautions.join(" ")}</p>}
              <p className="advisory mt-4">A hold is a prompt to check, not a finding. Mastiff calls the number on file and reports what was said. Your firm decides.</p>
            </div>
          ) : (
            <div className="card mb-6">
              <p>Matches what is on file: payee known{vendor?.account_last4 ? `, account ends ${vendor.account_last4}` : ""}, amount within range. Pay as usual.</p>
              {r.cautions.length > 0 && <p className="grey text-sm mt-3">Noted, did not hold: {r.cautions.join(" ")}</p>}
              {!!membership && !resolved && (
                <form action={askForALook.bind(null, id, myName)} className="mt-4 flex flex-wrap gap-2 items-end border-t hair pt-3">
                  <div className="field flex-1 min-w-48"><label>Not right? Ask Mastiff to check it</label><input name="why" placeholder="What looks off" /></div>
                  <button className="btn small">Turn into a hold</button>
                </form>
              )}
            </div>
          )}

          {isHold && (
            <>
              <h2 className="mb-3">Callbacks</h2>
              {calls && calls.length ? (
                <table className="list mb-4"><thead><tr><th>When</th><th>Number</th><th>Who answered</th><th>What they said</th><th>Outcome</th><th>By</th></tr></thead><tbody>
                  {calls.map((c) => <tr key={c.id}><td>{fmtDate(c.called_at)}</td><td>{c.number_called}</td><td>{c.who_answered}</td><td>{c.what_said}</td><td>{c.outcome.replace("_", " ")}</td><td>{c.by_name}</td></tr>)}
                </tbody></table>
              ) : <p className="grey mb-4">No callback logged yet. Mastiff calls within the hour, Monday to Friday, 7 am to 7 pm.</p>}

              {canCall && !resolved && (
                <form action={logCallback.bind(null, id, myName)} className="card space-y-3 mb-8">
                  <h2>Log a callback</h2>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="field"><label>Number called</label><input name="number_called" required defaultValue={vendor?.callback_phone ?? ""} /><div className="hint">Must be the number on file{vendor?.phone_on_file_since ? ` (since ${vendor.phone_on_file_since})` : ""}. Never one from the request.</div></div>
                    <div className="field"><label>Who answered</label><input name="who_answered" /></div>
                  </div>
                  <div className="field"><label>What they said</label><textarea name="what_said" placeholder="Asked for the last invoice amount; they answered correctly. Confirmed no bank change was requested." /></div>
                  <div className="field"><label>Outcome</label>
                    <select name="outcome" required defaultValue="">
                      <option value="" disabled>Choose</option>
                      <option value="confirmed">Confirmed: vendor verified the request</option>
                      <option value="not_confirmed">Not confirmed: vendor did not request this</option>
                      <option value="no_answer">No answer, will retry</option>
                    </select>
                  </div>
                  <button className="btn fill">Save callback</button>
                </form>
              )}

              <h2 className="mb-3">Office decision</h2>
              {decs && decs.length ? (
                <table className="list mb-4"><thead><tr><th>When</th><th>Decision</th><th>By</th><th>Note</th></tr></thead><tbody>
                  {decs.map((d) => <tr key={d.id}><td>{fmtDate(d.decided_at)}</td><td>{d.decision}</td><td>{d.decided_by}</td><td>{d.note}</td></tr>)}
                </tbody></table>
              ) : <p className="grey mb-4">Waiting for the office's second person to sign off.</p>}

              {canDecide && !resolved && (
                <form action={recordDecision.bind(null, id, myName)} className="card space-y-3">
                  <h2>Record the decision</h2>
                  <p className="text-sm grey">Signed by {myName}. The office makes every payment decision; this records it.</p>
                  <div className="field"><label>Decision</label>
                    <select name="decision" required defaultValue="">
                      <option value="" disabled>Choose</option>
                      <option value="pay">Pay as requested</option>
                      <option value="change">Pay to the account on file instead</option>
                      <option value="reject">Do not pay</option>
                    </select>
                  </div>
                  <div className="field"><label>Note</label><input name="note" /></div>
                  <button className="btn fill">Record decision</button>
                </form>
              )}
            </>
          )}
        </div>

        <aside className="space-y-4">
          <div className="card">
            <div className="grey text-xs uppercase tracking-wide mb-2">Request</div>
            <div className="text-sm space-y-1">
              <div>Submitted {fmtDate(r.created_at)}</div>
              <div>By {r.submitted_by} ({r.source})</div>
              <div>Account ends {r.account_last4 ?? "—"}</div>
              {r.note && <div className="grey">Note: {r.note}</div>}
            </div>
          </div>
          <div className="card">
            <div className="grey text-xs uppercase tracking-wide mb-2">On file</div>
            {vendor ? (
              <div className="text-sm space-y-1">
                <div>{vendor.name}</div>
                <div>Callback {vendor.callback_phone ?? <span className="grey">missing</span>}</div>
                <div>Account ends {vendor.account_last4 ?? "—"}</div>
                {vendor.instructions && <div className="pt-1"><span className="grey text-xs uppercase tracking-wide">Owner's instruction</span><div>{vendor.instructions}</div></div>}
                {history && history.length > 0 && (
                  <div className="pt-2">
                    <div className="grey text-xs uppercase tracking-wide">Last payments</div>
                    {history.map((h, i) => <div key={i}>{fmtMoney(h.amount)} · {new Date(h.created_at).toLocaleDateString()}{h.invoice_no ? ` · ${h.invoice_no}` : ""}</div>)}
                    <div className="grey text-xs mt-1">Ask the vendor for one of these on the call.</div>
                  </div>
                )}
              </div>
            ) : <p className="text-sm grey">Not on the vendor list. <Link href="/app/vendors" className="underline">Add them</Link> once confirmed.</p>}
          </div>
          <Link href="/app" className="btn w-full">Back to home</Link>
        </aside>
      </div>
      {r.image_path && (
        <div className="mt-8 max-w-2xl">
          <h2 className="mb-2">The invoice</h2>
          <InvoiceImage path={r.image_path} />
        </div>
      )}
      <div>
      </div>
    </Shell>
  );
}
