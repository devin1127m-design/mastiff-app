# R5: Mastiff's own exposure

Stage 01 output, 2026-10-27. Internal paper for Devin, a Michigan lawyer and an insurance broker. It is research and a first draft, not legal or insurance advice. A Michigan lawyer must review sections 2, 3 and 5 before any of it is used with a client, and a licensed broker must confirm every coverage point in section 4 against an actual policy.

How this file was made. It merges the three working notes in this folder (`legal-exposure.md`, `insurance.md`, `data-custody.md`), which are kept as written. A source check found 58 problems in those notes. Every fix is applied here and claims that could not be supported are dropped, so where this file and a working note disagree, this file is the corrected version. Two primary sources were opened for this synthesis: the Authentic Title opinion and the Lowenstein alert on SS&C. Keys in square brackets, such as [C5] or [D3], point to the URLs in section 8. **[inference]** marks reasoning that no source states; **[secondary]** marks a law-firm, trade or aggregator source; **[summary]** marks a page read only through a summarising tool. Client-facing text (the draft terms in 3.1, the promises in 5.2 and the wording in section 6) avoids "fraud", "you were hit" and "illegal".

## 1. The question and the answer

R5 asks whether logging a verification makes Mastiff a party to the client's payment decision, what Mastiff's engagement terms and E&O cover should be, and where client data (last four digits, callback numbers) should live.

