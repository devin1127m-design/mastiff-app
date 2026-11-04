import Link from "next/link";
import { Shell } from "@/components/Shell";
import { InvoiceUpload } from "@/components/InvoiceUpload";
import { InvoiceImage } from "@/components/InvoiceImage";
import { requireOrg } from "@/lib/org";
import { createClient } from "@/lib/supabase/server";
import { submitRequest, discardIntake } from "@/lib/actions";
import type { Extracted } from "@/lib/intake";

export default async function NewRequest({ searchParams }: { searchParams: Promise<{ intake?: string }> }) {
  const { intake: intakeId } = await searchParams;
  const { session, org, myName } = await requireOrg();
  const action = submitRequest.bind(null, org.id, myName);

  type Intake = { id: string; image_path: string; extracted: Extracted | null; needs_tap_because: string | null; read_error: string | null };
  let intake: Intake | null = null;
  if (intakeId) {
    const supabase = await createClient();
    const { data } = await supabase.from("intakes").select("id, image_path, extracted, needs_tap_because, read_error").eq("id", intakeId).eq("org_id", org.id).is("request_id", null).maybeSingle();
    intake = (data as unknown as Intake | null) ?? null;
  }
  const x = intake?.extracted ?? null;

  return (
    <Shell session={session} orgName={org.name}>
      <h1 className="mb-1">{intake ? "Confirm this one" : "New payment request"}</h1>
      {intake ? (
        <p className="mb-6">{intake.needs_tap_because ?? "Check the fields against the invoice."} <span className="grey">Fix anything that is wrong, then check it.</span></p>
      ) : (
        <p className="grey mb-8">Enter it before it is keyed. You get Pass or Hold on the next screen.</p>
      )}

      {!intake && <div className="mb-8"><InvoiceUpload orgId={org.id} byName={myName} /></div>}

      <div className={intake ? "grid md:grid-cols-2 gap-6 items-start" : ""}>
        {intake && <InvoiceImage path={intake.image_path} />}
        <form action={action} className="card max-w-lg space-y-4">
          {intake && <input type="hidden" name="intake_id" value={intake.id} />}
          {!intake && <h2>Or type it in</h2>}
          <div className="field"><label>Payee</label><input name="payee" required autoFocus={!intake} defaultValue={x?.payee ?? ""} /><div className="hint">As it appears on the invoice.</div></div>
          <div className="grid grid-cols-2 gap-3">
            <div className="field"><label>Amount</label><input name="amount" inputMode="decimal" required placeholder="4,200.00" defaultValue={x?.amount ? x.amount.toFixed(2) : ""} /></div>
            <div className="field"><label>Invoice number</label><input name="invoice_no" defaultValue={x?.invoice_no ?? ""} /></div>
          </div>
          <div className="field"><label>Account last 4</label><input name="account_last4" inputMode="numeric" maxLength={4} pattern="[0-9]{4}" placeholder="4471" defaultValue={x?.account_last4 ?? ""} /><div className="hint">Only the last four digits. Do not enter a full account number.</div></div>
          <div className="field"><label>Note (optional)</label><textarea name="note" placeholder="Anything unusual about how this arrived." defaultValue={x?.notes ?? ""} /></div>
          {x && <p className="advisory">Read by Mastiff{typeof x.confidence === "number" ? ` (${Math.round(x.confidence * 100)}% sure)` : ""}{x.full_account_visible ? ". A full account number is printed on this invoice; only the last four are kept." : "."}</p>}
          <div className="flex items-center gap-3">
            <button className="btn fill">Check it</button>
            {intake && <button formAction={discardIntake.bind(null, org.id, intake.id)} className="grey text-sm underline">Discard</button>}
          </div>
        </form>
      </div>
      {intake && <p className="mt-6 text-sm"><Link href="/app/requests/new" className="underline">Start over with a different invoice</Link></p>}
    </Shell>
  );
}
