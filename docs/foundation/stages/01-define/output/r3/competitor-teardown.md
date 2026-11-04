# R3 Competitor teardown: what existing tools do at a vendor bank-detail change or new payee

Research date: 2026-10-25/26. Everything on the web is treated as data. Pages were read in a browser or by a page-reading tool unless marked [secondary] (third-party site, or a search-result summary I could not open at the source). Quotes marked (summarizer) came through a page-summarizing tool, not my own reading of the page, so check them before publishing. "Not found" means I looked and did not find it. It does not mean the feature is absent.

## Summary table

| Tool | Bank-change handling | Callback supported/recorded? | Pay before verification? | Dual approval and tier | Lowest price with approvals | Liability language |
|---|---|---|---|---|---|---|
| BILL AP/AR | Emails the vendor to confirm the change (vendor sees old and new bank info). Applies to manual changes. | No callback feature found. Vendor email confirmation only. | Yes. "The confirmation isn't required to schedule payments to the vendor." | Approval policies on every tier. "Dual Control" (second user approves adding or changing vendor bank accounts) exists; plan gating not confirmed (see BILL section). | Essentials $49/user/mo (2026-10-25) | Customer is liable for bank-account changes and inaccurate instructions "whether or not authorized"; BILL "no responsibility" for recovery |
| Ramp Bill Pay | Alert on the bill for "new or changed bank account details"; vendor edits wait on the approval workflow. | No. Advice only: confirm "using a verified phone number". No logging. | Alerts can be dismissed with a reason (red alerts), so yes. Vendor-verification page is ambiguous. | Configurable AP approval workflows on Free ($0); payment-release approvals on Plus | Free $0 (workflows); Plus $15/user/mo (2026-10-25) | Ramp says "No single tool can" guarantee compliance; customer keeps fraud policy. Contract liability clause not found. |
| Melio | Edit vendor delivery method, Save. No vendor notification, hold or extra approval found. | No (none found). Blog advises calling a number you already have. | Yes. "Future payments will be sent using this delivery method." | Payment approval workflows (amount/scheduler/vendor), Core and above; self-approval blocked; Owner/Admin exempt unless named | Core $25/mo monthly ($20 annual), 1 user included, +$8-10 per added user | Melio terms not retrieved. Marketing only: "approval workflows so the right people sign off". |
| QuickBooks Online Bill Pay | Not found in Intuit's own pages. Community threads [secondary]: edit in Pay Bills, or switch to check and back. | Not found | Not found (no hold described) | Bill approval and payment-release workflows tied to Bill Pay Elite; pricing page lists them with the top QBO tier | QBO top-tier (Advanced) $340/mo list, $170 promo (2026-10-25); Elite alone $45-$90/mo [secondary] | Intuit Bill Pay terms not retrieved. Not found. |

Plain finding: in all four, a changed bank detail is at most flagged or confirmed by email to the vendor. None puts a payment on hold until someone phones the number already on file, and none records the call or a second person's name.

## BILL (bill.com) AP / Bill Pay

Bank-change handling.
- Source: https://vendorpayhelp.bill.com/hc/en-us/articles/360056648731-Confirm-manual-vendor-bank-change (read 2026-10-25; this is the vendor-facing help site).
- Quote: "When you change a vendor's bank information in your account, we'll let your vendor know, to help protect you and your vendor from payment fraud. The confirmation isn't required to schedule payments to the vendor."
- Quote: "Once you save the vendor's new bank, we send them an email letting them know that you've changed their bank information, and ask them to confirm the change."
- Quote: "If your vendor selects I didn't request this change, we direct them to contact you to discuss the change to prevent payment fraud."
- So: vendor notified by email only. Payment can proceed. No callback to a number on file. No logging of a call.
- The article scope is "manual vendor bank change". Changes the vendor makes through the network were not covered in what I read.
- BILL's developer docs say a manually added account must be verified within 14 days, and BILL sends a test deposit [secondary: search summary of developer.bill.com]. Whether payment can go to an unverified account was not found.

