import Link from "next/link";
export const metadata = { title: "How it works · Mastiff" };
export default function HowItWorks() {
  return (
    <>
      <section className="wrap hero">
        <p className="eyebrow">How it works</p>
        <h1 className="display">Three checks. Two cautions. One decision, made by you.</h1>
        <p className="lead">A bill reaches Mastiff by email, photo or QuickBooks. Mastiff reads it, checks it, and answers Pass or Hold with the reason in one line. It never moves money and never blocks a payment.</p>
      </section>
      <section className="wrap band">
        <h2>What holds</h2>
        <ol className="rules">
          <li><strong>Payee not on file.</strong> "Payee missing from your vendor list. Worth checking before payment."</li>
          <li><strong>Bank details changed.</strong> "Bank details differ from the file (on file ends 2208, request ends 9999). Would have held."</li>
          <li><strong>Amount out of range.</strong> "Amount is above your cap" or "more than twice this vendor's usual maximum."</li>
        </ol>
        <h2>What's only noted</h2>
        <p className="lead">A request outside your payment hours, or wording that pushes you to hurry. Either one is written in the log and the payment passes. They add weight only beside one of the three holds.</p>
      </section>
      <section className="wrap band">
        <h2>What happens on a hold</h2>
        <ol className="steps">
          <li><span className="num">1</span><div><p>Your office gets an email the moment it holds. Nothing is blocked; you can pay it anyway if you need to.</p></div></li>
          <li><span className="num">2</span><div><p>Mastiff calls the vendor on the number already on file, never a number in the request, and writes down who answered and what they said.</p></div></li>
          <li><span className="num">3</span><div><p>The owner or approver records the decision: pay as requested, pay to the account on file, or don't pay. Both names go in the log.</p></div></li>
        </ol>
      </section>
      <section className="wrap band">
        <h2>What goes straight through</h2>
        <p className="lead">A clear read of a bill from a vendor you already pay, for an amount in their usual range, that passes the three checks, is filed with no tap. It sits in your pay run with the picture of the invoice next to the numbers. The click on pay is the confirmation.</p>
        <p className="lead">Anything else waits for a look: a new vendor, a hold, an amount outside the pattern, or a picture Mastiff isn't sure it read right.</p>
      </section>
      <section className="wrap band">
        <h2>What we keep, and what we never do</h2>
        <p className="lead">Payee, amount, invoice number, the last four digits of an account, who submitted it, who called, who decided. Never a full account number, a routing number, a tax ID, or a bank login. The database refuses anything longer than four digits.</p>
        <p className="lead">We can't move money. There is no release button. Your firm makes every payment decision.</p>
        <Link href="/pilot" className="btn fill lg">Start a free pilot</Link>
      </section>
    </>
  );
}
