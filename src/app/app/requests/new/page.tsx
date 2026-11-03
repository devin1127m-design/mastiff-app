import { Shell } from "@/components/Shell";
import { requireOrg } from "@/lib/org";
import { submitRequest } from "@/lib/actions";

export default async function NewRequest() {
  const { session, org, myName } = await requireOrg();
  const action = submitRequest.bind(null, org.id, myName);
  return (
    <Shell session={session} orgName={org.name}>
      <h1 className="mb-1">New payment request</h1>
      <p className="grey mb-8">Enter it before it is keyed. You get Pass or Hold on the next screen.</p>
      <form action={action} className="card max-w-lg space-y-4">
        <div className="field"><label>Payee</label><input name="payee" required autoFocus /><div className="hint">As it appears on the invoice.</div></div>
        <div className="grid grid-cols-2 gap-3">
          <div className="field"><label>Amount</label><input name="amount" inputMode="decimal" required placeholder="4,200.00" /></div>
          <div className="field"><label>Invoice number</label><input name="invoice_no" /></div>
        </div>
        <div className="field"><label>Account last 4</label><input name="account_last4" inputMode="numeric" maxLength={4} pattern="[0-9]{4}" placeholder="4471" /><div className="hint">Only the last four digits. Do not enter a full account number.</div></div>
        <div className="field"><label>Note (optional)</label><textarea name="note" placeholder="Anything unusual about how this arrived." /></div>
        <button className="btn fill">Check it</button>
      </form>
    </Shell>
  );
}