1. **Not a party, on what was found.** Mastiff gives no payment order, holds no funds and cannot release anything, and no case was found treating a record-keeper or verification vendor as a party to a client's payment. That is an absence of authority, so a lawyer must confirm it, and it holds only while Mastiff never calls vendors, signs off, releases, holds signing authority or edits the client's log (2.6).
2. **The real exposure is as a supplier of information.** A wrong PASS invites a negligent-misrepresentation or negligent-performance claim for the whole payment. The defences are what the client was told the check does not do, a plain liability limit with a fixed dollar floor (the pilot has no fees), and a record of reasonable care.
3. **Insurance:** tech E&O plus cyber, on one form if offered, $1M/$1M, retention $5,000 or less, with a $2M quote alongside. Bind before the first pilot office hands over a real file, because a free pilot is still an undertaking and some forms cover only work done for a fee. Ask every broker about funds and theft exclusions first.
4. **Data:** one Supabase Pro project in us-east-2, Vercel Pro pinned to Cleveland, Resend for notices that carry no client detail. Last four digits only, enforced in the app and in the look-back script. The log is the client's record and exportable at any time. Paid tiers start with the first real file.
5. **The largest risks are words, not code:** "PASS" read as approval; "wall", "does not go out" and "caught"; "the callback that keeps your claim payable"; and promises the upstream providers do not back (30 days' notice of provider changes, breach notice that Vercel may never give).

## 2. Liability: what would make Mastiff a party, and what keeps it advisory

### 2.1 Working answer

A funds transfer has a sender, the banks and a payee. Mastiff is none of them [inference; Michigan's Article 4A text was not opened; the Article 4A summary is in S4]. Its exposure comes from what it promises (contract), what it tells the client (misrepresentation) and how it performs (negligence). This is reasoning from the cases below, not a holding.

### 2.2 Negligent misrepresentation and reliance

- **Fejedelem v. Kasco, 269 Mich App 499 (decided 24 Jan 2006)** [C1]. The claim needs justifiable reliance, to the plaintiff's harm, on information prepared without reasonable care by someone who owed a duty of care. The court noted that Stockler v. Rose (1989) adopted Restatement (Second) of Torts section 552 as the minimum standard for an accountant's liability to third parties. The buyer knew the statements were unaudited and estimated, discussed them with the accountant, and could not get fuller records, so its reliance was itself negligent and the claim failed. Reliance is a factual question judged on all the circumstances.
- **Big Rock Corp. v. Warren Systems, No. 23-002433-CB (Saginaw County Circuit Court, Business Court, 16 Apr 2024; a trial-court ruling, not binding)** [C11]. It lists the elements, says the tort does not require privity of contract (quoting an unpublished Court of Appeals decision, Sayo v. CTM Group, 2003), and traces the tort to Williams v. Polgar (1974). Michigan courts have applied it to attorneys, insurance agents, accountants and financial advisors. The court used the economic loss doctrine to bar the claim in a commercial sale of goods.
- **Economic loss doctrine.** A law-firm survey reports that Michigan does not apply it to service contracts (Frommert) [S1, secondary, last updated 1 Jan 2021]. Mastiff sells a service, so do not count on it.
- **For Mastiff** [inference]: the verdict screen and the terms are likely to be central evidence of what the client was told. A screen that lists which checks ran and which did not, with rule 3's line "Mastiff flags. Your firm makes every payment decision.", is the best evidence that relying on a PASS for more than those checks was unreasonable.

### 2.3 A free pilot still carries a duty; third parties

- **Fultz v. Union-Commerce Associates, 470 Mich 460 (14 Jul 2004)** [C2]: someone who voluntarily undertakes an act may owe a duty to do it without negligence. **Smith v. Allendale Mutual Insurance, 410 Mich 685 (30 Mar 1981)** [C3]: whether there is an undertaking depends on whether the actor agreed or intended to provide a service for the other party's benefit. Mastiff's check is for the client's benefit, so assume a duty exists, fee or no fee.
- **Loweke v. Ann Arbor Ceiling & Partition, 489 Mich 157 (6 Jun 2011)** [C4]: taking on contractual obligations does not extinguish or limit separately existing common-law duties owed to non-contracting third parties, and following Fultz the question is whether the defendant owes any duty at all. Background commentary only: S5, S6.
- Fultz accepts Restatement section 324A (negligent undertaking) with limits, and as quoted in Fultz and Smith it speaks of physical harm. A payee paid late, or a vendor held up by a HOLD, would face an uphill claim against Mastiff for pure financial loss [inference; lawyer to confirm].
- A client's insurer that pays a loss and sues in the client's place was held to the client's contract limit in Guardian Alarm (2.4). The terms should bind anyone who claims through the client.

### 2.4 What Michigan courts have enforced

- **St. Paul Fire & Marine Ins. Co. v. Guardian Alarm Co., 115 Mich App 278 (23 Mar 1982)** [C5]. An alarm-monitoring contract limited liability to the lesser of $250 or six monthly payments, as liquidated damages; the fee was $60 a month, so $250 applied. The court enforced it as a liquidated-damages clause, because damages were hard to fix in advance and the alarm company was not an insurer. The contract said in bold that the company was not an insurer and that the fee was set by the value of the service, not of the property. The court rejected public-policy, unconscionability and adhesion arguments (two corporations at arm's length; a standard form is not enough for adhesion), and held the customer's insurer, suing as subrogee after paying $13,417.43, to the clause. Quoting Allen v. Michigan Bell, it enforced the term despite unequal bargaining power because the term was substantively reasonable. The case was decided as a jurisdiction question: the clause put the claim below the circuit court's amount threshold.
- **USAA Group v. Universal Alarms, 158 Mich App 633 (5 Feb 1987)** [C6] followed it for an individual whose cottage burned (loss over $215,000) and found no contract of adhesion on that record. Neither case discusses gross negligence. Both are old, and a lawyer must check later treatment.
- **Xu v. Gay, 257 Mich App 263 (24 Jun 2003)** [C7], citing **Lamp v. Reynolds, 249 Mich App 591 (2002)** [C8]: a contractual waiver covers ordinary negligence but not gross negligence, meaning conduct so reckless that it shows a substantial lack of concern for whether injury results. A gym sign-in line was not a valid release, because it did not tell the reader that signing gave up the right to sue. Any Mastiff limit must say plainly what it does.
- A 2026 Court of Appeals decision applied the same framework and enforced a facility waiver (Johnson v. Aquatic Solutions Physical Therapy, 7 May 2026) [S7, State Bar e-Journal summary only].
- A law-firm survey [S1, secondary] says limitation clauses are upheld unless unconscionable, that courts rarely find unconscionability in a commercial setting, and that courts are less likely to enforce exculpatory clauses where the parties are in unequal bargaining positions (citing Allen).

### 2.5 How comparable services word their terms

| Provider and document | Who decides and bears the loss | No-guarantee wording | Liability cap | Other points |
|---|---|---|---|---|
| **BILL** General Terms of Service, effective 20 Jan 2023; current status unconfirmed. The page carries template filler text that also appears on BILL's Spend and Expense terms dated 30 Sep 2026 [V1, V2] | Customer bound by payment instructions and bank-account changes made under BILL's security procedures, whether or not authorised; responsible for its logins. BILL calls its procedures commercially reasonable | No warranty that the service is completely secure or bug-free; no duty to monitor | Greater of fees paid in the prior 12 months or $100; indirect and consequential damages excluded | Arbitration; BILL may change the terms |
| **Ramp** Platform Agreement, last updated 8 Oct 2026; the page reads only in a browser [V3] | Customer responsible for its users and for all decisions it makes based on the services | No promise that the services are accurate, meet the customer's needs or are secure; AI outputs can be wrong | 6.1: greater of fees paid in the prior three months or $10,000. 6.2 (subscription services): greater of three months' subscription fees or $50,000. Cap does not apply to a party's own fraud, gross negligence or wilful misconduct | Consequential damages excluded |
| **Melio** Solutions Terms, the version Melio's index page sends Michigan users to; revised 24 Jun 2026 [V4] | Customer solely responsible for selecting the correct recipient (6.4) and for accurate recipient details (4.9); Melio follows instructions (7.1); recipients are independent third parties (3.4) | As-is; no promise of uninterrupted or secure access (20) | Direct damages actually incurred in the six months before the claim arose; lost profits excluded (19) | Claims barred after one year (26.1); 30-day arbitration opt-out (26.3); customer releases Melio and its officers, agents and employees from claims it has against recipients or other third parties (27) |
| **Eftsure** service terms for contracts from 20 Nov 2023 (Australian entity, New South Wales law, page tagged legacy) [V5] | Customer alone decides whether the service suits it; Eftsure may rely on a payee representative and does not check the customer's own information | Checks reduce, not remove, risk; no liability for an error it does not detect if it acted reasonably and followed its stated process (3.3); no promised response rate (3.4) | Fees paid in the prior 12 months, both sides, no floor (7.4); reduced to the extent the customer contributed (7.6) | Independent contractor (11.9); no third-party rights (11.3); customer keeps its own copies and data loss is excluded (6.4) |
| **nsKnox** Services Agreement, undated (file name says Feb 2021) [V6] | Customer answers for its users and for the accuracy of what it supplies (4.2) | As-is (8.4), except a limited warranty that the solution operates substantially per its functional specifications (8.2), with repair or adjustment as the sole remedy (8.3) | Indirect damages excluded for both sides; direct damages capped at fees paid in the 12 months before the claim, no floor; cap does not apply to nsKnox's gross negligence or wilful misconduct (11.1) | Either side may end on 30 days' written notice (7.2); independent contractors (12.1). Separate website terms cap liability at what the user paid (nothing, for a free user) and bar claims after one year [summary] |
| **Trustpair** guarantee page and home page (browser pane) [V7] | Says it indemnifies customers up to a defined amount in the event of payment fraud (internal paper only; keep that word out of client text). Its FAQ says this is part of its standard Terms of Service | Concedes that no system can claim zero risk; says the guarantee comes without complex negotiation or hidden conditions | The home page shows "$1M", labelled "Liability*" with "(*Up To)"; the footnote is not visible, so conditions are unknown | The footer has no Terms link. Scripted requests to the site are blocked (403 on every page), so whether public terms exist is unconfirmed. Contrast case: do not copy |

What to take from them:

1. **The customer decides and owns the result of its instructions** (BILL, Ramp, Melio). Mastiff's version: the firm makes every payment decision, and the firm's own staff make the call and give the second sign-off.
2. **No promise of detection.** Eftsure ties its exclusion to having acted reasonably and followed its stated process. That is a better model than a flat "no liability", because it commits Mastiff to doing what it says and nothing more.
3. **Caps.** BILL, Eftsure and nsKnox cap at fees paid in the prior 12 months and Ramp at three months' fees. Only two of the five (BILL at $100, Ramp at $10,000 or $50,000) add a dollar floor. Melio instead caps direct damages incurred in the six months before the claim. **Mastiff's pilot has no fees, so a fees-based cap would be $0, which a court may treat as illusory** [inference]. Use a fixed dollar floor, set with the lawyer and the broker.
4. **Carve-outs for gross negligence and wilful misconduct** (Ramp, nsKnox). Michigan requires this anyway (Xu v. Gay).
5. **Independent contractor and no third-party rights** (Eftsure, nsKnox).
6. **Claim windows and arbitration** (Melio, BILL). Whether they suit a two-person local business is for the lawyer.
7. **No indemnity.** An indemnity is a guarantee in contract form. Offer none unless counsel and the insurer agree.

**Accounting-firm letters.** The CPA.com sample engagement letter for accounting and advisory services [V8] is informational and says no AICPA technical committee approved it. It puts on the client the responsibility for internal control and for preventing and detecting fraud (the letter's own term), with an optional paragraph adding all management decisions. It says the firm is not required to, and will not, verify the accuracy or completeness of the information the client provides. Workpapers are the firm's property; electronic files are kept three months in the sample; an optional clause has the client indemnify the firm for knowing misrepresentations; fee disputes go to AAA arbitration; either side ends by written notice. Mastiff differs on purpose: the log is the client's record, not Mastiff's workpaper. The Journal of Accountancy pieces [S8, secondary] say: avoid wording that suggests the firm takes on management functions, and record advice in writing with the client deciding (Ference, Nov 2013); for attest clients the client must assume management responsibilities, designate an overseer, evaluate the results and accept responsibility (Murphy, Nov 2016, citing ET 1.295.040); agree scope and responsibilities in an executed letter, updated by addendum (Yoo, Feb 2020). The 2013 and 2016 pages carry a notice that the archived article may be outdated, so check the current AICPA Code section (ET 1.295.040) before using this vocabulary with CPA-firm prospects.

### 2.6 Lines that keep Mastiff advisory

Mastiff stays outside the payment only while it does none of the following:

1. Mastiff staff make the callback or give the second sign-off, including on day one when Devin sits with the bookkeeper.
2. Mastiff can block or release a payment (any button wired to the bank or the books).
3. Mastiff enters or edits log entries on the client's behalf.
4. Mastiff holds signing authority or credentials on a client account. In SS&C, the insurer argued that five SS&C employees were authorised signers on the client's account; the court treated that as administrative ability, not authority, but Mastiff should never be in that position [S10].
5. Copy says Mastiff stops, prevents or catches payments.
6. Mastiff advises whether a held payment is safe to release.
7. Mastiff tells a client what its insurer requires, or that the log satisfies it. This is also a licensing question: MCL 500.1232 bars an unlicensed person from auditing or summarising insurance policies or advising on them, with exceptions for licensed agents' ordinary advice and Michigan lawyers [P3]. Whether telling a client what its policy requires is "advising" is for the lawyer.
8. Mastiff gives any indemnity or guarantee.

### 2.7 Records: assume the log is discoverable

- **No privilege.** MCL 339.732 bars a licensee or employee from disclosing information from an examination, audit or report on books, records or accounts without the client's written permission, and says information from a CPA's professional services is confidential and privileged. It has exceptions, including disclosure to law enforcement or government where the licensee reasonably believes the client broke the law [P4]. Mastiff is not a licensee. A Michigan law firm (Plunkett Cooney, 8 Apr 2026) [S2, secondary] says courts construe the statute strictly because there was no accountant privilege at common law, and that the federal tax-practitioner privilege covers only certain tax advice in non-criminal matters. Assume the log, Mastiff's emails with the client and the look-back report can all be obtained.
- **Routes.** A party produces documents in its possession, custody or control (MCR 2.310). A non-party such as Mastiff can be subpoenaed (MCR 2.305) and has at least 14 days to comply [P12]. The benchbook does not say whether a service provider's records are in the client's control; a contractual export right makes that more likely [inference].
- **Proving the log.** Michigan Rule of Evidence 902(11), read on a third-party rules site, lets a custodian's certification replace live testimony that records were kept in the regular course, with notice to the other side [S3, secondary; the courts' own text was not checked]. Offer a standard certification on request.
- **Preservation.** Brenner v. Kolk, 226 Mich App 149 (24 Oct 1997) [C9]: a litigant must preserve evidence it knows or should know is relevant, even before suit; the sanctions are exclusion of evidence or an adverse-inference instruction. The duty is the client's. Teel v. Meredith, 284 Mich App 660 (2 Jul 2009) [C10] held that Michigan does not recognise a cause of action for spoliation of evidence; that case concerned spoliation interfering with a suit against a third party. Mastiff's own exposure for deleting records is therefore more likely contractual than tort [inference], which is why the terms promise to keep the log on written request.
- **Bank disputes.** Under UCC Article 4A a bank can leave a business customer with a loss only if it used a commercially reasonable security procedure and accepted the order in good faith (4A-202) [S4, Proskauer, 28 Jan 2015, secondary]. In Choice Escrow v. BancorpSouth (8th Cir. 2014) the customer lost after declining dual control. In Experi-Metal v. Comerica (E.D. Mich. 2011) the court found the bank failed to carry its burden on good faith given unusual activity (wire volume, a roughly $5 million overdraft on a normally empty account, wires to Russia); the article implies the bank bore the loss. Neither opinion was opened. A client's log shows which controls it used: it helps when they were followed and hurts when it shows overrides [inference]. Record overrides honestly anyway.
- **Insurer disputes.** From R1: for some forms a documented check is a condition or an exclusion; for others it is an application answer, and a wrong answer carries rescission risk. The log can prove an application answer true or false. Do not coach clients to answer "always".
- **What the log does not prove.** Mastiff cannot hear calls or know who answered. Entries are the client's statements, and the screens should say "reported by".
- **Searched for, not found** (a handful of queries, so "none found", not "none exist"): any US decision against a payment-verification or account-validation vendor for missing a bad bank change; any ruling on a limitation clause in such a vendor's contract; any statute requiring Mastiff, as keeper of a client's records, to retain them.

## 3. Engagement terms

### 3.1 Draft (two paragraphs, 248 words)

> Mastiff is an advisory check. You enter a payment, new vendor or bank-change request; Mastiff compares it with the information you gave us and answers PASS or HOLD with a reason. PASS means only that no listed check flagged anything. Mastiff does not move money, approve or release payments, call vendors, or touch your bank or books. Mastiff flags. Your firm makes every payment decision; your staff make the callback to the number on file and give the second sign-off. We cannot promise to flag every problem, or that every flag is right. Mastiff is not an insurer, our fee does not depend on payment size, and we do not advise on insurance.
>
> For each vendor we store the name, bank name, last four digits of the account and the callback number on file; we never accept a full account number or tax ID. For each check we log what was entered, the result, the callback, the second approver and the release, as your staff report them. We do not hear calls or confirm who answered. The log is your record: export it any time; entries are never edited, only corrected by new entries. On your written request we keep it for a dispute. Either of us may stop any day by telling the other; you then have 30 days to export, then we delete your records (unless you asked us to keep them) and confirm in writing. [Liability limit: counsel's plain-language clause, with a fixed dollar amount.]

What changed from the working draft: PASS is defined; "we do not advise on insurance" is added (2.6 item 7); the exit wording now matches the custody decision (30 days to export, then deletion). The "not an insurer, fee not tied to payment size" sentence follows the Guardian Alarm facts. The bracket must become a clause that says in plain words that it limits what the client can recover (Xu v. Gay), sets a fixed dollar floor (2.5 point 3), and does not cover gross negligence or wilful misconduct.

### 3.2 Clauses a Michigan lawyer must confirm

1. **Limit of liability.** A fixed dollar amount, because a fees-based cap is $0 in a free pilot. Exclude indirect and consequential damages; no cover for gross negligence or wilful misconduct (Xu, Lamp); plain words about its effect (Xu); whether to frame it as liquidated damages, as in Guardian Alarm; whether a small limit still holds for a service whose purpose is care, given later case law; how it applies to an individual who signs as a consumer (USAA). Coordinate with the broker: one tech E&O underwriter names a cap equal to the policy limit as a red flag [S13], and a 12-month-fees cap at about $199 a month is about $2,400, far below a typical lost wire, so clients may push back.
2. **Who is bound.** Insurers, lenders, successors and anyone claiming through the client; no third-party rights (Eftsure, nsKnox).
3. **Not an insurer or guarantor; fee not based on payment size** (Guardian Alarm facts).
4. **Advisory, client decides.** The client acknowledges it keeps responsibility for payment decisions and internal controls (CPA.com sample). Whether a whole-agreement clause keeps the website and pitch from being read as promises (2.2).
5. **The verdict label.** "PASS" with the list of checks run, or "Nothing flagged".
6. **The log.** Client's record, Mastiff its keeper; export at any time; no edits; custodian certification (MRE 902(11)); hold on written request; deletion and backup timing; what Mastiff does when subpoenaed for a client's records (tell the client first; MCR 2.305 allows 14 days); whether the export right puts the log in the client's control under MCR 2.310.
7. **Confidentiality and breach.** The five promises in 5.2. Mastiff's duty to notify the client under MCL 445.72(2) [P2]. Whether last four plus a name is ever "personal information" under MCL 445.63(r) [P1], including for sole-proprietor vendors, and what happens if a raw file is lost before it is cut down. The 72-hour figure. SB 360 if it passes [P7].
8. **Provider changes.** What notice Mastiff can promise, given Supabase gives 30 days only to subscribers, Vercel states no period, and Resend gives 14 days (5.2 notes).
9. **FTC Safeguards Rule.** Whether Mastiff is a "service provider" to an accounting client under 16 CFR 314.4(f) [P9], and whether an office that pays bills for household clients changes the answer.
10. **Statements about insurance.** MCL 500.1232 [P3], and the right disclaimer.
11. **Regulated activities.** Money transmission under Michigan law (only a California opinion letter was read, 4.4); the look-back and read-out are not an audit or assurance report (Michigan CPA title and reporting rules were not researched); Mastiff does not practise law or accounting.
12. **The free pilot.** What supports the agreement without a fee; whether a click-through acceptance is valid; what survives when either side stops.
13. **Disputes.** Michigan law, Oakland County venue, jury waiver, arbitration, fee shifting, any shortened claim window (Melio and nsKnox's website terms use one year; Michigan enforceability not researched).
14. **Client duties.** The client answers for the accuracy of vendor data and callback numbers it enters and for its staff making the calls. Whether a client indemnity for knowing misstatements is appropriate (the CPA.com sample notes regulators may restrict such clauses for CPAs). Mastiff gives no indemnity.
15. **Retention against exposure.** The deletion promise against Mastiff's six-year contract limitation period (MCL 600.5807(9)) [P6]; wording of the legal-hold exception.
16. **Look-back letter.** A separate short letter: files supplied by the client; Mastiff does not verify them; report wording is "would have held", "worth checking", "missing"; no reliance beyond the files; files with more than four digits of an account or tax ID are refused.
17. **Entity and cover.** The Michigan LLC formed, and every contract signed in its name, before the first pilot document; whether anything may be signed before the LLC exists; no promise wider than the E&O and cyber policy (section 4).
18. **Special clients.** Flow-down terms if an insurance agency becomes a client (MCL 500.555(6)) [P5]; other states' laws for out-of-state vendors (not researched).

## 4. Insurance

### 4.1 Recommendation

- **Buy tech E&O and cyber, on one form if a carrier offers it.** Tech E&O answers third-party claims for a wrong or missed answer. Cyber covers breach response, privacy liability, regulatory defence and business interruption, plus dependent business interruption for Supabase, Vercel, Resend and any AI vendor. Combined forms exist: Embroker's tech E&O and cyber form, sold to brokers as "Embroker Access" (non-admitted, Everspan Indemnity, AM Best A-) [I3]; Hartford CyberChoice Professional (technology liability, media, cyber and professional services in one policy, broad form contractual liability, cyber deception cover; the flyer is aimed at larger accounts and small-business quotes run through agents) [I4]; Chubb DigiTech ERM (technology E&O, media and cyber exposures on one policy, covering financial injury to third parties from the insured's products and services) [I5]; Coalition tech E&O, combinable with its cyber policy [I6].
- **Bind before the first pilot office hands over a real file, not "before the first paid client"** (CLAUDE.md and STATUS.md say the latter; this is a proposal for Devin). A free pilot is still an undertaking (2.3). Beazley's tech services section defines the covered work as services performed for others for a fee [I2], and Coalition describes the exposure as arising from a service provided in exchange for a fee [I6], so whether a free pilot is covered is a broker question. The fix may be written confirmation, an endorsement or a nominal fee. Beazley's specimens are claims-made and reported [I1, I2]; ask each broker about its own form. The retroactive date must reach back to the first pilot.
- **Optional:** social-engineering and funds-transfer cover for Mastiff's own money at the lowest sublimit offered. Embroker's sublimit is $500,000 and includes client money in the insured's trust or control [I3]. Low priority.
- **"Advisory only, never moves money" is a fact to document, not a proven discount.** No carrier, broker or rate source was found saying a no-custody service gets a better rate or class. Embroker sends "Fintech" to additional underwriting review and puts "Financial Institutions" out of appetite [I3], so how Mastiff is classed matters. Give underwriters these facts in writing: no bank credentials, no custody, no release or signing authority, last four digits only, a person confirms every item an AI reads (rule 5), and an exportable log. A tech E&O underwriter at Berkley (Insurance Business, 24 Dec 2025) [S13, secondary] calls breach of contract the most significant exposure and names red flags: a liability cap equal to the policy limit, missing consequential-damages disclaimers, warranties that overpromise and one-sided indemnities.

### 4.2 Limits

$1M per claim and $1M aggregate on both the E&O and cyber parts, retention of $5,000 or less, and a $2M quote alongside. Reasoning (opinion): the losses cited in R1 and R4 are $93,425 (CFC case, 2019) and an average of $125,439 for invoice-impersonation transactions (FinCEN, 2017-18 sample), against client policy sublimits of $100,000 to $250,000 in R1, so a single client claim is likely to be under $1M. Defence costs can erode the limit (Beazley's form says they reduce and may exhaust it [I1]). Morgan Lewis (15 Sep 2025) [S14, secondary] says limits of $2-$5 million are "not uncommon" for small-to-medium technology vendors, and lists additional-insured status, certificates and policy review, and how long vendor policies stay in force after termination as negotiation points. That is market practice, not a rule for payment-control vendors; price the $2M step now.

### 4.3 Cost, for planning only

No carrier publishes a premium for a payment-verification service; the real number comes from a quote. Published figures for IT consultants: Insureon (updated 12 Jun 2026) [S17] gives $899 a year for tech E&O at $1M/$1M with a $2,500 deductible and $1,540 a year for cyber with no limits stated; it calls these averages in the product sections and medians in its methodology note. TechInsurance figures reported on a QuoteSweep page [S18] are $785 and $1,964, undated; QuoteSweep notes both are divisions of Specialty Program Group, so they are not independent. **Both lines together come to about $2,440 (Insureon) to $2,750 (TechInsurance) a year.** Embroker's retentions start at $5,000 [I3], above the $2,500 those figures assume. Next lists $90 a month for IT consultants, professional liability only, limits not stated [I8].

### 4.4 Exclusions and coverage points to raise

Retail carrier forms are not public. The only full wording read is Beazley's modular specimen (F00806 general terms, F00807 tech services section) [I1, I2]; treat it as an example of what to look for.

1. **Funds and theft exclusions: the first question for every broker.** F00806 excludes loss from commingling, mishandling of, or liability to pay, collect or safeguard funds [I1]. In **Authentic Title Services v. Greenwich Insurance, No. 18-4131 (D.N.J. 17 Nov 2020)** [C12], an E&O exclusion for claims arising from "commingling, improper use, theft, stealing, conversion, embezzlement or misappropriation of funds or accounts" barred cover after the insured wired $480,750.96 to an impersonator's account. The court held that it does not matter who committed the theft, the insured or another party, if the claim arose from such an act. It relied on a 2016 Connecticut decision (Accounting Resources v. Hiscox) that reached the same result for a bookkeeping company tricked into paying fake invoices. **For Mastiff [inference]:** every likely E&O claim against Mastiff arises from a third party taking a client's money, so an exclusion like this, unless limited to the insured's own handling of funds, could remove cover for Mastiff's main exposure even though Mastiff never touches money. This corrects the working note's view that the funds exclusion "should not apply".
2. **Represented performance.** F00806 excludes loss from the failure of services to conform with any represented quality or performance [I1]. A claim framed as "Mastiff said it would catch this" aims straight at it. No exclusion literally named "failure to detect" was found. The mitigation is the copy in section 6.
3. **Contract.** F00807 excludes contractual liability but carves back the obligation to perform the tech services and liability that would exist without the contract; liquidated damages beyond that are not covered [I2]. Embroker advertises express breach-of-contract cover and liability assumed contractually [I3]; Hartford advertises broad form contractual liability [I4]. A dated reference point: in 2007 one underwriter on an Insurance Journal panel (Bartkiewicz, Darwin Professional Underwriters) said errors in performance, judgment and design are covered, while errors in sales terms, staffing and commitments are not [S16].
4. **Dishonesty of the insured.** F00806 applies this exclusion to acts by an insured or with its collusion, and pays defence costs until a final non-appealable adjudication [I1]; it does not reach third-party impersonation. **SS&C Technologies v. AIG Specialty, No. 19-cv-7859 (S.D.N.Y.):** AIG's motion to dismiss was largely denied on 5 Nov 2019 (Connecticut law) [S9]; on 29 Jan 2020 the court held AIG owed indemnity under SS&C's professional liability policy for about $5.9 million wired on spoofed requests, rejecting an exclusion for funds lost through the insured's exercise of authority or discretionary control [S10]. SS&C is a fintech fund-services provider that processed the client's wires, so it is a closer fit for a payment processor than for Mastiff. IRMI [S11, secondary, 2006] warns that some forms drop severability or trigger on an admission. Ask for severability and a final-adjudication trigger.
5. **Delay.** Travelers says many technology E&O forms have a delay exclusion and that its own CyberRisk Tech form does not (a carrier marketing statement) [I11]. A HOLD that makes a payment late is the complaint Mastiff is most likely to hear [inference]. Ask.
6. **Cyber carve-back.** F00806 excludes failure to safeguard data, lifting the exclusion only for a purchased professional, breach response, infosec, first-party cyber or technology services section [I1]. Buy the tech and cyber parts together and confirm the carve-back is on the form.
7. **Service description.** F00807 covers the professional services listed in the declarations [I2]. The application must describe what Mastiff does (payment-request checks, holds, callback log).
8. **AI.** Fenwick (15 Jun 2026) [S12, secondary], citing unattributed reports, says some carriers decline AI-output liabilities under tech E&O or add AI exclusions; broad "absolute" AI exclusions are reported in D&O and EPLI; affirmative AI endorsements may narrow cover to listed scenarios. State rule 5 (the AI reads, a person confirms) in the application in those words.
9. **Claims-made terms.** F00806 is claims made and reported; F00807 requires notice within 30 days after the policy period and allows notice of circumstances during it [I1, I2]. Get the retroactive date, extended reporting option and notice terms in writing.
10. **Confidentiality agreement.** It does not shift risk away from Mastiff, which is the party making the promises. Under carve-back wording like F00807, liability that exists without the contract stays covered while extra promises (indemnity, liquidated damages, strict deadlines, uncapped liability) tend to fall out [inference from I2]. A Fordham journal piece (28 Apr 2017, on D&O forms) [S15, secondary] says overly broad lead-in language in the contractual exclusion has the potential to preclude coverage for a wide range of claims, and that security promises in vendor contracts may be alleged as misrepresentations when stated standards were not kept. Keep the agreement lean (5.2) and give the broker a copy before binding.

Two further facts for the lawyer and broker:

- **Claim pattern.** A payment processor's SEC filing (CIK 1088034, fiscal 2015 legal-proceedings note) [P15] describes a customer, a church, suing the processor for not warning of or stopping $181,709 in bad transactions, under an agreement that capped the processor's liability at one month of fees. The customer voluntarily dismissed in April 2015; the processor then sued the customer for breach, and they settled in March 2016 with no payment and no loss accrued. It shows the claim type exists and where vendors put the cap; because the claim was dropped, it is weak evidence that such claims succeed.
- **Money transmission.** A 16 May 2013 opinion letter from staff counsel at California's Department of Financial Institutions (now DFPI) [P14] said a software company that did not have "ownership or control of the account or of any funds" would not be deemed to be engaged in money transmission, on the facts presented (a bank held the funds). That is one state and one fact pattern; Michigan was not researched, and a Michigan lawyer must confirm Mastiff is outside the state's money transmission law.

### 4.5 Brokers to call

1. **MAIA Insurance Services, through SBAM.** SBAM and the Michigan Association of Insurance Agents launched a cyber program in 2023; MAIA offers SBAM members access to 10 leading cyber insurance providers. Contact on the 17 Dec 2023 announcement: Joe Sommerdyke, (517) 327-8042 [B1]. SBAM's cyber page (2026 footer) says there is no cost to receive a quote and no commitment to enroll; SBAM's number is (517) 482-8788. Its form asks "Are you an SBAM Member?" with an unsure option, so whether non-members can use it is unclear. The form also asks whether a secondary means of communication is required to validate funds transfers over $25,000, which is a question Mastiff will have to answer about its own procedure [B2]. It is a cyber program: ask whether tech E&O is available.
2. **Michigan Community Insurance Agency, 49357 Pontiac Trail, Suite 101, Wixom, MI 48393, (248) 679-7000** [B4]. Wixom is in Oakland County (common knowledge). The agency calls itself independent, and its technology page lists technology errors and omissions and data breach cover. No carriers are named in text; the home page shows carrier logos (for example Chubb, Hartford, Cincinnati), so ask which of them write tech E&O. The site sits on an insurancewebsitebuilder.com subdomain and the agency's own domain was not established; use the phone number.
3. **Embroker, through a broker (Embroker Access)** [I3]. Ask whether a direct quote is offered to a firm this size; no direct-quote page was opened. The May 2024 sell sheet shows limits up to $5M, retentions from $5,000, under $300M revenue, "Professional Services" in appetite, "Fintech" for additional review, full prior acts and express breach-of-contract cover.

Ask whichever broker binds to bring quotes from Hiscox (its pages returned 403, so nothing about Hiscox is relied on here), Hartford and Travelers (CyberRisk Tech, given its delay statement). Big I Michigan (michagent.org) has a "Find a Member" directory and lists cyber and E&O market access, for finding a second local agent [B3]. Confirmed but not first calls: Next (direct, professional liability only) [I8]; biBERK (part of the Berkshire Hathaway group; E&O for IT firms; cyber can be added to a general liability, professional liability or BOP policy, and the site also links a standalone cyber page; no price) [I9]; Vouch (a broker offering coverage built for accountants, consultants, creatives and IT pros; its Solutions menu lists no cyber product) [I10]; At-Bay (a May 2021 article on instant tech E&O quotes up to $25M revenue, with "financial software" auto-quoted only under $5M; dated) [I7]; Chubb Marketplace, a multi-line quoting platform for eligible risks under $100M revenue [I5].

### 4.6 Questions for each broker

1. How will Mastiff be classed (technology services, professional services, fintech), and does that change appetite, price or form?
2. Is a free 30-day pilot covered, given definitions that say "for a fee"? What endorsement or nominal fee fixes it?
3. Send the exact funds, theft and misappropriation wording. Does it apply to theft by anyone, or only to the insured's own handling of funds? Every likely claim against Mastiff will arise from a third party taking a client's money (Authentic Title).
4. Are represented-performance, delay and fiduciary-capacity exclusions on the form? Does the dishonesty exclusion have severability and a final-adjudication trigger?
5. Is breach of contract affirmatively covered? Liability assumed under a confidentiality agreement? Liquidated damages?
6. Any AI exclusion or endorsement? Mastiff uses an AI model to read documents and a person confirms every item.
7. Are defence costs inside the limit? Who picks counsel? What are the consent-to-settle terms?
8. Retroactive date, extended reporting period and notice terms. Can cover start before the first pilot?
9. Cyber: what does the application ask about data volume, MFA and backups? Is last-four-only data treated as a lower tier?
10. Is dependent business interruption included for hosting, database, email and AI vendors?
11. Admitted or surplus lines, and the carrier's rating?
12. Cost and process for additional-insured status, waiver of subrogation, certificates and cancellation notice; is a blanket endorsement available?
13. Minimum premium, instalments, mid-term limit increases; the price at $1M and at $2M.
14. Will you review the engagement terms and the confidentiality agreement before binding? Is a liability cap at the policy limit a problem?
15. Mastiff's own application will ask about its own payment-verification procedure. Which questions should I expect?

What to bring: a one-page product description; the data fields (name, bank name, last four, callback number, amounts); a statement that Mastiff has no bank access, custody, release or signing authority; the rule 5 AI statement; projected revenue (zero today; about $12,000 a year at five offices and $199 a month); the draft terms and confidentiality agreement once they exist.

What a client may ask of Mastiff's cover: the carrier documents summarised in R1 ask about the client's own controls, not whether its vendors carry insurance (a gap in what R1 captured, not proof that no carrier asks). Client contracts and lawyers will ask (Morgan Lewis, 4.2). Accounting clients may ask under the FTC Safeguards Rule, which names "an accountant or other tax preparation service that is in the business of completing income tax returns" among financial institutions [P8] and requires them to select capable service providers, require safeguards by contract and reassess them (314.4(f)) [P9]; the small-institution exemption in 314.6 does not list (f) [P10]. The rule requires a contract, not insurance, but expect requests for a security description and possibly a certificate.

## 5. Data custody

### 5.1 The decision (ten lines)

1. **Where.** One Supabase Pro organization with one project in AWS us-east-2 (Ohio), picked by name, because Supabase places "general" regions by capacity [D6, D7]; the app on Vercel Pro with functions pinned to cle1 (Cleveland, the same AWS region) [D18]; email through Resend [D22].
2. **When and cost.** Paid tiers from the first pilot office that hands over a real file, not the first paid client: Vercel Hobby is for non-commercial personal use only and counts advertising a service as commercial [D15], and Supabase Free has no backups and pauses idle projects after a week [D1]. Cost is about $45 a month (Supabase Pro is $25 per organization with a $10 credit covering one Micro instance; Vercel Pro $20), possibly about $65 if Vercel charges both the plan fee and a $20 developer seat; confirm at checkout [D1, D2, D16]. That is about $540 to $780 a year; a second Supabase project would add its own compute, about $10 a month on Micro.
3. **What.** Vendor name, bank name, last four digits, callback number and the date it went on file, amounts and dates, staff names and emails, and the log. Nothing longer than four digits of any account or tax ID is accepted, in the app or in the look-back script (rule 4; four digits is also the statute's line for "redact" [P1]).
4. **Encryption.** AES-256 at rest and TLS in transit as Supabase and Vercel provide [D4, D17]; require SSL on Postgres connections, which is off by default [D10]; mark every authenticated response Cache-Control: private, no-store (Proposal: Vercel caches dynamic responses only when they carry s-maxage and does not cache responses marked private or no-store, so this is a safeguard, not a fix for a known leak [D19]).
5. **Isolation.** Row-level security on every table, keyed to the office, with an automated test that office A cannot read office B; the service-role key stays server-side [D11, D12]; second-factor sign-in for every user [D13]; a change to a callback number needs a second person and is logged.
6. **Access.** Devin and one named second person, each with a named account and an authenticator app. On Supabase Pro the roles are Owner, Administrator and Developer (Developer has read-only organization access but content access to project resources); Read-Only and No-access exist only on Team and Enterprise [D3]. So the second person's limits are a written rule plus a Mastiff access log, not a dashboard setting. No contractors.
7. **No side doors.** No vendor detail in application logs, error reports, analytics or email; notices say "a hold is waiting" and link to the wall, because Resend keeps email content 30 days [D22, D25]. No client file in any consumer AI app: Anthropic's zero-retention arrangement does not cover consumer plans (Free, Pro, Max) [D26].
8. **Retention and exit.** Kept while the office is a client; export at any time as CSV and a printable page with all 13 R1 fields; after the pilot or service ends, 30 days to export, then deletion within 30 more days, Supabase backups clear within 7 days of that [D5], and written confirmation; a legal-hold exception for a dispute or claim.
9. **Providers.** The schedule names Supabase (on AWS), Vercel and Resend, and names any AI service before it touches a client file. Mastiff subscribes to each provider's change notices on day one [D8, D20, D23].
10. **Review triggers.** Move to Supabase Team ($599 a month: SOC 2 report, dashboard single sign-on, 14-day backups, read-only roles) when a client or insurer needs the report or the second person must be read-only [D1, D3, D4]; add point-in-time recovery when paid clients have live holds; redo this decision if full account numbers are ever needed.

### 5.2 The five promises in the confidentiality agreement

Written for the client to read.

1. **We use your information only to run your checks.** We use your files and records only to run your checks, prepare your look-back and read-out, and support your office. We do not sell them, share them with anyone else, or use them for another office or for marketing. We will not combine your vendor information with another office's unless you agree separately in writing.
2. **We keep as little as we can.** We accept only the last four digits of any account or tax ID number. If a file reaches us with more, we delete it and ask you for a copy with those numbers removed. We never ask for bank logins, and we do not touch your bank or your books.
3. **Two people, named providers, United States storage.** Only the two people at Mastiff named in the schedule can see your data. It is stored encrypted, in the United States, with the providers listed in the schedule. Their staff can reach it only as their published terms allow, mainly for support and security, and the schedule says where some of their processing can happen outside the United States. No other service, including any AI tool, receives your files unless the schedule lists it. We tell you of any change to these providers as soon as we learn of it, and you may end the pilot or service if you object.
4. **We tell you fast.** If we confirm that someone who should not have your data has seen it, we tell you within 72 hours of confirming it, say what we know, and help with any notice you decide to give. Whether and whom to notify stays your decision.
5. **You can take it with you, and we delete it.** You can export your vendor list and log at any time. When the pilot or service ends you have 30 days to take a copy; we then delete your records within 30 days and confirm in writing, and backups clear within 7 days after that. We keep only our own agreement and billing records, and anything the law requires us to keep or we need to defend a claim, and only for that purpose.

The agreement should not claim a certification Mastiff does not hold (Supabase's and Vercel's SOC 2 reports are theirs), use "bank-grade" or "unhackable", promise that nothing will go wrong, or imply that Mastiff moves money or decides a payment.

Notes for the lawyer on why the promises read this way:

- **Provider changes (promise 3).** Supabase's DPA gives 30 days' notice only to a customer who subscribes to updates, with a five-day objection window (6.3) [D8]. Vercel's DPA states no minimum notice; the customer must email privacy@vercel.com to subscribe, has five calendar days to object, and the sole remedy is termination for convenience with no refund (7.3) [D20]. Resend's DPA gives 14 days' notice and a 14-day objection window (4.2) [D23]. Mastiff cannot back a 30-day promise from those terms, so promise 3 says "as soon as we learn of it" unless counsel prefers a fixed period.
- **Breach notice (promise 4).** Supabase notifies without undue delay and, where feasible, within 48 hours (DPA 10) [D8]; Resend without undue delay (DPA 8.6) [D23]; Vercel without undue delay, but only for a confirmed incident and only to the extent applicable data-protection law requires (DPA 8.3) [D20]. If no such law is triggered, which is likely for last-four data, Vercel may have no duty to tell Mastiff at all, so the 72 hours run from Mastiff's own confirmation. Michigan: MCL 445.72(2) requires a person that maintains a database of data it does not own to notify the owner after a breach of personal information, subject to a likelihood-of-harm test [P2]; a name plus last four digits is probably not "personal information" under 445.63(r), which needs a full account number plus an access code or password [P1]. SB 360 (2025) passed the Senate on 26 Aug 2025 and was referred to a House committee [P7]; a law-firm summary says it would add attorney-general notice at 100 or more residents, a 45-day deadline and duties for service providers [S19, secondary]. Not law today; re-check before the first agreement.
- **AI (promise 3).** Even under zero retention, Anthropic may keep content flagged by its trust-and-safety systems for up to 2 years, and content it is legally required to keep [D26]. If an AI service is ever added, the schedule must say so.
- **Upstream limits.** Supabase's terms cap its liability at amounts paid and/or payable in the prior 12 months (three times that for excluded liabilities such as breach of confidentiality), exclude damages for loss, interruption, delay or recovery of data (11(A)(4)), and put backup and security of customer data on the customer (7(b)) [D9]. Mastiff carries the data-loss risk itself; the client's protection is its own export.
- **Where data can go.** Supabase may process telemetry, logs, account data, CDN cache and support access outside the chosen region, and its DPA names Supabase Pte. Ltd. (Singapore) as data importer [D7, D8]. Its 12 Oct 2026 sub-processor list has 22 entries, all in the US except Supabase Pte. Ltd. and ConfigCat (Hungary), and includes OpenAI for natural-language processing [D14]. Vercel's DPA allows processing wherever it or its sub-processors operate (13.1) [D20]; its sub-processor page shows Honeycomb, Datadog, Microsoft, Google and AWS only as logos with no description or location, plus AI entries (SpaceXAI, Baseten, Cerebras, Fireworks AI, Groq, Raindrop.ai), and the full list sits in a trust center that could not be read [D21]. Resend's sub-processor page does not name Resend but is very likely its own list: it matches the RunPod and Anthropic disclosures on Resend's security page, and all 22 entries are labelled USA (a location label, not where data sits) [D24, D22]. Resend says it samples a small share of email through a self-hosted model for trust and safety [D22].
- **Accounting clients and the Safeguards Rule.** The rule protects "customer information" about consumers (individuals getting a financial product for personal, family or household purposes) [P8], so an office's business vendor list is probably outside it; the exception to check is an accounting office paying bills for household clients [inference; lawyer]. Financial institutions include accountants and tax preparers and "investment advisory companies"; the FTC's guidance applies an activities test and limits advisers to those not required to register with the SEC [P8, P11]. Where the rule applies: encrypt in transit and at rest, or use compensating controls the Qualified Individual approves (314.4(c)(3)); dispose of customer information no later than two years after last use unless it is needed for business operations or other legitimate purposes, the law requires keeping it, or targeted disposal is not reasonably feasible (314.4(c)(6)); tell the FTC within 30 days of discovering unauthorised acquisition of unencrypted information on 500 or more consumers (314.4(j)) [P9]. The 314.6 exemption does not excuse (f), (c)(3), (c)(6) or (j) [P10].
- **Insurance agencies as clients.** The data security chapter of the Michigan Insurance Code (MCL 500.550 to 500.565) applies to licensed insurers and producers: they must use due diligence in selecting third-party service providers and require appropriate administrative, technical and physical measures (500.555(6)), and give the director notice within 10 business days after determining a cybersecurity event occurred, subject to criteria (500.559(1)) [P5].
- **Why the client keeps the long copy.** The IRS's default record-keeping period is three years, longer in some cases [P13], and insurers ask for the documentation after a loss (R1 requirements-matrix.md, field 12 and the carrier citations there). Mastiff's own contract exposure runs six years (MCL 600.5807(9)) [P6], which argues for a legal-hold exception, not for keeping client records.
- **Tension with the roadmap.** STATUS.md names shared vendor memory across local clients as the long-term moat. Promise 1 rules that out unless each office opts in separately in writing. Keep it out of the first agreement.

## 6. What this changes in the product

### 6.1 The verdict screen

- Show the result as "PASS: nothing flagged" or "HOLD: worth checking", followed by each check and its result: payee on file, bank details unchanged, amount within range, and the two cautions (payment hours, urgency wording). Mark anything that could not be checked as "missing" (for example, no callback number on file). Whether to replace PASS with "Nothing flagged" is Devin's call (7.1).
- Every verdict carries the fixed line "Mastiff flags. Your firm makes every payment decision." (rule 3).
- On a HOLD, show the callback number already on file and the date it went on file, and say the call is made by someone other than the person who received the request. Never accept a number taken from the request as the callback number.
- Never use: approved, verified, cleared, safe, blocked, stopped, caught, protected, guaranteed.
- Ending a hold is recorded, not executed: label the actions "Record release" and "Record not paid", not "Release payment". No button reaches a bank or the books.
- If the office pays despite a HOLD without a logged callback, record it plainly as reported ("Paid without callback, reported by [name]"). Honest overrides serve the client with its bank and insurer (2.7).

### 6.2 The log, so it reads as the client's record

- Every entry shows "reported by [name]" and a system timestamp. Mastiff staff never create or edit entries in a client's log.
- Append-only: a correction is a new entry linked to the original; nothing is overwritten or deleted while the office is a client.
- Record the 13 R1 fields, including the callback number used with its source and on-file date (field 3), a caller different from the receiver (field 5), who answered at the vendor (field 7), a release time later than the call time (field 9) and a second approver different from the initiator and receiver (field 10). Some client policies make this record a condition: Intact's M350 endorsement, for example, requires the verification to be recorded, logged or otherwise documented by the organisation and the documentation furnished on a claim [I12].
- Export at any time, as CSV and as a printable page, under this header (Proposal): "Payment-check log of [Office]. This is [Office]'s record. Entries are what [Office] staff entered in Mastiff; Mastiff did not make, hear or confirm the calls. Exported [date, time] by [name]."
- Vendor data that Devin loads on day one is marked "loaded from your file on [date], confirmed by [client name]", and the client confirms it before the first check (the rule 5 pattern applied to setup).
- A callback-number change needs a second person and is logged.
- Mastiff keeps its own access log of every time its staff read client data outside the app.

### 6.3 The look-back scan and the day-30 read-out

- The look-back script refuses any file with more than four digits in an account or tax ID field and asks for a redacted copy (rule 4). Give prospects a one-page note on which columns to export.
- Run it on the local rules-engine script (CLAUDE.md step 4). STATUS.md says Claude runs the scan by hand on files Devin collects; no client file goes into a consumer AI app (5.1 line 7). If an AI service ever reads client files, it is used through the API under commercial terms and named in the schedule.
- Wording: "would have held", "worth checking", "missing", and "based only on the files you gave us". Never "audit", "assurance", "caught" or "losses prevented".
- The look-back gets its own short letter (3.2 item 16).

### 6.4 The site, the pitch and product.md

- Replace control language with advisory language. Current lines to change: "puts a wall in front of outbound payments", "a payment that cannot be verified does not go out", "the payment holds until the call is logged" (product.md), and "what the wall caught" (the day-30 read-out). Use "flags", "would have held", "worth checking". Whether "the wall" stays the client-facing name is Devin's call.
- The success measure "zero payments released to an account not on file" stays internal.
- Drop "the callback that keeps your claim payable" and any line saying what a client's insurer requires or that the log satisfies it. Suggested line: "Ask your agent what your policy requires. Mastiff keeps a dated record of every callback and sign-off your staff report, and you can export it at any time." R1 reaches the same point: pitch the log as evidence, not as a guarantee of payment.
- No certifications Mastiff does not hold, and no "bank-grade" or "unhackable".
- With CPA-firm prospects, use the management-responsibility vocabulary only after checking the current AICPA Code section, ET 1.295.040 (2.5).

### 6.5 Engineering rules that double as evidence of care

- Unit tests, the 700-row fixture and a dated change log of the rules are evidence of reasonable care if a PASS is challenged [inference].
- Cache-Control: private, no-store on authenticated responses; SSL required on Postgres; the cross-office RLS test runs on every deploy.
- No vendor detail in logs, error reports, analytics or email.

## 7. Open questions

### 7.1 For Devin

1. Move the Michigan LLC, tech E&O and cyber, the lawyer's review and the paid hosting tiers from "before the first paid client" (CLAUDE.md, STATUS.md) to "before the first pilot office hands over a real file"? Cost: about $45 to $65 a month for hosting plus a premium, which published figures put near $2,440 to $2,750 a year before any quote.
2. Keep the pilot free and get written confirmation from the broker that it is covered, or charge a nominal fee? A fixed-dollar liability floor is needed either way.
3. "PASS" or "Nothing flagged" on the verdict screen; and whether "the wall" stays the client-facing name.
4. Look-back intake: refuse files with full numbers and ask for a redacted copy (strict rule 4, as written here), or let Devin truncate them on receipt (faster, but Mastiff then holds full numbers for a time, which rule 4 forbids)?
5. Who is the second named person with data access, and when to pay for Supabase Team (SOC 2 report, read-only roles)?
6. Position 1 in the ROI note (the broker channel and "the callback that keeps your claim payable") needs new wording, or a licensed partner to make any statement about insurance.
7. Shared vendor memory across clients: leave it out of the first agreement and record it in LATER.md (rule 7)? This task wrote only in r5/, so LATER.md was not touched.

### 7.2 For a Michigan lawyer

All of 3.2, and in particular: the cap amount and form, and whether a small limit holds today (Guardian Alarm and USAA are 1982 and 1987); what supports the agreement in a free pilot, and click-through validity; MCL 500.1232 and statements about insurance; Michigan money transmission law; Mastiff's status as a "service provider" under 16 CFR 314; the MCL 445.72(2) duty and whether last-four data is ever personal information; deletion against the six-year contract period; subpoena handling and "control" under MCR 2.310; a shortened claim window; Michigan's Article 4A sections, Rule of Evidence 803(6) and the courts' own text of 902(11), none of which were opened; whether anything may be signed before the LLC exists.

### 7.3 For a broker

How Mastiff is classed; whether a free pilot is covered; the exact funds, theft and misappropriation wording; represented-performance, delay and AI exclusions; affirmative contract cover; retroactive date and extended reporting; dependent business interruption; the premium at $1M and $2M; whether SBAM's program takes non-members and writes tech E&O; Hiscox, Hartford and Travelers quotes for a two-person firm.

## 8. Sources

Primary sources first. All read 2026-10-27, by the working-note authors, the source checkers or this synthesis. Where a page needed a browser or text extraction, that is noted.

**Michigan and federal law, regulators**
- [P1] MCL 445.63, Identity Theft Protection Act definitions: https://www.legislature.mi.gov/Laws/MCL?objectName=mcl-445-63
- [P2] MCL 445.72, breach notice, including (2) for a maintainer of data it does not own: https://www.legislature.mi.gov/Laws/MCL?objectName=mcl-445-72
- [P3] MCL 500.1232, insurance counselor licence: https://www.legislature.mi.gov/Laws/MCL?objectName=mcl-500-1232
- [P4] MCL 339.732, accountant confidentiality: https://www.legislature.mi.gov/Laws/MCL?objectName=mcl-339-732
- [P5] MCL 500.550 and following, data security chapter of the Insurance Code (also -553, -555, -559): https://www.legislature.mi.gov/Laws/MCL?objectName=mcl-500-550
- [P6] MCL 600.5807, contract limitation period: https://www.legislature.mi.gov/Laws/MCL?objectName=mcl-600-5807
- [P7] SB 360 (2025) status page: https://www.legislature.mi.gov/Bills/Bill?ObjectName=2025-SB-0360
- [P8] 16 CFR 314.2, definitions (Cornell LII copy; eCFR redirected to a block page): https://www.law.cornell.edu/cfr/text/16/314.2
- [P9] 16 CFR 314.4, safeguards and service providers: https://www.law.cornell.edu/cfr/text/16/314.4
- [P10] 16 CFR 314.6, small-institution exceptions: https://www.law.cornell.edu/cfr/text/16/314.6
- [P11] FTC guidance on the Safeguards Rule: https://www.ftc.gov/business-guidance/resources/ftc-safeguards-rule-what-your-business-needs-know
- [P12] Michigan courts civil benchbook, requests for documents (MCR 2.310, 2.305): https://www.courts.michigan.gov/490820/siteassets/publications/benchbooks/civil/civilresponsivehtml5.zip/Civil/Ch_5_Discovery/Request_for_Documents.htm
- [P13] IRS, how long to keep records: https://www.irs.gov/businesses/small-businesses-self-employed/how-long-should-i-keep-records
- [P14] California DFI opinion letter on a software company, 16 May 2013: https://dfpi.ca.gov/wp-content/uploads/sites/337/2019/03/Opinion-Software_Company_Letter.pdf
- [P15] SEC filing, CIK 1088034, FY2015 legal-proceedings note: https://www.sec.gov/Archives/edgar/data/1088034/000117184316008902/R20.htm

**Court opinions** (CourtListener pages do not render in WebFetch; the static.case.law text is the readable copy)
- [C1] Fejedelem v. Kasco, 269 Mich App 499 (2006): https://static.case.law/mich-app/269/cases/0499-01.json ; https://www.courtlistener.com/opinion/1958877/fejedelem-v-kasco/ (shows the 31 Mar 2006 publication date)
- [C2] Fultz v. Union-Commerce Associates, 470 Mich 460 (2004): https://static.case.law/mich/470/cases/0460-01.json ; https://www.courtlistener.com/opinion/848711/fultz-v-union-commerce-associates/
- [C3] Smith v. Allendale Mutual Insurance, 410 Mich 685 (1981): https://static.case.law/mich/410/cases/0685-01.json ; https://www.courtlistener.com/opinion/1923645/smith-v-allendale-mutual-insurance/
- [C4] Loweke v. Ann Arbor Ceiling & Partition, 489 Mich 157 (2011): https://static.case.law/mich/489/cases/0157-01.json
- [C5] St. Paul Fire & Marine v. Guardian Alarm, 115 Mich App 278 (1982): https://static.case.law/mich-app/115/cases/0278-01.json ; https://www.courtlistener.com/opinion/1753038/st-paul-fire-marine-ins-co-v-guardian-alarm-co-of-mich/
- [C6] USAA Group v. Universal Alarms, 158 Mich App 633 (1987): https://static.case.law/mich-app/158/cases/0633-01.json ; https://www.courtlistener.com/opinion/1691928/usaa-group-v-universal-alarms-inc/ (ID not confirmed)
- [C7] Xu v. Gay, 257 Mich App 263 (2003): https://static.case.law/mich-app/257/cases/0263-01.json ; https://caselaw.findlaw.com/court/mi-court-of-appeals/1357363.html (FindLaw heading names Haini Hou; the appellant is Junyi Xu as personal representative)
- [C8] Lamp v. Reynolds, 249 Mich App 591 (2002): https://static.case.law/mich-app/249/cases/0591-01.json
- [C9] Brenner v. Kolk, 226 Mich App 149 (1997): https://static.case.law/mich-app/226/cases/0149-01.json ; https://www.courtlistener.com/opinion/1251355/brenner-v-kolk/ (shows 22 Jan 1998)
- [C10] Teel v. Meredith, 284 Mich App 660 (2009): https://static.case.law/mich-app/284/cases/0660-01.json ; https://www.courtlistener.com/opinion/1667205/teel-v-meredith/
- [C11] Big Rock Corp. v. Warren Systems, No. 23-002433-CB (Saginaw Cir. Ct., 16 Apr 2024), PDF text extracted: https://www.courts.michigan.gov/49807a/siteassets/business-court-opinions/c10-2023-002433-cb(april16,2024).pdf
- [C12] Authentic Title Services v. Greenwich Insurance, No. 18-4131 (D.N.J. 17 Nov 2020), PDF text extracted in this synthesis: https://www.govinfo.gov/content/pkg/USCOURTS-njd-2_18-cv-04131/pdf/USCOURTS-njd-2_18-cv-04131-0.pdf

**Vendor terms and professional templates**
- [V1] BILL General Terms of Service: https://www.bill.com/legal/platform-general-terms-of-service
- [V2] BILL Spend and Expense terms (used only for the filler-text and 2026 date note): https://www.bill.com/legal/spend-expense-terms-of-service
- [V3] Ramp Platform Agreement (needs a browser; WebFetch returns only the title): https://ramp.com/legal/customer-terms/platform-agreement/platform-agreement
- [V4] Melio Solutions Terms (Michigan version): https://melio.com/terms-of-service/melio-solutions/ ; index page sending users to a version by state: https://melio.com/terms-of-service/
- [V5] Eftsure service terms, contracts from 20 Nov 2023: https://www.eftsure.com/en-nz/terms-of-service/after-20-november-2023/
- [V6] nsKnox Services Agreement (PDF text extracted): https://nsknox.net/docs/nsKnox-Inc-Services-Agreement-Feb-2021.pdf ; website terms [summary]: https://nsknox.net/terms-of-use/
- [V7] Trustpair guarantee page and home page (browser pane): https://trustpair.com/guarantee/ ; https://trustpair.com/
- [V8] CPA.com sample engagement letter (PDF text extracted): https://www.cpa.com/sites/cpa/files/2021-08/Sample-Engagement-Letter-and-SLA-for-Client-Accounting-Services.pdf

**Hosting, database, email and AI providers**
- [D1] Supabase pricing and plan table: https://supabase.com/pricing
- [D2] Supabase compute prices: https://supabase.com/docs/guides/platform/compute-and-disk
- [D3] Supabase access control (roles by plan): https://supabase.com/docs/guides/platform/access-control
- [D4] Supabase security (SOC 2, ISO, report access): https://supabase.com/security
- [D5] Supabase backups: https://supabase.com/docs/guides/platform/backups
- [D6] Supabase regions: https://supabase.com/docs/guides/platform/regions
- [D7] Supabase data residency and transfers FAQ: https://supabase.com/legal/privacy-resources/data-residency-and-transfers-faq
- [D8] Supabase DPA: https://supabase.com/legal/dpa
- [D9] Supabase terms of service: https://supabase.com/terms
- [D10] Supabase platform security (SSL, MFA enforcement): https://supabase.com/docs/guides/security/platform-security
- [D11] Supabase row-level security: https://supabase.com/docs/guides/database/postgres/row-level-security
- [D12] Supabase shared responsibility model: https://supabase.com/docs/guides/deployment/shared-responsibility-model
- [D13] Supabase Auth MFA: https://supabase.com/docs/guides/auth/auth-mfa
- [D14] Supabase sub-processor list, 12 Oct 2026 (PDF text extracted): https://supabase.com/legal/subprocessor-list/October-12-2026.pdf ; landing page: https://supabase.com/legal/customer-resources/subprocessor-list
- [D15] Vercel fair use guidelines (Hobby non-commercial): https://vercel.com/docs/limits/fair-use-guidelines
- [D16] Vercel pricing: https://vercel.com/pricing
- [D17] Vercel security and compliance: https://vercel.com/docs/security/compliance
- [D18] Vercel regions: https://vercel.com/docs/regions
- [D19] Vercel CDN cache: https://vercel.com/docs/caching/cdn-cache
- [D20] Vercel DPA: https://vercel.com/legal/dpa
- [D21] Vercel sub-processor page (partial): https://security.vercel.com/?itemName=legal&itemUid=e3fae2ca-94a9-416b-b577-5c90e382df57
- [D22] Resend security: https://resend.com/security
- [D23] Resend DPA: https://resend.com/legal/dpa
- [D24] Resend sub-processors: https://resend.com/legal/subprocessors
- [D25] Resend pricing: https://resend.com/pricing
- [D26] Anthropic API data retention: https://platform.claude.com/docs/en/manage-claude/api-and-data-retention

**Carrier documents and pages**
- [I1] Beazley F00806 policy terms and conditions specimen: https://prod.dxp.beazley.com/globalassets/product-documents/application/f00806_042021_ed.-policy_terms_and_conditions_cm.pdf
- [I2] Beazley F00807 technology services specimen: https://www.beazley.com:443/globalassets/product-documents/application/f00807_012021_ed.-technology_services_technology_products_liability_and_media_liability.pdf
- [I3] Embroker Access tech E&O and cyber sell sheet, May 2024: https://access.embroker.com/wp-content/uploads/2024/06/Access_Tech-EO_Cyber_Sell-Sheet_May-2024.pdf
- [I4] Hartford CyberChoice Professional flyer: https://hig-res.cloudinary.com/image/upload/cyber_choice_professional.pdf
- [I5] Chubb cyber products page: https://www.chubb.com/us-en/business-insurance/cyber-products.html
- [I6] Coalition tech E&O and cyber pages: https://www.coalitioninc.com/technology-errors-and-omissions-insurance ; https://www.coalitioninc.com/cyber-insurance
- [I7] At-Bay, tech E&O quoting article (May 2021): https://www.at-bay.com/articles/quoting-tech-eo-just-got-easier/
- [I8] Next, professional liability cost page: https://nextinsurance.com/professional-liability-insurance/cost
- [I9] biBERK, IT business insurance: https://www.biberk.com/who-we-insure/information-technology-insurance
- [I10] Vouch home page: https://www.vouch.us
- [I11] Travelers, technology E&O risks: https://www.travelers.com/resources/business-industries/technology/technology-errors-and-omissions-insurance-risks
- [I12] Intact M350 call-back endorsement (cited in R1): https://portal.intactinsurance.com/system/files/mydocuments/M350%20%2803-20%29%20v1%20Social%20Engineering%20Endorsement%20-%20Call%20Back%20Provision.pdf

**Michigan brokers and channels**
- [B1] SBAM announcement of the MAIA cyber program, 17 Dec 2023: https://www.sbam.org/sbam-announces-new-cyber-liability-insurance-program-through-maia-insurance-services/
- [B2] SBAM cyber coverage page and inquiry form: https://www.sbam.org/?p=23659
- [B3] Big I Michigan: https://michagent.org
- [B4] Michigan Community Insurance Agency, technology insurance page (third-party hosted site): https://582b1c26-f967-4a3c-a7a9-bc30cf99ded8.insurancewebsitebuilder.com/tech_insurance/default.aspx

**Secondary sources**
- [S1] Watt Tieder, Michigan construction-law survey (last updated 1 Jan 2021): https://50-state.watttieder.com/states/michigan/
- [S2] Plunkett Cooney on the accountant confidentiality statute (8 Apr 2026): https://www.plunkettcooney.com/tax-law-estate-plans-probate-business-succession/accountant-confidentiality-statute
- [S3] Michigan Rule of Evidence 902 (third-party rules site): https://www.courtrules.net/michigan/michigan-rules-of-evidence/rule-902
- [S4] Proskauer on bank security for business accounts (28 Jan 2015): https://privacylaw.proskauer.com/2015/01/articles/cybersecurity/courts-address-the-level-of-security-banks-must-provide-to-business-accounts/
- [S5] Justia summary of Loweke (7 Jun 2011, background only): https://constructionlawopinions.justia.com/2011/06/07/loweke-v-ann-arbor-ceiling-partition-co-llc
- [S6] Michigan Bar Journal, Hilger on the economic loss doctrine (Oct 2022, background only): https://www.michbar.org/journal/Details/ArticleID=4510
- [S7] State Bar e-Journal summary, Johnson v. Aquatic Solutions (7 May 2026): https://www.michbar.org/opinions/content_search_detail/EJournalNumber/85707
- [S8] Journal of Accountancy, 2013 (archived): https://www.journalofaccountancy.com/issues/2013/nov/20138593/ ; 2016 (archived): https://www.journalofaccountancy.com/issues/2016/nov/maintaining-independence-with-nonattest-services/ ; 2020: https://www.journalofaccountancy.com/issues/2020/feb/cpa-firm-risks-related-to-consulting-engagements/
- [S9] Wiley summary of SS&C v. AIG, 2019 ruling (link redirects to executivesummaryblog.com): https://www.executivesummaryblog.com/fraud-exclusion-inapplicable-where-insured-unwittingly-transferred-funds-to-fraudsters
- [S10] Lowenstein Sandler client alert on SS&C v. AIG, 13 Feb 2020 (PDF text extracted in this synthesis): https://www.lowenstein.com/media/5512/20200213-insurance-recovery-fintech-company-secures-indemnity-coverage-under-professional-liability-policy-for-fraudulent-funds-transfer-claim.pdf
- [S11] IRMI on dishonesty exclusions in tech policies (2006): https://www.irmi.com/articles/expert-commentary/variations-in-frauddishonesty-exclusions-in-techmediaebusiness-policies
- [S12] Fenwick on AI exclusions (15 Jun 2026): https://fenwick.com/insights/publications/end-silent-ai-emerging-ai-exclusions-coverage-fragmentation-and-practical-implications
- [S13] Insurance Business, Berkley tech underwriter on contracts (24 Dec 2025): https://www.insurancebusinessmag.com/us/news/professional-liability/why-tech-underwriters-still-care-more-about-contracts-than-cloud-risks-560652.aspx
- [S14] Morgan Lewis on cyber insurance in tech transactions (15 Sep 2025): https://www.morganlewis.com/blogs/sourcingatmorganlewis/2025/09/cyberinsurance-requirements-in-tech-transactions-balancing-risk-and-market-practice
- [S15] Fordham Journal of Corporate and Financial Law blog (28 Apr 2017): https://fordhamcorporatejournal.org/?p=1053
- [S16] Insurance Journal, tech E&O panel (26 Mar 2007): https://insurancejournal.com/magazines/mag-coverstory/2007/03/26/78409.htm
- [S17] Insureon, IT consultant insurance cost (updated 12 Jun 2026): https://www.insureon.com/technology-business-insurance/it-consultants/cost
- [S18] QuoteSweep, IT consultant insurance cost (reports TechInsurance figures): https://www.quotesweep.com/blog/it-consultant-insurance-cost
- [S19] Fisher Phillips on Michigan SB 359/360 (9 Sep 2025): https://www.fisherphillips.com/en/news-insights/what-businesses-need-to-know-about-pending-consumer-privacy-and-identity-theft-legislation.html

**Local files read**
- `stages/01-define/output/r5/legal-exposure.md`, `insurance.md`, `data-custody.md` (working notes, unchanged)
- `stages/01-define/output/r1/requirements-matrix.md` (carrier wording, the 13 log fields)
- `stages/01-define/output/r4/primary-statistics.md` (CFC $93,425; FinCEN $125,439)
- `stages/01-define/output/roi-and-research-2026-10-24.md` (the R5 brief and position 1)
- `_config/product.md`, `STATUS.md`, `CLAUDE.md`

**Read and not relied on, or dropped:** the Ramp tracker at conductatlas.com (third-party; failed in WebFetch); Warner Norcross on the duty to preserve (no claim used it); Hiscox price figures ($23 a month, $1,000 to $8,000 a year) and the claims about its contract cover and non-admitted placement (no source opened); the Vouch pricing article, its partner-site eligibility line and the $300 figure (no URL); MoneyGeek modelled estimates and the TechInsurance Michigan average (not tech-specific); the Melio Payments-version terms (not the Michigan version).
