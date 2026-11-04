# R5 (liability angle): does recording a verification make Mastiff a party to the payment decision?

Stage 01 output, researched 2026-10-27. Internal working paper, not client-facing. This is research and a first draft, not legal advice. A Michigan lawyer must review every clause in section 7 and the list in section 8 before anything here is used with a client. Sibling files in this folder cover Mastiff's own insurance (`insurance.md`) and where client data lives (`data-custody.md`); this file does not repeat them.

Tags: **[opened]** means I read the page or document in this session (some through a fetch tool that summarises; those are marked "summary"). **[search only]** means it appeared only in a search-result summary and I did not open it, so treat it as unverified. Facts from the r1 and r4 files are reused as written there and were not re-opened. Terms and opinions are paraphrased, not quoted.

## 1. Short answer

- **Recording a check, a callback and a sign-off does not, on anything I found, make Mastiff a party to the payment.** The payment goes from the client to its bank; Mastiff never sends, holds or releases it. I found no Michigan or other US decision that treats a record-keeper or a verification vendor as a party to a client's payment, and none where a verification vendor was sued at all. That is an absence of authority, not a ruling; a lawyer should confirm it.
- **Mastiff's real exposure is as a supplier of information.** If a PASS is wrong, the client can say it relied on it. Michigan lets a client sue someone who owed a business or professional duty to give accurate information, but only if the client's reliance was reasonable (section 3). What the client was told the check does not do is therefore the main defence, and it has to be in the terms and on every verdict screen.
- **Comparable vendors all do the same three things:** say the customer decides and carries the loss for its own instructions, say they do not guarantee detection, and cap their liability, usually at fees paid in the last 12 months with a fixed floor. One vendor, Trustpair, does the opposite and advertises an indemnity (section 2).
- **Michigan appeals courts have enforced a very small liability cap in a monitoring-service contract, including against the customer's insurer suing in its place** (St. Paul v. Guardian Alarm, 1982). The same line of cases will not excuse gross negligence, and a clause must say plainly what it does (Xu v. Gay, 2003).
- **Treat the log as discoverable.** Michigan's accountant privilege covers licensed CPAs, not Mastiff. Write the terms so the log is the client's record, the client can export it, entries are never edited, and Mastiff holds it on request when a dispute is possible (sections 5 and 6).
- **The biggest practical risks are words, not code:** "PASS", "wall", "does not go out", "caught", the pilot success measure, and any sentence telling a client what its insurer requires (section 3.7).

## 2. How comparable services word their terms

### 2.1 What each one says [opened]

| Provider and document | Who decides and who bears the loss | No-guarantee wording | Liability cap and carve-outs | Other points |
|---|---|---|---|---|
| **BILL**, General Terms of Service; page shows an effective date of 20 Jan 2023 (raw page read; the page still carries placeholder filler text at the top, so it may not be maintained) | Customer is bound by payment instructions and bank-account changes made under BILL's security procedures, whether or not authorised, and is responsible for everything done through its logins. BILL calls its own procedures commercially reasonable | Service is as-is; BILL does not warrant it is completely secure or error-free; no duty to monitor the customer's use; advice from BILL creates no warranty | Greater of fees paid in the prior 12 months or $100; indirect and consequential damages excluded | Arbitration; BILL can change terms |
| **Ramp**, Platform Agreement, last updated 8 Oct 2026 (read in the browser pane) | Customer is responsible for the actions of its administrators and users, and for all decisions it makes based on use of the services; Ramp is not responsible for unauthorised use caused by the customer's failure to secure the account | Ramp does not guarantee the services are accurate, meet the customer's needs, or are secure; says AI outputs can be wrong | Section 6.1: greater of fees paid in the prior three months or $10,000. Section 6.2 (subscription services): greater of three months' subscription fees or $50,000. Cap does not apply to a party's own fraud, gross negligence or wilful misconduct | Consequential damages excluded |
| **Melio**, Terms of Service (Melio Payments version), revised 24 Jun 2026 (summary) | Customer is solely responsible for scheduling payments and choosing the right recipient (6.4) and for checking recipient details are accurate (4.9); Melio follows the customer's instructions (7.1) and is not responsible for dealings with recipients (3.3) | As-is; no promise of uninterrupted or secure access (20) | Section 19: direct damages incurred in the six months before the claim; lost profits excluded | Claims barred after one year (26.1); customer releases Melio and its banks from claims against recipients (27); arbitration with a 30-day opt-out |
| **Eftsure**, service terms for contracts from 20 Nov 2023 (Australian entity, New South Wales law, page tagged legacy) | Customer alone decides whether the service suits its needs; Eftsure may rely on a payee representative's statement and does not check the customer's own information | Its checks are said to reduce, not remove, risk. Eftsure is excluded from liability for error or fraud it does not detect, provided it acted reasonably and followed the stated process (3.3). No promised response rate (3.4) | Section 7.4: fees paid in the prior 12 months, for both sides; liability reduced to the extent the customer's own acts contributed (7.6) | Independent contractor (11.9); no rights for third parties (11.3); customer must keep its own copies of what it submits, and Eftsure excludes liability for data loss (6.4) |
| **nsKnox**, Services Agreement, Feb 2021 PDF (nsKnox Technologies Inc.) | Customer answers for its authorised users and for the accuracy of what it supplies (4.2) | All warranties disclaimed, as-is (section 8) | Section 11.1: direct damages capped at fees paid in the prior 12 months; indirect damages excluded for both sides; cap does not apply to nsKnox's gross negligence or wilful misconduct | Either side may end on 30 days' written notice (7.2); independent contractors (12.1). Its separate website terms (summary) cap liability at what the user paid, which is nothing for a free user, and bar claims after one year |
| **Trustpair**, "guarantee" page (read in the browser pane) | Page says Trustpair indemnifies customers up to a defined amount if a payment goes wrong, and that this sits inside its standard Terms of Service | Page concedes no system can claim zero risk, but also uses absolute promotional language | Amount, conditions and exclusions are not on the page. I found no public terms of service: the site footer links only a legal notice, a privacy policy and a cookie policy, and guessed URLs returned 403 | Contrast case: this is the gap between marketing and contract that produces misrepresentation claims |