Approvals and role separation.
- Pricing page, https://www.bill.com/product/pricing (read 2026-10-25): Essentials $49, Team $65, Corporate $89 per user per month; Enterprise custom. Essentials lists approval workflows with standard policies. Custom approval policies are Corporate and up (via a page-reading tool (summarizer): "Set standard approval policies" on Essentials, "Set custom approval policies" on Corporate).
- Controls page, https://www.bill.com/product/accounts-payable-controls (read 2026-10-25): "Two-layer approvals: Safeguard key actions by requiring a second admin approval with Dual Control to reduce the risk of fraud or error." No tier is stated there.
- Dual Control FAQ, https://support.wf.bill.com/hc/en-us/articles/7332404025485-Dual-Control-Frequently-Asked-Questions-FAQ (read 2026-10-25). This is the Wells Fargo-branded "Bill Manager" help site, not BILL direct. Quotes:
  - "When Dual Control is enabled, a single user can initiate an action, but a second user is required to approve it."
  - Covered actions: "Adding bank accounts (in accounts payable and accounts receivable)" and "Adding or changing vendor bank accounts".
  - "While all approvers on the list are notified, only 1 person needs to approve the request to complete the action."
  - "There's no added fee for Dual Control."
  - "If you don't see this feature in your account, contact Customer Support to request to enable the feature!"
- Tier gating for direct BILL customers: a search summary said Dual Control is Enterprise-only with certain ERP syncs [secondary, not verified; the BILL help.bill.com pages failed with certificate errors for me]. Treat as not found.
- A developer doc says a user with the Administrator role can pay a bill regardless of any approval policy [secondary, search summary of developer.bill.com].

Liability language. https://www.bill.com/legal/platform-general-terms-of-service (read 2026-10-25):
- Quote: "You agree to be bound by all instructions, including payment instructions, bank account changes, currency conversion, etc. and/or transactions initiated in compliance with BILL's security procedures and this Agreement, whether or not authorized."
- Quote: "You agree that You will be liable for all losses or payments resulting from (1) the theft, loss, compromise, or unauthorized use of Your BILL account or User Login Credentials and/or (2) any losses or unauthorized payments resulting from any fraudulent or illegal compromise of Your systems or processes."
- Quote: "Upon Your timely report, We may, in Our sole discretion, use good faith measures to attempt to reverse and recover any unauthorized or erroneous payments or transfers on Your behalf, but BILL will have no responsibility, obligation, or liab[ility]" (the sentence is cut off in my capture).
- https://www.bill.com/legal/platform-payment-terms (read 2026-10-25): "BILL will have no liability for losses or damages resulting from the accuracy or inaccuracy of Your Customer or Vendor's information, including bank account information, or Your or Your Vendor's actions or inactions."
- No "we reimburse" fraud guarantee found.

"Pay by" network. The only network-specific wording I read was the vendor-side confirmation above. Nothing found on holds for network-held bank details.

## Ramp Bill Pay

Bank-change handling.
- Source: https://support.ramp.com/hc/en-us/articles/37791491771027-Bill-Pay-Fraud (read 2026-10-25, summarizer). Alerts flag "new or changed bank account details" and are coloured "yellow (medium severity) or red (high severity)".
- (summarizer) "we recommend you double-check with your vendor through a separate communication channel before proceeding with payment."
- (summarizer) "Always confirm payment instructions directly with vendors or suppliers using a verified phone number" ... "especially if account details change."
- (summarizer) "we'll prompt customers to add a reason for dismissing the alert for high severity (red) alerts." and "we create an audit log to indicate an alert trigger and the user who 'dismissed' the alert."
- So: it is advice plus a dismissible alert. The audit log records who dismissed the alert, not that a call was made or who made it. No hold on the page.
- Marketing page https://ramp.com/ap-fraud-prevention (summarizer): "Changes to vendor details caught before payment goes out." Holds: not mentioned.

Vendor verification and vendor edits. https://support.ramp.com/vendor-verification (summarizer):
- "The submitted changes remain pending until the applicable vendor approval workflow is completed."
- "A completed submission or document upload does not by itself mean the account can be used for payment."
- Ramp "may allow submission while checks are still processing or when ownership could not be confirmed automatically." Whether a payment can run in that state: unclear. Callback: not mentioned.

Approvals and price. https://ramp.com/pricing (summarizer, 2026-10-25): Free $0/user/mo with "Configurable approval workflows for accounts payable"; Plus $15/user/mo plus a platform fee by team size, with payment release approvals; Enterprise custom. The summarizer warned the comparison table was hard to parse, so confirm tier assignments.

