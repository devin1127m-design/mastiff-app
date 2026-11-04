# R5 (insurance angle): Mastiff's own coverage

Stage 01 output, researched 2026-10-27. Internal working paper, not client-facing. Policy and case terms are quoted as the documents use them. This is research, not legal or insurance advice: a Michigan lawyer must review the engagement terms and the confidentiality agreement, and a licensed broker must confirm every coverage point against the actual policy.

Tags: **[opened]** means I opened the page or document in this session. **[snippet]** means it appeared only in a search-result summary and I did not open it, so treat it as unverified. Items from the r1 and r4 files are reused as written there and were not re-opened.

## 1. Short answer

- **Buy two things, on one form if a carrier offers it:** tech errors and omissions (E&O) liability, and cyber liability (first-party breach response plus third-party privacy liability). Published sell sheets and broker pages treat these as one bundled product for tech firms (Embroker, Hartford, Chubb DigiTech, Coalition).
- **Bind before the first pilot office loads data, not "before the first paid client."** This departs from STATUS.md. Reason: a free pilot is still a service where Mastiff gives PASS/HOLD answers and holds payment data. The Beazley specimen defines tech services as work performed "for others for a fee," and Coalition describes the exposure as arising from a service "in exchange for a fee." Whether a free pilot is covered is a question for the broker, and the safe fix may be a nominal fee or a written endorsement. Policies are claims-made, so cover must be in force when a claim arrives, and the retroactive date must reach back to the first pilot.
- **Planning figure only:** published medians for IT consultants at $1M/$1M limits run about $785 to $899 a year for tech E&O and $1,540 to $1,964 for cyber, so roughly $2,300 to $2,750 a year for both if bought separately. (Next's $90 a month average, about $1,080 a year, is professional liability only.) No carrier publishes a price for a payment-verification service. The real number comes from a quote.
- **Limits to ask for:** $1M per claim and $1M aggregate on both parts, retention of $5,000 or less, with a $2M quote requested so you can price the step up. Defense costs often sit inside the limit, so $1M buys less than $1M of damages.
- **"Advisory only, never moves money" is a real fact worth documenting, but I found no source saying it lowers the premium or the risk class.** It matters most for the funds-related exclusions and for staying outside money-transmission rules. The same fact cuts the other way: the whole product is an opinion about a payment, so one wrong PASS can be a claim for the full payment amount.
- **No client insurer in r1 asks a vendor to carry insurance.** The pressure will come from client contracts and lawyers (certificate of insurance, additional insured, limits), and from CPA clients under the FTC Safeguards Rule, which requires a contract, not insurance.
- **A confidentiality agreement does not shift risk away from Mastiff.** Mastiff is the one making the promise. It adds contract-only obligations that E&O and cyber forms often exclude. It helps the client, and it helps Mastiff only to the extent it is kept lean (section 7).
- **Three calls:** MAIA Insurance Services (through SBAM), Michigan Community Insurance Agency in Wixom, and Embroker (online quote and broker channel). Questions are in section 8.

## 2. Where the exposure sits

| Scenario | What the claim looks like | Coverage that should respond |
|---|---|---|
| A. Wrong or missed answer | A client pays a changed-bank or out-of-range payment after a PASS, or after Mastiff missed a flag, and sues for the payment | Tech E&O (third-party). Subject to the exclusions in section 4 |
| B. Data exposed | Mastiff's database is accessed. It holds vendor names, bank names, last four digits, callback numbers, amounts and due dates. The risk is less identity theft than a thief learning which vendors are owed money and which number the client trusts | Cyber (breach response, privacy liability). Data may fall outside Michigan's breach statute (see 2a) but not outside client contracts |
| C. Outage or lost log | The log is unavailable when a client's insurer asks for it. r1 shows Chubb MS-371960.2 requires the check to be "contemporaneously documented... in writing" and Intact M350 requires the client to "furnish an electronic recording or other documentation." A client whose claim fails for lack of the record may look to Mastiff | Tech E&O (contract and negligence); cyber business interruption; ask about dependent business interruption for Supabase, Vercel, Resend |
| D. A hold causes delay | A hold or slow callback makes a payment late: a late fee, a supplier stops work, a pay-application deadline is missed | Tech E&O, but Travelers says "many tech E&O forms have a delay exclusion" [opened]. Ask |
| E. Marketing or report wording | A look-back report or website line is read as a promise that Mastiff catches things | Tech E&O, but see the "represented performance" exclusion in section 4 |
| F. Mastiff's own money | Someone impersonates a vendor or client to Mastiff | Cyber crime sublimit (Embroker lists $500,000 social-engineering and fund-transfer sublimit). Low priority; Mastiff's own applications will ask about Mastiff's own callback procedure |

**2a. Michigan breach statute.** MCL 445.63(r) defines personal information as a resident's name plus a Social Security number, driver license number, or a "demand deposit or other financial account number, or credit card or debit card number" in combination with a "required security code, access code, or password" that would permit access to the account [opened]. A last-four number plus a callback number appears to fall outside that definition, and rule 4 (never store more than the last four) is what keeps it there. A Michigan lawyer must confirm this, including for vendors who are sole proprietors. Underwriters also price cyber on the volume and kind of data held (Insureon: cost "primarily depends on the amount of personal information handled") [opened], so rule 4 belongs in every application. The look-back scan is the weak point: client files may arrive with full account numbers. Ask clients to redact before sending.

## 3. Carriers and brokers, and what they publish

No carrier publishes a premium for a firm like Mastiff. Only Next publishes an average, and for professional liability only.

| Carrier or channel | What I confirmed | Limits and price published | Unknown |
|---|---|---|---|
| **Embroker** (online and "Access" broker product) [opened: sell sheet May 2024; embroker.com] | Tech E&O and cyber in one non-admitted policy form on Everspan Indemnity (AM Best A-). Duty to defend with panel counsel. "Full Prior Acts," "Express Breach of Contract," "Liability of Other Assumed Contractually (indemnity)." Eligibility: private for-profit, under $300M revenue. "Professional Services" is in appetite. "Fintech" and "Insurance Services / Insurtech" need additional underwriting review. "Financial Institutions" is out of appetite | Limits up to $5,000,000, retentions start at $5,000. Social engineering and fund transfer fraud sublimit $500,000, including client money "in the trust or control of the insured." No prices | Where Mastiff lands: professional services or fintech. Sell sheet is two years old |
| **Hartford** [opened: CyberChoice Professional flyer, Oct 2025] | One policy for technology liability, media, first- and third-party cyber, professional services. "Broad form contractual liability coverage." "Cyber deception loss" included. Small business quote and bind runs through the agent portal (ICON) | Primary capacity to $1B revenue (flyer is aimed at larger accounts). No prices | Small-business form and exclusions. Hartford web pages timed out |
| **Chubb** [opened: cyber products page; Coverager article, undated] | Pro ERM: professional, media and cyber in one policy for more than 150 types of professional service firms. DigiTech ERM: tech E&O for "financial injury to third parties arising from insured's products and services." Online platform for risks under $100M revenue. Sold through agents and brokers | No limits or prices found | Small-business limits. Chubb small-business page returned 404 |
| **Coalition** [opened: tech E&O page; cyber page] | Offers tech E&O, combinable with its cyber policy. Funds transfer coverage with claw-back support | No limits, prices or small-business eligibility on the pages | Whether it will write a firm this small. Specimen policy is broker-only |
| **At-Bay** [opened: May 2021 article] | Instant tech E&O quotes for tech firms up to $25M revenue. "Financial software" is an auto-quote class only under $5M revenue | None | Article is five years old. Current appetite unknown |
| **Next Insurance** [opened: cost page, data updated Aug 2025] | Professional liability by occupation; direct online | IT consultants $90 a month; software developers $90; accountants $40; median across all customers $25. Limits and deductible not stated. 73% of customers pay $45 or less | No cyber page found (404). Whether it covers a payment-verification service |
| **biBERK** [opened: IT insurance page] | Part of Berkshire Hathaway group. E&O for IT firms; cyber sold only as an add-on to general liability, professional liability or a BOP. Sold direct | No price on the page; "savings of up to 20%" is marketing | Carrier paper, limits, price |
| **Vouch** [opened: home page; Nov 2024 pricing article] | Broker for startups; "built for accountants, consultants, creatives, and IT pros." Home page does not list cyber | Pricing article publishes no premiums | Eligibility for a non-venture-backed two-person firm. A partner site says US-incorporated startups [snippet] |
| **Hiscox** | Could not open: the cost and technology pages returned 403 | [snippet] only: "as low as $23 per month" for professional liability; a third-party range of $1,000 to $8,000 a year | Everything. Hiscox is still worth a quote through a broker |
| **Beazley** [opened: specimen forms F00806 and F00807] | The specimens are the best exclusion wording I could read (section 4) | None | I did not confirm whether Beazley writes a firm this size or how; use the forms as an example of wording to look for |

**Aggregator medians (not quotes).** Insureon, for IT consultants at $1M/$1M and a $2,500 deductible: tech E&O $75 a month ($899 a year), cyber $128 a month ($1,540 a year), "median cost of policies... who apply for quotes," updated June 12, 2026 [opened]. A QuoteSweep page [opened] reports TechInsurance at $65 a month ($785 a year) for tech E&O and $164 a month ($1,964 a year) for cyber, and MoneyGeek modeled estimates of $74 and $157 a month. The same page notes TechInsurance and Insureon are both divisions of Specialty Program Group, so they are not independent. TechInsurance reports a Michigan E&O average of $83 a month, from customers who mostly have under five employees and $50,000 to $200,000-plus revenue [opened]. Embroker's own retention floor ($5,000) is above the $2,500 deductible the medians assume, so budget for a higher retention.

**Michigan channels I could confirm.**
- **MAIA Insurance Services, through SBAM.** SBAM (Small Business Association of Michigan, Lansing) and the Michigan Association of Insurance Agents launched a cyber program in 2023; MAIA "offers SBAM members access to 10 leading cyber insurance providers." Contact named on the December 17, 2023 announcement: Joe Sommerdyke, (517) 327-8042, jsommerdyke@michagent.org. SBAM's cyber page is live with a 2026 footer: "no cost to receive a quote and no commitment," SBAM phone (517) 482-8788. The inquiry form asks about "payment verification procedures." It is not clear whether non-members can use it. It is a cyber program; ask whether tech E&O is available [opened: three SBAM pages].
- **Big I Michigan** (michagent.org), the independent-agent trade association, 1141 Centennial Way, Lansing, (517) 323-9473. Lists a "Find a Member" directory and Cyber and E&O market access [opened].
- **Michigan Community Insurance Agency Inc.**, 49357 Pontiac Trail, Suite 101, Wixom, MI 48393, (248) 679-7000. Describes itself as independent and lists "Technology Errors and Omissions Insurance" and data breach cover. No carriers named [opened]. Wixom is in Oakland County.
- Not confirmed and not relied on: Sohi Insurance Agency (Auburn Hills), Brownrigg Companies (Troy, from a 2016 ranking; its site redirected to a third-party tracking link, which I did not follow), Burns & Wilcox Michigan team (the page I opened named a different person).

## 4. Exclusions that matter for Mastiff

Carrier forms for Embroker, Hartford, Chubb, Coalition and Hiscox are not public. The only full wording I could read is the Beazley modular specimen (F00806 04/2021 terms and F00807 01/2021 tech services section) [opened]. Treat it as an example of what to look for, not as what any retail carrier will issue.

1. **Contract exclusion, with carve-backs.** F00807 excludes liability "arising out of, based upon or attributable to any contractual liability or obligation, including any breach of contract or agreement, either oral or written," but not "the obligation to perform tech services," and not "to the extent the insured would have been liable in the absence of such contract or agreement." Its definition of damages also drops liquidated damages beyond what the insured would owe without the agreement. Embroker and Hartford advertise broader contract cover. A 2007 Insurance Journal panel put the line this way: errors in performance are covered; errors in "sales terms, staffing, and commitments" are not [opened].
2. **"Represented performance."** F00806 excludes loss "attributable to... the failure of any goods, products or services to conform with any represented quality or performance." A claim framed as "Mastiff said it would catch this and did not" aims straight at this wording. I found no exclusion literally named "failure to detect." This is the nearest thing. Mitigation is in the product copy (rule 3 wording, "Mastiff flags. Your firm makes every payment decision") and in not promising results. Ask each broker whether this exclusion is on their form and whether it is carved back for tech services.
3. **Funds.** F00806 excludes "commingling, mishandling of or liability to pay, collect or safeguard funds." Courts read this kind of wording broadly. In *Authentic Title Services v. Greenwich* (D.N.J., Nov. 17, 2020), an exclusion for "theft, stealing, conversion, embezzlement or misappropriation of funds or accounts" defeated an E&O claim for a wire sent to impersonators, because it did not matter who stole the funds [opened: Wiley summary, not the opinion]. Mastiff never holds or moves money, so this should not apply, but a pleading that says Mastiff failed to "safeguard" the client's money is the way an insurer would try. Keep the product literally true to "never moves money" and never give Mastiff release authority.
4. **Fiduciary capacity.** Neither Beazley form has a general "acting as a fiduciary" exclusion. F00806 excludes only activities "as a trustee, partner, officer, director or employee of any business enterprise other than that of the insured organization." Other forms may differ. Ask. The practical protection is the same as above: the second sign-off belongs to a person at the client, never to Mastiff.
5. **Fraud and dishonesty.** F00806 applies it to acts "committed by an insured or by others if the insured colluded or participated," with defense costs paid until a "final non-appealable adjudication." That wording does not reach third-party impersonation. *SS&C v. AIG* (S.D.N.Y., Nov. 5, 2019) held a similar exclusion did not bar cover when a software provider wired $5.9 million of a client's money on spoofed emails, because it targets the insured's own conduct [opened: Wiley summary; motion to dismiss stage]. IRMI (2006) warns that some forms drop severability and trigger on an admission, which makes the exclusion easier to invoke [opened]. Ask for severability and a final-adjudication trigger.
6. **Cyber carve.** F00806 excludes failure to safeguard information and data, and lifts the exclusion only for claims under a purchased professional liability, breach response, infosec, first-party cyber or technology services section. A policy with only a general professional section could leave a data claim uncovered. Buy the tech and cyber parts together and confirm the carve-back is on the form offered.
7. **Professional services listing.** F00807: "professional services means services listed in the Declarations." Make sure the application describes what Mastiff does (payment-request checks, holds, callback log) so the service is the thing insured. A misdescription is how a gap appears.
8. **Free pilot.** "tech services... performed by the insured... for others for a fee" (F00807). See section 1.
9. **AI.** Fenwick (June 15, 2026) reports some carriers decline liabilities tied to AI-generated outputs or add exclusions for AI-related errors or decision-making at 2026 renewals, and that some offer narrow affirmative AI endorsements [opened]. Mastiff's design (rule 5: the AI reads, a person confirms before anything is saved) answers this and should be stated in the application in those words.
10. **Claims-made terms.** F00806 is "claims made and reported" and defense costs "will reduce and may exhaust the limit." F00807 requires notice within 30 days after the policy period and notice of circumstances during it. Ask for the retroactive date, extended reporting option and notice terms in writing.

## 5. Does "advisory only, never moves money" lower the risk class?

What I found:
- Handling funds is a known claim driver and a known exclusion. Embroker's sublimit expressly covers client money "in the trust or control of the insured." Beazley and the *Authentic Title* decision show funds language applied broadly. *SS&C* involved a software provider that actually sent the client's money.
- Not holding money also keeps a software company outside money-transmission law in at least one state: California's regulator concluded in a 2013 letter that a software company that "never holds the money" and uses a bank to move it was not engaged in money transmission [opened]. That is California law and one fact pattern. Michigan's money transmission statute was not researched; a Michigan lawyer must confirm Mastiff is outside it.
- Underwriters look closely at contract terms for tech firms. Berkley Technology Underwriters' vice president for technology E&O (Insurance Business, Dec. 24, 2025) calls breach of contract the most significant exposure and names red flags: a liability cap equal to the insured's policy limit, missing consequential-damages disclaimers, warranties that "promise the moon and the stars," and one-sided indemnities. She says contract review is rare for small accounts [opened].

What I did not find: any carrier, broker or rate source saying a no-custody service gets a lower rate or a better class. Embroker flags Fintech for extra review, which could cut against Mastiff depending on how it is classed. Treat the benefit as unproven until a broker quotes. To get whatever credit exists, give underwriters these documented facts: no bank credentials, no custody, no release authority, last four digits only, a person confirms every AI-read item, and a log that can be exported.

## 6. What a client's insurer might require of Mastiff

- **Found nothing in r1.** The carrier documents summarized in the r1 matrix ask about the client's own callback, dual control and records. None, as summarized, asks whether the client's vendors carry insurance. This is a gap in what r1 captured, not proof that no carrier asks.
- **Contracts do.** Morgan Lewis (Sept. 15, 2025) says customers commonly ask technology vendors for cyber cover of about $2 to $5 million for small and medium vendors, additional-insured status, a certificate and policy review, and cover that continues for a period after the contract ends [opened]. That is general market practice, not a rule for payment-control vendors. A $1M start may draw a request for more; price the $2M option in advance.
- **CPA and bookkeeping clients.** 16 CFR 314.2(h)(2)(viii) names "an accountant or other tax preparation service that is in the business of completing income tax returns" as a financial institution. 16 CFR 314.4(f) requires it to take "reasonable steps to select and retain service providers," to require them "by contract to implement and maintain such safeguards," and to assess them periodically. The sub-5,000-consumer exemption in 314.6 does not list (f) [opened]. The rule covers "customer information" about consumers. Mastiff's data is mostly about the client's payees, so the rule may not apply; whether it does is a question for a Michigan lawyer. Either way, expect a CPA to ask for a security description and contract language, and possibly a certificate.
- **Subrogation (inference).** When a client's insurer pays a loss it may look to others at fault. Ask brokers what waiver of subrogation, additional-insured and notice-of-cancellation requests cost to add, and whether a blanket endorsement is available.
- **Log as evidence (from r1).** Section 2, scenario C. Contract language should give clients an export of their own log on request and on exit.

## 7. Does a confidentiality agreement shift exposure?

Not away from Mastiff. Devin is offering the agreement, so Mastiff is the party bound.

- **It adds a contract duty.** Contract exclusions in E&O and cyber forms often remove cover for what is owed only because of the agreement. The Beazley carve-back keeps liability that would exist without the contract, which means ordinary negligence in guarding data stays in and extra promises (indemnity, liquidated damages, strict notice deadlines, uncapped liability) tend to fall out. A Fordham journal piece (2017, about D&O forms) warns that broad contractual-liability wording "has the potential to preclude coverage for a wide range of claims" and that security promises in vendor contracts become misrepresentation claims when a breach occurs [opened]. I did not find a source on NDA breaches specifically.
- **It does not cap anything.** Only a limitation-of-liability clause in the engagement terms does that. Michigan authority I could read is a fitness-center waiver case, *Xu v. Gay* (Mich. Ct. App., June 24, 2003), citing *Lamp v. Reynolds*: a contractual waiver shields ordinary negligence but not gross negligence [opened: FindLaw excerpt; *Lamp* not opened]. No commercial software-contract case was read. A Michigan lawyer must say what a cap will and will not do here.
- **Underwriters have a view on the cap.** Berkley dislikes a cap equal to the policy limit (section 5). A cap tied to twelve months of fees on a $199 a month service is about $2,400, far below any wire a client might lose, so clients may push back. That trade-off is for the engagement-letter work and the lawyer.
- **A lean agreement is what helps.** Suggested content for the lawyer, not legal advice: define confidential information as the specific fields Mastiff takes; promise reasonable care, not named certifications or "bank-grade" language; no indemnity and no liquidated damages; a notice period Mastiff can meet; return or deletion on exit; state in the agreement that Mastiff never accepts more than the last four digits; give the broker a copy before binding.
- **One real-world pattern.** An SEC filing note for fiscal 2015 (company unnamed on the page I opened) describes a customer suing a payment processor for not warning of or stopping $181,709 in bad transactions; the processing agreement capped the processor's liability at one month of fees. The outcome is not stated [opened]. It shows this claim type exists and where vendors put the cap.

## 8. Recommendation

**Coverage types**
1. Tech E&O with affirmative breach-of-contract cover, on one form with cyber if possible.
2. Cyber: breach response, privacy liability, regulatory defense, business interruption, and dependent business interruption for Supabase, Vercel, Resend and the AI vendor.
3. Social-engineering and fund-transfer cover for Mastiff's own money, at the lowest sublimit offered. Optional.
4. Full prior acts or a retroactive date at or before the first pilot, and the option to buy an extended reporting period.

**Limits to ask for.** $1M per claim and $1M aggregate on E&O and on cyber, retention $5,000 or less, and a $2M quote alongside. Reasoning (opinion): losses cited in r1 and r4 are $93,425 (CFC), an average of $125,439 for invoice-impersonation (FinCEN, 2017-18) and $268K (At-Bay average), against client policy sublimits of $100,000 to $250,000, so a single client claim is likely under $1M, while defense costs can erode the limit. Revisit when a client contract asks for more.

**Three calls**
1. **MAIA Insurance Services via SBAM**, (517) 327-8042 or SBAM (517) 482-8788. Michigan, ten cyber carriers. Ask about tech E&O and whether non-members can request a quote.
2. **Michigan Community Insurance Agency, Wixom**, (248) 679-7000. Local independent agent that lists tech E&O.
3. **Embroker**, online quote for tech E&O and cyber, as a price and wording comparison. Ask a broker to get Hiscox and Hartford quotes as well, since I could not open either.

**What to bring.** A one-page product description; the data fields (name, bank name, last four, callback number, amounts); a statement that Mastiff has no bank access, no custody and no release authority; the rule 5 AI statement; a projected revenue figure (zero today; about $12,000 a year at five offices and $199 a month); the draft engagement terms and confidentiality agreement once they exist.

**Questions to ask each broker**
1. How will Mastiff be classed (technology services, professional services, fintech), and does the class change appetite, price or form?
2. Is a free 30-day pilot covered, given definitions that say "for a fee"? What endorsement or nominal fee fixes it?
3. Send the specimen policy and exclusion list. Specifically: represented-performance, funds ("safeguard"), delay, fiduciary capacity, and fraud/dishonesty (severability and trigger).
4. Is breach of contract affirmatively covered? Liability assumed under a confidentiality agreement or indemnity? Liquidated damages?
5. Any AI exclusion or endorsement? Mastiff uses an AI model to read documents and a person confirms every item.
6. Are defense costs inside the limit? Who picks counsel? What are the consent-to-settle terms?
7. Retroactive date, extended reporting period, notice terms. Can cover start before the first pilot?
8. Cyber: what does the application ask about data volume, MFA and backups? Is last-four-only treated as a lower data tier?
9. Is dependent business interruption included for hosting, database, email and AI vendors?
10. Admitted or surplus lines, and the carrier's rating.
11. Cost and process for additional-insured status, waiver of subrogation, certificates and cancellation notice.
12. Minimum premium, installments, and mid-term limit increases.
13. Will you review the engagement terms and the confidentiality agreement before binding, and is a liability cap at policy limit a problem?
14. Mastiff's own applications will ask about its payment-verification procedure. Which questions should I expect?

## 9. Unknown until a broker quotes

- Premium for a payment-verification service, and whether it is quoted at all by Embroker, Hartford, Chubb, Coalition or Hiscox.
- How Mastiff is classed, and whether "no custody, advisory only" earns any credit.
- Whether a free pilot is covered, and whether the funds, represented-performance, delay and AI exclusions appear on the forms offered.
- Whether liability assumed in a confidentiality agreement or client contract is covered.
- Whether the SBAM/MAIA program takes non-members and writes tech E&O.
- Whether Hiscox and Hartford will write a two-person firm and at what retention.
- Whether a client's insurer or lawyer will ask for limits above $1M, and for which endorsements.
- Michigan legal points for a lawyer: the breach statute as applied to last-four data, money-transmission status, the FTC Safeguards Rule for CPA clients, and what a Michigan court would do with a liability cap.

## 10. Could not open or not verified

- Hiscox: cost, technology and partner pages returned 403 or 402. Hiscox figures here are [snippet]: "$23 per month," $1,000 to $8,000 a year, affirmative breach-of-contract cover, non-admitted placement.
- The Hartford web pages and the technology E&O flyer timed out. Claims that Hartford's FailSafe has "no contractual liability exclusion," retentions of $2,500 to $100,000, and cyber limits to $500,000 per claim for small accounts are [snippet].
- biBERK "$300 a year" is [snippet]; the biBERK page I opened gave no price. Vouch "$300 a year" is from a 2019 report [snippet]. Coalition "$50 to $4,000" figures are 2019-20 [snippet].
- Chubb small-business limits, Pro ERM limits and the "$5M capacity" note: not found or [snippet].
- Philadelphia Insurance's tech E&O form link was dead (404). Coalition's help pages and Embroker's tech page returned 404. Next's cyber page returned 404.
- *Cincinnati Insurance v. Wachovia* (D. Minn. 2010), a bank positive-pay case, returned 403 and is not used. *Lamp v. Reynolds* was cited only through *Xu v. Gay*. *Authentic Title* and *SS&C* are read through law-firm summaries, not the opinions.
- No Michigan agency's carriers or appetite could be confirmed beyond the pages listed in section 3.