### 2.2 Patterns worth copying, and one not to

1. **The customer decides and owns the result of its instructions** (BILL, Ramp, Melio). Mastiff's version: the firm makes every payment decision, and the firm's own staff make the call and give the second sign-off.
2. **No promise of detection.** Eftsure is the most specific: it ties the exclusion to having acted reasonably and followed the stated process. That is a better model than a flat "no liability", because it commits Mastiff to doing what it says it does and nothing more.
3. **Caps follow fees.** 12 months of fees (BILL, Eftsure, nsKnox), six months (Melio), three months with a floor (Ramp). The floors exist because fees can be tiny: BILL $100, Ramp $10,000 and $50,000. **Mastiff's pilot has no fees, so a cap of "fees paid" would be $0, which a court may treat as illusory.** Use a fixed dollar floor; the amount is for the lawyer and the insurer to set.
4. **Carve-outs for gross negligence and wilful misconduct** (Ramp, nsKnox). Michigan requires this anyway (section 3.5).
5. **Independent contractor and no third-party rights** (Eftsure, nsKnox).
6. **Claim windows and arbitration** (Melio one year; BILL and Melio arbitrate). Not obviously right for a two-person local business; flagged for the lawyer.
7. **Do not copy Trustpair's indemnity.** An indemnity is a guarantee in contract form. Offer none unless counsel and an insurer have agreed it.

### 2.3 Accounting-firm engagement letters [opened]

- **CPA.com sample engagement letter for accounting and advisory services** (CPA.com is an AICPA company; the document says no AICPA technical committee has approved it and it is informational only). It places on the client the responsibility for preventing and detecting fraud and for internal control; an optional paragraph adds responsibility for all management decisions. It says the firm has no duty in that engagement to find control weaknesses. It says the firm's workpapers belong to the firm and are not a substitute for the client's own records. It keeps electronic files only a short fixed period (three months in the sample). An optional clause makes the client indemnify the firm for the client's knowing misstatements, with a note that regulators may restrict such clauses. Fee disputes go to arbitration; either side can end the engagement by written notice.
- **Journal of Accountancy, Nov 2013 (Ference):** avoid wording in letters, marketing and correspondence that suggests the firm does something that belongs to client management; record advice in writing and say the client decides whether and how to act.
- **Journal of Accountancy, Nov 2016 (Murphy):** for attest clients receiving other services, the AICPA code requires the client to take on management responsibilities, name a qualified person to oversee the work, judge the results and accept responsibility for them; the firm may not perform management functions. This is an independence rule for CPAs, not a rule for Mastiff, but it is the vocabulary CPA-firm prospects will expect.
- **Journal of Accountancy, Feb 2020 (Yoo):** put scope and each side's responsibilities in an executed letter and update it by addendum when scope changes.
- **What differs for Mastiff:** a CPA firm keeps its workpapers as its own. Mastiff's terms go the other way: the log is the client's record (section 6).
- I could not read the AICPA consulting-services standard itself (CS 100); the AICPA page I opened was only a landing page.

