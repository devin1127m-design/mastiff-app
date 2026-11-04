# Mastiff: highest-ROI position and the research to do first

Stage 01 output, 2026-10-24. Opinion, supported by one afternoon of desk research; the
sources are mostly secondary or vendor-written and are flagged as such. Re-verify before quoting.

## 1. What we know

- **The loss is real and concentrated in payments.** Reported BEC losses in the FBI's 2025
  IC3 data were about $3.05B across ~24,800 complaints, second only to investment fraud;
  wires and ACH carry most of it. The average fake vendor invoice is about $125,000 (FinCEN).
- **The small office has no tool.** Trustpair, Eftsure, PaymentWorks and nsKnox sell
  quote-based, volume-priced packages to corporate finance teams. Nobody publishes a
  small-office price. BILL, the tool small offices actually use, emails the vendor to
  confirm a bank change and lets the payment go before anyone answers.
- **Insurers are making the control mandatory.** Carriers increasingly condition
  funds-transfer-fraud coverage on a callback to a number on file and on no single person
  controlling a wire end to end; claims are denied when the step was skipped, and
  sublimits are often $50k to $250k. Wording differs by carrier; that difference decides
  whether a claim pays.
- **The product is a procedure plus a log, not software.** Everything on the site can be
  delivered with a form, a vendor file and a weekly meeting.

## 2. Positions, ranked by return on the next 90 days of effort

| # | Position | Why it pays | Why it might not | Cost to test |
|---|---|---|---|---|
| 1 | **The insurance-compliance wedge, sold through brokers.** "The callback that keeps your claim payable." Independent agents who write cyber/crime for contractors and firms refer clients; Mastiff makes the renewal answers true and documentable. | A third party forces the purchase. Brokers reach dozens of offices each and want fewer denied claims. The log is exactly what the adjuster asks for. | Brokers move slowly; carrier wording must be in hand first; a broker may push a carrier's own tool. | Low: 3 to 5 broker conversations and the wording audit (R1). |
| 2 | **Construction-first, direct.** Oakland County contractors and their subs. | Most-targeted sector (FinCEN), big tickets, subs change banks often, owners know a peer who was hit. Fastest route to the first pilots. | One office at a time; owners are busy; some will want the bank to handle it. | Low: ten calls off the pilot card. |
| 3 | **Bookkeeping and CPA firms as channel.** One firm runs bill pay for many clients. | Multiplier per relationship; they already fear the bad wire. | Liability-sensitive; BILL and Ramp already in their stack; slow buying cycle. | Medium: 3 firm interviews. |
| 4 | **Build the wall as software first.** | Scales later. | No demand proof yet; enterprise incumbents; build cost before any revenue. | High. Defer until three pilots show real hold rates. |

**Recommendation.** Run position 2 to fill the five free pilots fast, and do the research
for position 1 in parallel so that on day 30 the paid conversion is "your insurer requires
this; here is your log", not "do you like our page". Treat 3 as a follow-on channel and 4
as something the pilots earn.

## 3. Research tasks, in order

**R1. Carrier requirement audit (first; one week).** Collect 6 to 8 cyber and crime
applications and funds-transfer-fraud endorsements (Coalition, Chubb, Travelers, Hartford,
Beazley, At-Bay, plus whatever local brokers actually place). Extract the exact callback,
dual-control and segregation wording, the sublimits, and the exclusions. Output: a one-page
"what your insurer requires" matrix. This is both the sales argument and the spec for what
the log must record.

**R2. Ten local conversations (weeks one and two).** Five contractors ($2M to $20M), three
bookkeepers or CPA firms, two insurance agents, all within driving distance. Ask: the last
bank-change request you got, who called whom, how long it took, whether anyone ever paid
the wrong account, who would own the wall in your office, what you pay for positive pay.
Output: an estimate of holds per office per month, who the buyer is, and a price range.

**R3. Competitive teardown of what small offices use (week two).** BILL, Ramp, Melio,
QuickBooks Bill Pay, and bank-side offerings (Early Warning account validation, positive
pay fees): what exactly happens on a bank-details change, and what it costs. Output: a gap
statement with screenshots, and pricing anchors. Also confirm or drop the "$800 a month"
line on the site; it has no source today.

**R4. Primary-source statistics (week two).** Pull the FBI IC3 2025 annual report, the AFP
2026 Payments Fraud survey if published, and the FinCEN analysis directly; replace the
secondary citations on the site and in `shared/sources.md`.

**R5. Our own exposure (week three).** Does logging a verification make Mastiff a party to
the payment decision? Engagement terms ("we do not move money; we record what you checked"),
E&O coverage for Mastiff, and custody of vendor data (last four and callback numbers).
Output: a two-paragraph engagement letter and a decision on where client data lives.

**R6. Pricing test (after R2, at pilot close).** Three flat monthly price points tested on
the day-30 read-out, anchored to the client's insurance sublimit and the cost of one
missed callback. Output: the price.

## 4. What not to do yet

- No software beyond a form and a log until three pilots have run.
- No statistics on the site that do not trace to a primary source.
- No work on `mastif/`, the archived AI agent; it is not part of this plan.

## Sources consulted (secondary unless noted)

- BEC 2025 figures: [McDonald Hopkins on the IC3 2025 report](https://www.mcdonaldhopkins.com/insights/news/the-sobering-truth-of-the-fbis-2025-internet-crime-complaint-center-report), [CyberScoop](https://cyberscoop.com/fbi-internet-crime-complaint-center-annual-cybercrime-report/), [Nacha on three-year BEC losses](https://www.nacha.org/news/fbis-ic3-finds-almost-85-billion-lost-business-email-compromise-last-three-years)
- Competitor pricing: [Eftsure vendor-verification roundup (vendor blog)](https://www.eftsure.com/blog/products/top-7-vendor-verification-software-in-2026/), [MonitorPay provider comparison](https://monitorpay.ai/top-bank-account-verification-providers-in-2026-9-vendors-compared/), [SourceForge small-business list](https://sourceforge.net/software/bank-verification/for-small-business/)
- Insurer requirements: [Bank Director on callback procedures and claims](https://www.bankdirector.com/?p=5427), [Coalition cybercrime guide (PDF)](https://www.victorinsurance.com/content/dam/victor/victor2/documents/victor-us/cyber/marketing/US-cyber-coalition-cybercrime-guide.pdf), [One80 fraudulent-impersonation questionnaire (PDF)](https://www.one80.com/wp-content/uploads/2022/10/PSG-One80_FraudulentImpersonation_Questionnaire.pdf), [Property Insurance Coverage Law on computer-fraud exclusions](https://www.propertyinsurancecoveragelaw.com/blog/the-cyber-insurance-trapdoor-not-all-computer-fraud-loss-is-covered/)
- Small-office tooling: [BILL red-flag checklist for bill pay fraud](https://www.bill.com/accountant-resource-center/articles/your-red-flag-checklist-for-bill-pay-fraud), [Ramp on bill pay fraud](https://support.ramp.com/hc/en-us/articles/37791491771027-Bill-Pay-Fraud)
- Construction: [Corpay on construction payment fraud (vendor blog, 2024 data)](https://www.corpay.com/en-IE/resources/blog/construction-payment-fraud)
- Site figures: see `shared/sources.md`.