Liability. Ramp's Bill Pay terms/addendum were not retrieved: not found. On the fraud page (summarizer): "No single tool can" guarantee full Nacha compliance; customer still owns "a written fraud policy, annual reviews, incident response, and oversight of other providers"; "This page is for informational purposes only and does not constitute legal, financial, or compliance advice." No reimbursement guarantee found.

## Melio

Bank-change handling.
- https://help.melio.com/hc/en-us/articles/10756751534748-Add-or-edit-a-vendor-s-delivery-method-from-the-Vendors-tab (read 2026-10-25). Edit the delivery method, enter routing and account numbers, Save. Quote: "That's it. You successfully changed your vendor's delivery method. Future payments will be sent using this delivery method."
- Not found: any vendor notification, any hold, any second approver on a bank-detail edit, any callback step.
- https://help.melio.com/hc/en-us/articles/6685476213916-How-to-edit-or-delete-a-vendor: editing covers contact details; "NOTE: Accountants can only delete vendor's that they created".
- Melio can send a request so the vendor chooses and enters their own method ("Send request"), which is vendor-supplied data by email.
- Blog (summarizer), https://melio.com/blog/vendor-payment-security/: "Treat every request to update bank details as a red flag until you confirm it." It advises calling a number you already have. This is advice, not a product feature.

Approvals and role separation. https://help.melio.com/hc/en-us/articles/12097954053788-How-to-create-a-payment-approval-workflow (read 2026-10-25):
- Quote: "Plan eligibility: This is a premium feature available for Core and above subscribers."
- Quote: "Self-approval: To maintain security, a user cannot approve a payment they scheduled themselves."
- Quote: "If you do not select an Owner or Admin as the payment scheduler, their payments will not require approval, even if the workflow is active."
- Conditions: payment amount, payment scheduler, payment vendor. Up to 3 approvers per step, up to 3 steps. "Boost and Unlimited subscribers can set up multiple specific approvers."
- Workflows apply to payments, not to bank-detail edits. "Payments scheduled before setting up the approval workflow won't require approval."
- Plan table, https://help.melio.com/hc/en-us/articles/15943315824028-What-are-the-different-subscription-plans-in-Melio: per-amount approval is Core and up; per-scheduler and per-vendor approval are Boost and up. This conflicts with the workflow article, which lists vendor as a condition without a tier. Confirm in the app.
- Go (free) is "Owner only" with no multiple users, so no approval separation.

Price. https://melio.com/pricing/ (summarizer, 2026-10-25): Go $0; Core $25/mo ($20 annual); Boost $55 ($44 annual); Unlimited $80 ($64 annual); Platinum custom. "Plus $8/mo per additional user. Billed annually." The help plan table says "$10/mo per user" on Core and Boost. A second person is needed for approval, so a practical minimum is about $33-35/mo (Core, monthly, two users) [my arithmetic from the two sources]. Fees: ACH $0.50, check $1.50, wire $10 (summarizer, table mapping uncertain).