### 2.4 The nearest Michigan precedent: alarm monitoring [opened]

- **St. Paul Fire & Marine Ins. Co. v. Guardian Alarm Co. of Michigan, 115 Mich App 278 (Mich Ct App, 23 Mar 1982).** A burglar-alarm monitoring contract said in bold that the company was not an insurer, that the fee was set by the value of the service and not the value of the property, and that the customer would arrange its own insurance. Liability was limited to a small sum (about $250, or six monthly payments). The customer's insurer sued in the customer's place after paying a $13,417 loss. The court enforced the limit: damages were hard to fix in advance, both sides were corporations dealing at arm's length, an alarm company is not in the insurance business, and a standard form is not unenforceable merely because it is standard. The insurer, suing as the customer's substitute, was held to the cap.
- **USAA Group v. Universal Alarms, 158 Mich App 633 (Mich Ct App, 5 Feb 1987)** followed it for an individual customer whose cottage burned (loss over $215,000), finding no contract of adhesion on that record.
- **Why it matters:** the reasoning (a flat fee for a service, not a premium; not an insurer) fits Mastiff's flat monthly fee and advisory role. **Cautions:** these are 1982 and 1987 decisions and a lawyer must check later treatment; neither opinion discusses gross negligence; and a cap this small on a service whose whole purpose is care may draw a stronger unconscionability argument today.

## 3. Duty of care and misrepresentation exposure (Michigan)

### 3.1 Negligent misrepresentation [opened]

- **Fejedelem v. Kasco, 269 Mich App 499 (Mich Ct App, decided 24 Jan 2006).** The claim requires that the plaintiff justifiably relied, to its harm, on information prepared without reasonable care by someone who owed it a duty of care. The court recorded that an earlier decision (Stockler v. Rose, 1989) adopted Restatement (Second) of Torts section 552 as the minimum standard for an accountant's liability to third parties. The defendant was the seller's accountant, sued by the buyer of a business who relied on financial statements the accountant prepared.
- **A Saginaw County business-court opinion (Big Rock Corp. v. Warren Systems, No. 23-002433-CB, April 2024; a trial-court ruling, not binding)** restates the elements as a material misstatement that was false, made negligently by someone with a business or professional duty to give accurate information, causing damage. It says no contract between the parties is needed, citing Williams v. Polgar (1974), which I did not open. It lists attorneys, insurance agents, accountants and financial advisors as the groups to whom Michigan courts have applied the tort.
- **Economic loss doctrine.** The same opinion used it to bar the claim in a commercial sale of goods. A Michigan construction-law survey by a law firm (Watt Tieder, last updated 1 Jan 2021) reports that the doctrine does not apply to pure service contracts. Mastiff sells a service, so do not count on this doctrine. [secondary]

### 3.2 Reliance is measured against what the client was told [opened]

In Fejedelem the buyer knew the statements were unaudited and estimated, discussed them directly with the defendant, and still relied on them. The court held that reliance was itself negligent and the claim failed, and it treated the test as factual: was the reliance reasonable. **For Mastiff this turns the verdict screen into evidence.** A screen that lists which checks ran and which did not, and says "Mastiff flags. Your firm makes every payment decision" (already required by rule 3 in CLAUDE.md), is what a court would measure reliance against.

### 3.3 A free pilot still carries a duty [opened]

- Fultz v. Union-Commerce Associates, 470 Mich 460 (Mich, 14 Jul 2004), restates that a person who voluntarily undertakes an act, with no prior obligation to do it, may owe a duty to do it without negligence.
- Smith v. Allendale Mutual Insurance, 410 Mich 685 (Mich, 30 Mar 1981), held that whether there is an "undertaking" at all depends on whether the actor agreed or intended to provide a service for the other party's benefit. An insurer's inspections done for its own underwriting were not an undertaking for the insured. Mastiff's check is offered for the client's benefit, so assume an undertaking exists, free or not. This agrees with `insurance.md`, which recommends cover before the first pilot office loads data.
- **Drafting consequence:** define the undertaking narrowly (compare a request with what the client gave us; record what staff report) and say what it is not.

### 3.4 Third parties: a vendor held up, a payee, a bank, an insurer [opened]

