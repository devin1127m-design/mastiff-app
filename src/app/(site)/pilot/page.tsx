import { submitLead } from "@/lib/actions";
export const metadata = { title: "The pilot · Mastiff" };
export default async function Pilot({ searchParams }: { searchParams: Promise<{ sent?: string; err?: string }> }) {
  const { sent, err } = await searchParams;
  const startedAt = Date.now();
  return (
    <>
      <section className="wrap hero">
        <p className="eyebrow">The pilot</p>
        <h1 className="display">Free for thirty days. On day 30, you decide.</h1>
        <p className="lead">For offices that pay vendors by check, ACH or wire. No card, nothing renews. If you want to keep going we talk terms on day 30; if not, you keep the vendor file and the log. The pilot is limited to five offices.</p>
      </section>
      <section className="wrap band">
        <h2>What the thirty days look like</h2>
        <ol className="steps">
          <li><span className="num">Day 1</span><div><p>A twenty-minute call with you and whoever keys payments. We set three numbers (your cap, your range, your hours) and load your vendor list. Your office gets its address.</p></div></li>
          <li><span className="num">Day 2</span><div><p>The look-back: your last 18 months of payments, scanned for duplicates, late fees and what would have held.</p></div></li>
          <li><span className="num">Days 3–29</span><div><p>Bills arrive by email or photo. Pass or hold. On a hold we call the number on file and you decide. Nothing about how you pay changes.</p></div></li>
          <li><span className="num">Day 30</span><div><p>The read-out: your record against the questions carriers ask on the application, printable, for your broker.</p></div></li>
        </ol>
      </section>
      <section className="wrap band" id="form">
        {sent ? (
          <div className="ticket"><h2>Got it.</h2><p className="lead">You'll hear from Devin within one business day to set up the call.</p></div>
        ) : (
          <form action={submitLead} className="ticket form">
            <h2>Start the pilot</h2>
            <p className="grey">Please don't type account numbers anywhere on this form.</p>
            {err === "save" && <p className="text-sm">That didn't go through. Email <a href="mailto:desk@mastiffdesk.com" className="underline">desk@mastiffdesk.com</a> and we'll set up the call.</p>}
            {err === "1" && <p className="text-sm">Check the name, firm, email and phone and try again.</p>}
            <input type="hidden" name="started_at" value={startedAt} />
            <div className="grid-2 tight">
              <div className="field"><label htmlFor="name">Your name</label><input id="name" name="name" required /></div>
              <div className="field"><label htmlFor="firm">Firm</label><input id="firm" name="firm" required /></div>
              <div className="field"><label htmlFor="email">Email</label><input id="email" name="email" type="email" required /></div>
              <div className="field"><label htmlFor="phone">Phone</label><input id="phone" name="phone" type="tel" required /></div>
              <div className="field"><label htmlFor="ppm">Payments per month, roughly</label><input id="ppm" name="payments_per_month" inputMode="numeric" placeholder="40" /></div>
              <div className="field"><label htmlFor="note">Anything we should know</label><input id="note" name="note" placeholder="We use QuickBooks; our bookkeeper is part-time" /></div>
            </div>
            <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hp" aria-hidden="true" />
            <button className="btn fill lg">Request the call</button>
            <p className="advisory">Mastiff flags. Your firm makes every payment decision.</p>
          </form>
        )}
      </section>
    </>
  );
}