Liability.
- Primary terms not retrieved: not found.
- A search summary of a 2021 Intuit-branded Melio terms page (https://qbousers.meliopayments.com/terms.html) said the user is responsible for checking recipient details and bears the risk of payments to a wrong account [secondary, not verified, 2021 version]. Do not cite without reading the current terms.
- https://help.melio.com/hc/en-us/articles/4418753136796-How-secure-is-Melio (read 2026-10-25) is about account security (2-step sign-in PIN by email, PCI, check protection). It says nothing on bank-change fraud or reimbursement.

## QuickBooks Online Bill Pay (Intuit)

Bank-change handling. Not found in Intuit's own help pages that I could open.
- Community answers [secondary] (https://quickbooks.intuit.com/community/payments-3/change-vendor-ach-bill-pay-account-info-19345 and similar, 2018-2019): edit vendor info in Pay Bills Online, or switch to check and back to re-enter bank details. Possibly outdated.
- Intuit help, https://quickbooks.intuit.com/learn-support/en-us/help-article/pay-bills/pay-bills-quickbooks-bill-pay/L4XfPGnJl_US_en_US (read 2026-10-25, updated 10/21/2026). Quote: "When you schedule a bill payment, both you and the payee will receive an email confirmation." and "If necessary, an authentication may be sent to the phone number of the individual making the payment." That phone step is a one-time-code check on the payer, not a callback to the vendor.
- Not found: vendor notification on bank edit, hold, callback.

Approvals. Intuit's approval-workflow help article (L1IOLL9hv...) returned "Page not found" for me. A search summary of that page [secondary] said Bill Pay Elite customers can add a bill approval workflow, with amount/vendor/location triggers and one to seven approvers, and that Advanced or Elite customers can add roles and permissions. Conflicting older claims exist (Ramp blog 2025, Intuit community) [secondary].

Price. https://quickbooks.intuit.com/pricing/ (read 2026-10-25). The page lists a four-step price ladder of $38, $85, $140 and $340 per month list ($19, $42.50, $70, $170 promo; plan names were not captured in my extraction). On the top step: "Free 1099 e-filing and approval workflows with Bill Pay Elite**". The footnote text was not captured. Standalone Bill Pay Elite is $45 promo / $90 regular per secondary sources (Fortune, Fit Small Business; not verified at Intuit). One source (ApprovalMax, Aug 2026) says Elite is included with eligible US Advanced plans bought direct [secondary, unverified]. Intuit help (same article above): "$0 fee on all standard ACH payments, for all Bill Pay tiers".
- Role separation: not verified.
- Melio-powered era: not researched, not found.

Liability. Intuit's QuickBooks Bill Pay terms were not located (the QBO terms page lists "V. QuickBooks Bill Pay" but I did not find the Bill Pay section text). A search summary quoted "not obligated to independently verify the accuracy of any Payment Instructions" [secondary, unverified]. Do not cite as Intuit wording until read at source.

## Bank-side controls and fees

Check and ACH filters.
- Chase, https://www.chase.com/business/support/banking/fraud-security-services (read 2026-10-26): "Chase business checking customers may enroll in Check Monitoring/Check Protection Services and ACH Debit Block at no additional cost, based on account eligibility. Service activation is subject to Chase approval." Also: "Check Protection Services ("Positive Pay"): Payee Name Verification is not available through Chase Business Online." Chase's own page shows no fee, but eligibility for Positive Pay is limited to named higher-tier accounts (list truncated in my capture).
- Huntington, https://www.huntington.com/SmallBusiness/payables-management/business-security-suite/ach-positive-pay (read 2026-10-26). Quote: "ACH Positive Pay is an online fraud mitigation service that allows you to manage automated clearing house (ACH) debits and credits posting to your business account through filters and blocks." No fee on that page. Huntington fee forms (undated, PDFs gave 403 to me) as summarized in search [secondary]: Check Block $5/mo per account, Reverse Positive Pay $8/mo per account, Business Online $20/mo per access point. Not verified.
- Fifth Third: Positive Pay is described as a product in Fifth Third Direct; its business page says Client Maintained Positive Pay is "available at a discounted price" [secondary summary] with no dollar amount. Fee: not found.
- PNC: only consumer schedules found. Business Positive Pay and wire fees: not found.
- Benchmarks from other banks [secondary, search summaries of their published schedules]: ACH Positive Pay about $20-$25/mo at Western Alliance, Axos, Fidelity Bank; $60 at Amalgamated; Positive Pay $10/mo at PB&T; $50/mo at one other. These are not Michigan banks.
- Outgoing wires: third-party sites say Chase domestic outgoing is $25 online / $35 branch; Chase's own transaction document says no Chase fee on wires. Conflict, so not confirmed.

Dual control on wires in business online banking. Not researched at bank level; no bank's wording obtained. Not found.

What these filters do and do not do. Positive Pay and ACH blocks stop checks or debits you did not issue or authorize. They do not look at a push payment you key yourself to a changed account, which is the vendor-impersonation case. That is my reading of what the products are described to do, not a quoted bank statement.

Nacha 2026 rules [secondary: stampli.com, jpmorgan.com, usbank.com PDFs; Nacha's own page not read].
- Fraud-monitoring rule: risk-based monitoring for ACH originators, ODFIs and third parties, with credit-push scams ("false pretenses") in scope. Phase 1 March 20, 2026 for the largest originators; Phase 2 June 22, 2026 for all others (one source says June 19). Dates not confirmed at Nacha. It binds originators and banks. A small office paying through its bank or a platform is usually not the party that must comply, but its provider may ask it questions. Nacha "does not prescribe a specific method".
- Account validation for WEB debits is not new in 2026. It dates from March 19, 2021 [secondary] and covers debits (collecting from a payer), not paying vendors. Accepted methods include prenotes, micro-entries or validation services. One bank says prenotes do not establish ownership.

Early Warning Services [secondary: product briefs]. "Account Owner Authentication" is described as confirming the person can transact on the account; "Verify Account" returns status, an ownership match and a score. The materials are aimed at banks, corporates and government. No small-office price found. "Verify Payee" as a product name: not found. The WEB-debit eBook says its solution covers status only, not ownership.

## Enterprise tools (public information only)

| Tool | Target customer (public) | Pricing model | Published price |
|---|---|---|---|
| Trustpair | ERP-integrated finance teams; SAP partner listing | Quote-based, usage-based [secondary: ERP Research, Capterra] | None found |
| Eftsure | Mid-market and enterprise; Capterra lists Australia/New Zealand | Sales-led | GetApp shows "1200 per year" with no currency or scope [secondary]; G2 users call it costly for smaller firms [secondary] |
| PaymentWorks | Universities and health systems (NYU Langone, SDSU, Nuvance pages) | Quote; vendors register free | None found. Its marketing claims $100-$200 per payee per year to onboard and maintain a vendor master (vendor-sourced estimate, not a price) |
| nsKnox | Corporations and banks; named customer Meta | Quote [secondary: Capterra, The Paypers] | None found |
| Bottomline (Paymode-X) | Payers on a vendor network | Per-transaction fees; rebates on ACH volume [secondary: Bottomline brochure via search] | None found; no separate charge for verification stated |

## The $800/month claim

Claim: "The tools that do this for big companies start at $800 a month."

Verdict: not supported by anything I found, and not disproved. Reasons:
- None of the five enterprise vendors publishes a price. Every source says quote-only. So no public source states $800 or any monthly floor.
- The only dollar figure for any of them is GetApp's "1200 per year" for Eftsure (about $100/mo if USD), with no currency or scope [secondary]. That is a weak signal pointing below $800, not above.
- The tools small offices already use are far cheaper but do less: BILL $49/user/mo, Ramp $0, Melio $25/mo, QBO $170-$340/mo (including Bill Pay Elite).
- Wording fix that the evidence supports: "Tools built for big companies are quote-only; none publishes a price." If $800 came from a sales call or a source Devin has, cite it. Otherwise cut it.

## Gap statement

1. No hold on a bank-detail change. BILL says its vendor confirmation "isn't required to schedule payments". Ramp lets a user dismiss a red alert by giving a reason. Melio's edit page says future payments go to the new details. Mastiff's wall holds the payment until the call is made.
2. No call to the number already on file, and no record of one. Ramp and Melio give advice to phone a known number. BILL's check goes by email to the vendor. The only record found is Ramp's log of who dismissed the alert. None logs a call or names a second person who confirmed it.
3. Second approval is on payments or on the bank-detail change, but it is not tied to a call. BILL Dual Control needs one more user for adding or changing vendor bank accounts, and "only 1 person needs to approve"; it does not require verifying with the vendor. Melio approvals cover payments by amount, scheduler or vendor and exempt Owner/Admin unless named.
4. Loss sits with the customer in the one set of terms read in full. BILL: liable for "bank account changes ... whether or not authorized" and BILL "no liability" for vendor bank-account inaccuracy. No reimbursement promise found for any of the four.
5. Not found in any of the four: rules for unknown payees, off-hours requests, urgent requests, or amounts out of range for a given vendor. Also, the tools cover payments made inside them. Wires keyed at the bank and checks cut in the books were not covered by anything I read.

## Gaps

- BILL direct help center (help.bill.com) returned certificate errors, so BILL AP approval-policy and plan-gating articles were not read at source.
- Intuit: Bill Pay terms, the approval-workflow article and any bank-change article were not retrieved. QBO plan names were not captured.
- Melio and Ramp: contract terms (liability) not retrieved. New-payee handling was not found for any of the four.
- Ramp pricing and vendor-verification quotes came through a summarizer.
- Bank fees: Fifth Third and PNC business fees not found; Huntington figures are secondary and undated; no bank dual-control-on-wires wording captured. Chase Positive Pay eligible-account list is cut off.
- Nacha and Early Warning: no primary Nacha page read; dates conflict (June 19 vs June 22, 2026).
- Enterprise vendors: no vendor-site pages read; all from directories and search summaries.
- Not tested: nothing was run in a live account (no accounts created, per instructions), so actual in-app behavior on a bank edit is untested.