- Fultz: when the plaintiff is not a party to the contract, the threshold question is whether the defendant owed a duty separate and distinct from its contract. Loweke v. Ann Arbor Ceiling & Partition (Mich, 2011) later clarified, per a Justia summary and a Michigan Bar Journal article (Oct 2022), that taking on a contract does not shrink the ordinary duties a person owes others, and the question is whether any duty exists at all. [secondary for Loweke]
- Fultz accepts Restatement (Second) section 324A, the negligent-undertaking rule, as Michigan law but warns against using it without regard to limits in Michigan case law. As Fultz and Smith quote it, section 324A speaks of physical harm. A payee whose money is late, or a vendor held up by a HOLD, would face an uphill claim against Mastiff for pure financial loss. This is a lawyer question, not a safe assumption.
- A client's insurer that pays a loss and sues in the client's place stands where the client stood and was held to the client's cap in Guardian Alarm (section 2.4). The terms should say they bind anyone claiming through the client.

### 3.5 What Michigan courts have enforced in contract limits [opened]

- Businesses may contract against liability for their own ordinary negligence (Guardian Alarm; Xu v. Gay). A law-firm survey (Watt Tieder) adds that clauses are generally upheld unless unconscionable, that courts rarely find commercial contracts unconscionable, and that courts are less willing where bargaining power is grossly unequal. [secondary]
- **Not for gross negligence.** Xu v. Gay (Mich Ct App, Docket 237520, decided 24 Jun 2003) states that a contractual waiver protects against ordinary but not gross negligence, citing Lamp v. Reynolds, 249 Mich App 591 (2002), which I did not open. Gross negligence there means conduct so reckless it shows a substantial lack of concern for whether injury results. Johnson v. Aquatic Solutions Physical Therapy (Mich Ct App, 7 May 2026, e-Journal summary) applied the same framework to a facility waiver and enforced it.
- **A clause must say what it does.** In Xu v. Gay a sign-in line saying the gym took no responsibility for injuries was not a release, because it did not tell the reader that signing gave up the right to sue. Any Mastiff limitation clause needs plain words about its effect. The bracket at the end of the draft in section 7 is where that clause goes.

### 3.6 Searched for, not found

No decision, in Michigan or elsewhere in the US, suing a payment-verification or bank-account-validation vendor for missing a bad bank change, and none ruling on a limitation clause in such a vendor's contract. The nearest cases are customer-versus-bank disputes (section 5.3). Searching was limited (a handful of queries), so say "none found", not "none exist".

### 3.7 Where Mastiff's exposure actually sits

1. **The word PASS.** It can be read as approval. Consider "Nothing flagged" and always show which checks ran. This is Devin's decision; rule 3 in CLAUDE.md fixes the disclaimer line but not the verdict word.
2. **Control language.** `product.md` describes a wall, says a payment that cannot be verified does not go out, and says a payment holds until the call is logged. Its success measure is zero payments released to an account not on file during a pilot, phrased as an outcome Mastiff owns. CLAUDE.md and STATUS.md say Mastiff is advisory and never blocks. Public copy and the pilot read-out should use "flags" and "would have held"; keep the zero-payments measure internal. The Journal of Accountancy advice in section 2.3 is the same warning.
3. **Insurance statements.** The ROI note's first position ("the callback that keeps your claim payable") says Mastiff makes insurer answers true and documentable. R1 found that wording differs by carrier, that several base forms have no verification condition (so the callback is an application answer), and that no denial for a skipped callback turned up in the cases. A line that the log keeps a claim payable is a statement a client can later say it relied on. Say what the log records and tell the client to ask its agent what its policy requires. Michigan also licenses insurance counselors (MCL 500.1232, **[search only]**; I could not open the statute); whether naming insurer requirements counts as advising is for the lawyer.
4. **The look-back and the day-30 read-out.** `product.md` says the read-out shows what the wall "caught". Use "would have held" and "worth checking", and keep audit-like or assurance-like words out of both documents. The look-back works only on files the client hands over; state that.
5. **Engine mistakes.** A rules bug that returns PASS for a payee not on file is the textbook negligent-performance claim. The unit tests and the 700-row fixture planned in CLAUDE.md step 4, plus a dated change log of the rules, are evidence of reasonable care. [my inference]
6. **Stored data.** Covered in `data-custody.md`; here only note that the terms must say what is stored and what is not (section 7).

## 4. Does recording make Mastiff a party to the payment?

**Working answer: no, as long as Mastiff stays a record-keeper and an adviser.** A party to a payment is the person who sends it, its bank and the payee. Mastiff gives no payment order, holds no funds and cannot bind the client. Its exposure comes from what it promises (contract), what it tells the client (misrepresentation) and how it performs (negligence). This is reasoning from the cases above, not a source that says so directly.

