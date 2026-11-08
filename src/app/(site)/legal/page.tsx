export const metadata = { title: "Privacy and terms · Mastiff" };
export default function Legal() {
  return (
    <>
      <section className="wrap hero">
        <p className="eyebrow">Privacy and terms</p>
        <h1 className="display-sm">Plain terms, pending counsel.</h1>
        <p className="lead">Effective date: not yet published. This page has not yet been reviewed by a lawyer, and it will be before the first paid office. Mastiff is a verification and advisory service. It does not move money or block payments. Mastiff flags. Your firm makes every payment decision.</p>
      </section>
      <section className="wrap band">
        <h2>What we collect from the pilot form</h2>
        <p>Your name, firm, email, phone, how many payments you make a month, and any note you add. Used only to contact you about the pilot. Never sold, never shared for advertising.</p>
        <h2>What the service stores</h2>
        <p>For each payment request: payee, amount, invoice number, the last four digits of the account, when it arrived and how, who submitted it, the result and reason, the callback record (who called, the number, who answered, what was said), and the decision with the decider's name. The invoice image, when there is one, kept privately for your office. Your vendor file: names, callback numbers, last four digits, and who confirmed each by voice and when.</p>
        <h2>What we never store</h2>
        <p>A full bank account number, a routing number, a tax ID, or a bank login. The database rejects anything longer than four digits. Mastiff has no access to your bank or your books beyond a read-only QuickBooks connection you choose to make with your own login, which it cannot write to.</p>
        <h2>Who can see your data</h2>
        <p>The people you invite to your office, and Mastiff staff when a hold needs a call. Access is enforced in the database itself, per office. A bookkeeping firm sees your office only if you are its client and we attached you to it.</p>
        <h2>AI</h2>
        <p>A hosted language model reads invoice images into fields and answers questions about your own records. It never decides a verdict, never pays, and never changes a setting without a person confirming. The three rules are plain code.</p>
        <h2>Leaving</h2>
        <p>Export your log and vendor file any time. Ask, and we delete your office within a week and confirm in writing.</p>
        <h2>What we don't promise</h2>
        <p>That nothing will go wrong. We catch three patterns; we do not guarantee recovery, and we do not state what any insurer requires. Ask your broker.</p>
      </section>
    </>
  );
}
