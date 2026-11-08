import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mastiff · Payment checks for small offices",
  description: "Every payment request is checked before it is paid. Three plain rules, a call to the number on file, a log you can hand to your broker. Free 30-day pilot.",
};

export default function Landing() {
  return (
    <>
      <section className="wrap hero hero-grid">
        <div>
          <p className="eyebrow">Payment checks for small offices</p>
          <h1 className="display">Every payment request gets checked before it gets paid.</h1>
          <p className="lead">Most losses start with a request that looks right: a vendor's "new bank details," an invoice with the right logo, a call that sounds like the owner. Mastiff checks each one against what your office already has on file. When something doesn't match, it holds, and we call the vendor on the number you already had.</p>
          <div className="row gap">
            <Link href="/pilot" className="btn fill lg">Start a free 30-day pilot</Link>
            <Link href="/how-it-works" className="btn lg">How it works</Link>
          </div>
          <p className="advisory mt">Mastiff flags. Your firm makes every payment decision.</p>
        </div>
        <div className="ticket" aria-label="Example of a held payment">
          <div className="row-between">
            <span className="label">What a hold looks like</span>
            <span className="stamp hold">Hold</span>
          </div>
          <dl className="ticket-dl">
            <div><dt>Request</dt><dd>Ray's Drywall, $4,180.00, invoice 40921</dd></div>
            <div><dt>Arrived</dt><dd>Forwarded email, Tuesday 9:14 am</dd></div>
            <div><dt>Why it held</dt><dd>Bank details differ from the file (on file ends 2208, request ends 9999).</dd></div>
            <div><dt>Callback</dt><dd>(248) 555-0101, the number on file since January. Ray answered: no change requested.</dd></div>
            <div><dt>Decision</dt><dd>Owner: pay to the account on file. Logged with both names.</dd></div>
          </dl>
          <p className="advisory">Nothing clever happened. The request waited, one call was made, the office decided.</p>
        </div>
      </section>

      <section className="wrap band">
        <p className="eyebrow">Three doors in</p>
        <h2>Bills reach Mastiff without anyone retyping them.</h2>
        <div className="grid-3">
          <div className="cell"><h3>Forward the email</h3><p>Your office gets its own address. The bookkeeper forwards the bill, or sets a rule so it forwards itself.</p></div>
          <div className="cell"><h3>Take a photo</h3><p>Paper invoice on the job site? Snap it from the truck. Mastiff reads the payee, amount and invoice number off the picture.</p></div>
          <div className="cell"><h3>Pull from QuickBooks</h3><p>Read-only, with your own login. Vendors and unpaid bills come in; nothing is ever written back.</p></div>
        </div>
      </section>

      <section className="wrap band">
        <p className="eyebrow">Three rules</p>
        <h2>Only three things hold a payment. Everything else passes.</h2>
        <ol className="rules">
          <li><strong>Payee not on file.</strong> The vendor isn't on your list yet. Worth checking before the first payment.</li>
          <li><strong>Bank details changed.</strong> The account doesn't end in the four digits you have on file. Would have held.</li>
          <li><strong>Amount out of range.</strong> Above your cap, or far outside what that vendor usually bills.</li>
        </ol>
        <p className="lead">Off-hours and "pay this today" wording are noted, never held on their own. A hold is advice, not a block: your office can release anything, any time, on its own authority.</p>
      </section>

      <section className="wrap band">
        <p className="eyebrow">What you get</p>
        <ol className="steps">
          <li><span className="num">01</span><div><h3>The check</h3><p>Pass or Hold on every request, with the reason in one line, before it's keyed.</p></div></li>
          <li><span className="num">02</span><div><h3>The call</h3><p>On a hold, we call the vendor on the number already on file and tell you who answered and what they said. Your bookkeeper never has to make the call.</p></div></li>
          <li><span className="num">03</span><div><h3>The vendor file</h3><p>By day 30, every active vendor's number and account confirmed by voice, dated, with a name next to it. Yours to keep.</p></div></li>
          <li><span className="num">04</span><div><h3>The log</h3><p>Every check, call and decision in one place. When your broker or CPA asks how a payment was verified, you hand them the page.</p></div></li>
          <li><span className="num">05</span><div><h3>Money back</h3><p>The look-back scans the last 18 months of payments for duplicates and late fees. Most offices find some.</p></div></li>
        </ol>
      </section>

      <section className="band-ink">
        <div className="wrap">
          <p className="eyebrow light">The numbers</p>
          <div className="stats">
            <div><p className="stat">$3.05B</p><p>Business email compromise losses the FBI logged in 2025, the second-largest category by loss.<sup><a href="#fn1">1</a></sup></p></div>
            <div><p className="stat">81%</p><p>Of senior finance executives surveyed in August 2026 said their company faced an AI-enabled fraud attempt in the past year.<sup><a href="#fn2">2</a></sup></p></div>
            <div><p className="stat">$93,425</p><p>Lost by one small construction firm when a subcontractor's bank details changed and the callback its own policy required was skipped.<sup><a href="#fn3">3</a></sup></p></div>
          </div>
        </div>
      </section>

      <section className="wrap band">
        <p className="eyebrow">The gap</p>
        <h2>You already pay for three kinds of protection. None of them checks the payment.</h2>
        <div className="grid-2">
          <div className="cell"><p className="kicker">Your IT company</p><h3>Protects the inbox</h3><p>Spam filters, phishing training, two-factor. Keep all of it. The convincing request still gets through, because it looks like it came from your real vendor.</p></div>
          <div className="cell"><p className="kicker">Your bank</p><h3>Confirms it was you</h3><p>Positive pay stops a check you didn't write. It can't know you approved a wire to the wrong account yourself.</p></div>
          <div className="cell"><p className="kicker">Your AP software</p><h3>Emails the vendor</h3><p>When bank details change, the tools we reviewed send an email. We found none that holds the payment until someone calls the number on file.<sup><a href="#fn4">4</a></sup></p></div>
          <div className="cell hot"><p className="kicker">Mastiff</p><h3>Checks the payment itself</h3><p>Payee, amount and bank details against what's on file, a call to the number you already had, a second person at your office signing off. All of it written down.</p></div>
        </div>
      </section>

      <section className="wrap band close">
        <h2 className="display-sm">Thirty days. Free. Nothing to install.</h2>
        <p className="lead">It starts with a twenty-minute call. Bring whoever keys your payments.</p>
        <Link href="/pilot" className="btn fill lg">Start a free pilot</Link>
      </section>

      <section className="wrap footnotes">
        <ol>
          <li id="fn1">FBI Internet Crime Complaint Center, <a href="https://www.ic3.gov/AnnualReport/Reports/2025_IC3Report.pdf">2025 Internet Crime Report</a>, pp. 9, 25–26.</li>
          <li id="fn2">Certos survey by Accelerant Research with Early Warning Services, 230 senior finance executives, fielded Aug 7–21, 2026. Vendor-sponsored. <a href="https://www.prnewswire.com/news-releases/ai-deepfakes-target-corporate-americas-multi-bank-blind-spot-302898894.html">Release</a>.</li>
          <li id="fn3">CFC Underwriting, <a href="https://www.cfc.com/en-us/resources/case-studies/cyber-claims-case-study-subcontractor-scam">cyber claims case study, "Subcontractor scam"</a>, Nov 2019.</li>
          <li id="fn4">Mastiff review of public documentation for BILL, Ramp, Melio and QuickBooks Online Bill Pay, October 2026. "Not found" means not found in what we read.</li>
        </ol>
      </section>
    </>
  );
}