**Things that would blur the line and should be avoided or decided on purpose:**

1. Mastiff staff making the callback or giving the second sign-off. CLAUDE.md has the client's staff doing both; keep it that way in the pilot, including on day one when Devin sits with the bookkeeper.
2. Any way for Mastiff to block or release a payment (a button wired to the bank or the books). The "not now" list already excludes integrations.
3. Mastiff entering or editing log entries on the client's behalf.
4. Marketing that says Mastiff stops or prevents payments.
5. Advising whether to release a payment on hold ("safe to release").
6. Telling a client what its insurer requires, or that the log satisfies it.
7. Any indemnity or guarantee.

## 5. Records: obligations and discoverability

### 5.1 Does logging create record-keeping obligations?

- **Statute:** I found none that requires Mastiff, as a keeper of a client's payment-check records, to retain them. The search was not exhaustive. [not found]
- **The client's side:** R1 shows carriers put the documentation duty on the insured. One form requires the organisation to record or log the verification and to produce the documentation on a claim; another requires an employee to document the method and result in writing at the time; one policy sets proof of loss at 90 days, another sets notice within 60 days after the policy ends. So the client needs the log on demand and for as long as a claim could be made.
- **The CPA channel:** The FTC Safeguards Rule (16 CFR part 314, current eCFR text read) lists tax-preparation firms among covered institutions and requires them to pick service providers that can safeguard customer information, require safeguards by contract, and reassess providers (section 314.4(f)). Whether vendor payment data a CPA firm routes through Mastiff counts as customer information, and whether Mastiff is a "service provider", are for the lawyer. Expect CPA firms to ask Mastiff to sign such a contract. [opened]

### 5.2 Is the log discoverable?

- **No privilege for Mastiff.** MCL 339.732 makes information a licensed CPA gets from an examination, audit or report on books, records or accounts confidential and privileged, and covers the licensee and persons the licensee employs. Mastiff is not a licensee. A Michigan law-firm article (Plunkett Cooney, 8 Apr 2026) says courts read the statute narrowly because there was no accountant privilege at common law, and that the federal tax-practitioner privilege reaches only certain tax advice in non-criminal matters. [opened] Assume the log, Mastiff's emails with the client and the look-back report can be obtained.
- **Routes.** A party must produce documents in its possession, custody or control (MCR 2.310); a non-party such as Mastiff can be served with a subpoena under MCR 2.305 and has at least 14 days to comply (Michigan courts civil benchbook). The benchbook page does not say whether records held by a client's service provider are within the client's control. **My inference:** if the contract gives the client the right to export, a court will likely treat the log as within the client's control, which is a reason to write the export right in. [opened]
- **Proving the log.** Michigan Rule of Evidence 902(11), as summarised on a third-party rules site, lets a custodian's certification stand in for live testimony that records were kept in the regular course, with written notice to the other side. Mastiff will be the custodian, so offer a standard certification on request. I did not verify the rule text on the courts' site, nor Rule 803(6). [opened, secondary]

### 5.3 Disputes with the client's bank or insurer

- **Bank.** Under UCC Article 4A a bank can put a business customer with the loss only if it used a commercially reasonable security procedure and accepted the order in good faith (Proskauer Rose article, 28 Jan 2015). In Choice Escrow v. BancorpSouth (8th Cir. 2014) the customer lost largely because it had declined dual control. In Experi-Metal v. Comerica (E.D. Mich. 2011) the bank bore the loss because it did not show good faith given unusual activity. A client's log shows which controls it used. **That helps when the controls were followed and hurts when it shows overrides** [my inference]. I did not open the Michigan Article 4A text or the Experi-Metal opinion. [opened article only]
- **Insurer.** From R1: for some forms documented verification is a condition or an exclusion; for others it is an application answer, and a wrong answer carries rescission risk. The log can prove an application answer true or false. That is no reason to withhold the log; it is a reason not to coach clients to answer "always" on applications and to show overrides honestly in the log.

### 5.4 Preserving the record [opened]

- **Brenner v. Kolk, 226 Mich App 149 (Mich Ct App, decided 24 Oct 1997).** Even before any suit, a litigant must preserve evidence it knows, or should know, is relevant; the court may exclude evidence or tell the jury it can draw an adverse inference. The duty is the client's. If Mastiff holds the client's records and deletes them on a schedule, the client carries the consequence.
- **Teel v. Meredith, 284 Mich App 660 (Mich Ct App, 2 Jul 2009)** declined, on its facts, to recognise a separate tort for destruction of evidence by a non-party. So Mastiff's own exposure for deleting is more likely contractual than tort, which is why the terms promise to keep the log on written request and to hand over a full copy when the relationship ends.

