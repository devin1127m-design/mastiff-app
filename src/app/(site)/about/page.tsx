export const metadata = { title: "About · Mastiff" };
export default function About() {
  return (
    <>
      <section className="wrap hero">
        <p className="eyebrow">About</p>
        <h1 className="display">A small service for small offices.</h1>
        <p className="lead">Mastiff is run by Devin Martin from Oxford, Michigan. Devin managed the finances for a construction company and watched how bills actually get paid in a small office: one bookkeeper, a checkbook, and a request that looks right getting paid before anyone asks a second question. Mastiff asks the question, makes the call, writes down the answer, and leaves the decision with you.</p>
      </section>
      <section className="wrap band">
        <h2>How we work</h2>
        <ol className="rules">
          <li><strong>We flag. We don't decide.</strong> Your firm makes every payment decision, and a second person at your office signs off on each hold.</li>
          <li><strong>We call the number you already had.</strong> Never one from the request. Who answered and what they said goes in the log.</li>
          <li><strong>We hold only what the check supports.</strong> Plain words: "would have held," "worth checking," "missing."</li>
          <li><strong>We keep the last four digits and nothing longer.</strong> No routing numbers, no tax IDs, no bank logins, ever.</li>
          <li><strong>Your data is yours.</strong> Export the log and the vendor file any time. Leave, and we delete the office.</li>
        </ol>
      </section>
      <section className="wrap band">
        <h2>Who it's for</h2>
        <p className="lead">Offices that pay vendors by check, ACH or wire and have one person keying payments and another who owns the money: contractors and subcontractors, private schools, small professional practices, and the bookkeeping firms that work for them. We're starting in Oakland County, Michigan.</p>
      </section>
    </>
  );
}