### 5.5 What the log does not prove

Mastiff cannot hear calls or know who answered. Entries are the client's statements. The terms say so (section 7), and the field labels in the app should say "reported by" so nobody reads the log as Mastiff's finding.

## 6. What the client's policies require, and what the terms should say about the log

From the R1 matrix (reused as written; carrier forms not re-opened):

| What the carrier wording asks for (R1) | What the engagement terms and the log should do |
|---|---|
| Verification recorded or logged by the insured organisation, with documentation furnished on a claim (Intact M350) | The log is the client's record; the client can export all fields at any time; a custodian certification is available on request |
| Employee documents the method and result in writing at the time, before money moves (Chubb MS-371960.2) | System timestamps at entry; release time later than call time; corrections added as new entries, never edits |
| Method other than the original request; contact details not taken from the request (Beazley, Coalition) | Store where the callback number came from and the date it was on file before the request |
| Caller is not the person who received the request; a different person answers at the vendor; hold until response (Travelers, One80/PSG) | Terms say the client's staff make the call and give the second approval; Mastiff records the names |
| Proof of loss in 90 days (Hiscox); notice within 60 days after policy end (Beazley) | Keep the log for the life of the agreement and hand over a full export at the end; the client chooses longer retention; a hold on written request |
| Wording differs by carrier; no denial for a skipped callback found in cases | Terms and marketing do not state what a client's policy requires |

**Who owns it.** Section 7 says the log is the client's record and Mastiff is its keeper. A CPA firm treats its workpapers as its own property (section 2.3); Mastiff chooses the opposite so the client, not Mastiff, controls disclosure, and so a request to Mastiff for the client's records is something Mastiff tells the client about first (lawyer to confirm how this squares with a subpoena).

## 7. Draft engagement terms (two paragraphs, 242 words, plain English)

> Mastiff is an advisory check. You enter a payment, new vendor or bank-change request; Mastiff compares it with the information you gave us and answers PASS or HOLD with a reason. Mastiff does not move money, approve or release payments, call vendors, or touch your bank or books. Your firm makes every payment decision; your own staff make the callback to the number on file and give the second sign-off. A PASS means only that nothing we check was flagged. We cannot promise every problem will be flagged, or that every flag is right. Mastiff is not an insurer, and our fee is unrelated to any payment's size.
>
> For each vendor we store the name, bank name, last four digits of the account and the callback number on file. We never keep a full account number or tax ID. For each check we log what was entered, the result, the callback and who made it, the second approver, and the release, as your staff report them; we do not listen to calls or confirm identities. That log is your record. You can export it at any time, entries are never edited (corrections are new entries), and on your written request we will keep it for a dispute. Either of us may stop at any time by telling the other; we then give you a full copy and delete ours unless you ask us to keep it. [Liability limit: clause for your lawyer.]

Notes on the draft:

- Covers: advisory only, client decides, what Mastiff stores and does not, no guarantee, the log belongs to the client, either side can stop any day.
- Contains none of the words "fraud", "illegal", "you were hit".
- The "not an insurer, fee unrelated to payment size" sentence follows the Guardian Alarm facts. The "does not call vendors, approve or release" sentence is the line in section 4.
- The bracket must become a plain-language clause that says it limits Mastiff's liability and what that means (Xu v. Gay), sets a fixed dollar floor (section 2.2, point 3), and does not purport to cover gross negligence or wilful misconduct.
- "Delete ours" must be reconciled with the hold-on-request promise and with any backup retention; see `data-custody.md` for the retention proposal.

## 8. Clauses a Michigan lawyer must confirm

1. **Limitation of liability.** Cap amount and form (fixed floor, because the pilot is free); exclusion of indirect and consequential damages; gross negligence and wilful misconduct carve-out; plain wording of effect (Xu v. Gay); whether a small cap is still enforceable for this service (check whether later decisions narrowed Guardian Alarm, 1982); effect on individuals who sign as consumers (USAA, 1987).
2. **Claimants through the client.** Insurers, lenders, successors and anyone claiming through the client are bound; no rights for third parties (Eftsure and nsKnox use both).
3. **"Not an insurer, not a guarantor, fee unrelated to payment size"** (Guardian Alarm facts).
4. **Advisory and client-decides wording**, and a client acknowledgment that it keeps responsibility for payment decisions and internal controls (CPA.com sample). Also the whole-agreement clause: will it keep marketing and the website from being read as promises (negligent-misrepresentation exposure, section 3.1)?
5. **The PASS label and the verdict-screen disclaimer.** Whether "Nothing flagged" or "PASS" with a list of checks run is safer.
6. **Log ownership and custody.** Client owns the log; Mastiff keeps it; export on demand; no edits; custodian certification; hold on written request; deletion and backup timing; what Mastiff does when it receives a subpoena for the client's records (tell the client first; MCR 2.305 gives 14 days).
7. **Confidentiality and data terms.** Last four digits only; breach notice duties. The Michigan breach-notice statute (MCL 445.72) and its definitions are **[search only]**: I could not open them. Also whether Mastiff is a "service provider" a CPA firm must contract with under 16 CFR 314.4(f), and whether Mastiff itself falls within any definition of a financial institution.
8. **Statements about insurance.** Whether telling a client what its policy requires, or that the log meets it, is advising on coverage that needs a license (MCL 500.1232, **[search only]**), and the right disclaimer wording.
9. **Regulated-activity check.** Mastiff never holds or moves funds (money transmission), is not an auditor or CPA and the look-back and read-out are not an audit or assurance report (the Michigan CPA title and reporting rules were not researched), and is not practising law or accounting.
10. **The free pilot.** What supports the agreement when no fee is paid (mutual promises, confidentiality, data access); that "either side can stop any day" works with the cap and with what survives ending; whether a click-through acceptance is valid (not researched).
11. **Disputes.** Michigan governing law, venue (Oakland County), jury waiver, arbitration, fee shifting, and any shortened claim window (Melio and nsKnox's website terms use one year; enforceability in Michigan not researched).
12. **Client responsibilities and indemnity.** Client answers for the accuracy of vendor data and callback numbers it enters, and for its staff making the calls; whether an indemnity for the client's knowing misstatements is appropriate and enforceable (CPA.com sample flags regulator limits for CPAs).
13. **Look-back scan letter.** A separate short letter: files supplied by the client, no verification of them, report wording ("would have held", "worth checking"), no reliance beyond the files.
14. **Fit with Mastiff's own cover.** Contract promises must not exceed what the E&O and cyber policy covers; check contractual-liability and guarantee exclusions (`insurance.md`).
15. **Entity.** Michigan LLC formed and contracts signed in its name before the first pilot document, so the limits protect the right party.
16. **Marketing copy review.** Site, pitch deck and the product description in `product.md` for control language and insurer statements (section 3.7).

## 9. Sources opened (2026-10-27)

Vendor and professional terms
- BILL General Terms of Service: https://www.bill.com/legal/platform-general-terms-of-service (raw page and fetch summary; cap, instructions, security-procedure and as-is clauses)
- BILL Spend and Expense terms: https://www.bill.com/legal/spend-expense-terms-of-service (opened; placeholder text on the page; not relied on)
- Ramp Platform Agreement: https://ramp.com/legal/customer-terms/platform-agreement/platform-agreement (browser pane; sections 1.5, 6.1, 6.2, 8; last updated 8 Oct 2026)
- Ramp third-party tracker: https://conductatlas.com/platform/ramp/ramp-terms-of-service/ (opened; superseded by the primary page)
- Melio Terms of Service: https://melio.com/terms-of-service/meliopayments/ (fetch summary, both halves; sections 3.3, 4.9, 6.4, 7.1, 19, 20, 26, 27); https://melio.com/terms-of-service/ (index page only)
- Eftsure service terms: https://www.eftsure.com/en-nz/terms-of-service/after-20-november-2023/ (browser pane, full text)
- nsKnox Services Agreement: https://nsknox.net/docs/nsKnox-Inc-Services-Agreement-Feb-2021.pdf (downloaded, text extracted); nsKnox website terms: https://nsknox.net/terms-of-use/ (fetch summary)
- Trustpair guarantee page: https://trustpair.com/guarantee/ (browser pane)
- CPA.com sample engagement letter: https://www.cpa.com/sites/cpa/files/2021-08/Sample-Engagement-Letter-and-SLA-for-Client-Accounting-Services.pdf
- Journal of Accountancy: https://www.journalofaccountancy.com/issues/2013/nov/20138593/ ; https://www.journalofaccountancy.com/issues/2016/nov/maintaining-independence-with-nonattest-services/ ; https://www.journalofaccountancy.com/issues/2020/feb/cpa-firm-risks-related-to-consulting-engagements/ (fetch summaries)
- AICPA consulting standard landing page: https://www.aicpa-cima.com/resources/download/statement-on-standards-for-consulting-services-no-1 (no standard text on the page)

Michigan and federal law
- Fejedelem v. Kasco: https://www.courtlistener.com/opinion/1958877/fejedelem-v-kasco/
- Big Rock Corp. v. Warren Systems (business court): https://www.courts.michigan.gov/49807a/siteassets/business-court-opinions/c10-2023-002433-cb(april16,2024).pdf
- Fultz v. Union-Commerce Associates: https://www.courtlistener.com/opinion/848711/fultz-v-union-commerce-associates/
- Smith v. Allendale Mutual Insurance: https://www.courtlistener.com/opinion/1923645/smith-v-allendale-mutual-insurance/
- Loweke (secondary): https://constructionlawopinions.justia.com/2011/06/07/loweke-v-ann-arbor-ceiling-partition-co-llc ; https://www.michbar.org/journal/Details/ArticleID=4510
- St. Paul v. Guardian Alarm: https://www.courtlistener.com/opinion/1753038/st-paul-fire-marine-ins-co-v-guardian-alarm-co-of-mich/
- USAA v. Universal Alarms: https://www.courtlistener.com/opinion/1691928/usaa-group-v-universal-alarms-inc/
- Xu v. Gay: https://caselaw.findlaw.com/court/mi-court-of-appeals/1357363.html
- Johnson v. Aquatic Solutions (summary): https://www.michbar.org/opinions/content_search_detail/EJournalNumber/85707
- Watt Tieder Michigan survey (secondary): https://50-state.watttieder.com/states/michigan/
- Brenner v. Kolk: https://www.courtlistener.com/opinion/1251355/brenner-v-kolk/
- Teel v. Meredith: https://www.courtlistener.com/opinion/1667205/teel-v-meredith/
- MCL 339.732: https://www.legislature.mi.gov/Laws/MCL?objectName=mcl-339-732
- Plunkett Cooney on the accountant statute: https://www.plunkettcooney.com/tax-law-estate-plans-probate-business-succession/accountant-confidentiality-statute
- Michigan courts civil benchbook, request for documents: https://www.courts.michigan.gov/490820/siteassets/publications/benchbooks/civil/civilresponsivehtml5.zip/Civil/Ch_5_Discovery/Request_for_Documents.htm
- Michigan Rule of Evidence 902 (third-party site): https://www.courtrules.net/michigan/michigan-rules-of-evidence/rule-902
- Proskauer on bank and customer disputes: https://privacylaw.proskauer.com/2015/01/articles/cybersecurity/courts-address-the-level-of-security-banks-must-provide-to-business-accounts/
- Warner Norcross on the duty to preserve (general, not Michigan-specific): https://www.wnj.com/updates/a-closer-look-when-the-duty-to-preserve-evidence-arises/
- 16 CFR part 314 (eCFR): https://www.ecfr.gov/api/versioner/v1/full/2026-10-01/title-16.xml?part=314

Local files read: `_config/product.md`, `STATUS.md`, `roi-and-research-2026-10-24.md`, `r1/requirements-matrix.md`, `r4/primary-statistics.md`.

## 10. Not verified or not found

- Trustpair's actual terms, the amount and conditions of its indemnity, and a "$1M" figure that appeared only in a search summary.
- Williams v. Polgar, Stockler v. Rose and Lamp v. Reynolds: read only as cited inside Fejedelem, the business-court opinion and Xu v. Gay.
- Fultz and Smith were read in full text; Loweke only through two secondary sources.
- MCL 500.1232 (insurance counselors), MCL 445.72 and its definitions (breach notice), Michigan's Article 4A sections, Rory v. Continental or any other rule on shortened claim periods, Michigan UETA, and the Michigan CPA title and reporting rules: not opened.
- Michigan Rule of Evidence 803(6) text, and the current text of 902(11) on the courts' own site.
- Whether records on Mastiff's servers are within the client's "control" for MCR 2.310 (the benchbook page is silent; my reading is an inference).
- Whether data a CPA firm routes through Mastiff is "customer information" under the FTC rule.
- Experi-Metal and Choice Escrow: known only from the Proskauer article.
- Carrier forms: R1 was reused as written; I did not reopen the underlying policies.
- BILL and Melio are summaries of long documents; the Melio terms have two versions by state and I read the Melio Payments version. BILL's page shows a 2023 date that may be stale.
- Eftsure's separate addenda (one returned 404) and Ramp's bill-pay-specific terms were not read.
- No search found any case against a verification vendor; "none found" reflects a handful of queries.
