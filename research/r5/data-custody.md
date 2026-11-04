# R5 (custody of client data): where client data lives and under what rules

Stage 01 output, 2026-10-27. Desk research. This is not legal advice. Everything marked "Lawyer" below must be reviewed by a Michigan attorney before it goes into a client agreement.

How to read the sources. Every web page below was read through a fetch tool that summarizes the page, so quotes are as that tool relayed them, not raw HTML. Re-check the live page before quoting any of it to a client. The two Supabase sub-processor lists were read as extracted PDF text, which is more reliable. Pages I could not open are listed at the end and no claim rests on them. Judgment calls (my recommendation, not a sourced fact) are marked "Proposal".

## 1. Bottom line

1. **The data is low-risk in law and high-stakes in practice.** Vendor name plus bank name plus last four digits does not meet Michigan's definition of "personal information", so the state breach statute is probably not triggered by it. The real exposure is different: (a) the callback phone numbers, because whoever can change one can defeat the whole control, so integrity matters more than secrecy; (b) payment history, which is sensitive business information; (c) any raw payment file that arrives with full account numbers before it is cut down to four digits.
2. **The "all free tier" plan does not hold for real client data.** Vercel's Hobby plan is for non-commercial personal use only, and its own text counts advertising a service as commercial. Supabase Free has no backups and pauses a project after one week of inactivity, which would take the wall down and break rule zero. Both should be paid from the first pilot that touches a real file, not from the first paid client. Cost is about $45 a month (section 3.3).
3. **Region is a US choice with caveats.** Pick Supabase US East (Ohio) and pin Vercel functions to Cleveland. Supabase says logs, telemetry, support access and CDN caching can happen outside the chosen region, so the rule is: nothing from the vendor record goes into logs, error reports or email bodies.
4. **Supabase Pro does not include the SOC 2 report.** Supabase is SOC 2 Type 2, but only Team ($599 a month) and Enterprise customers can get the report. A CPA-firm client or insurer who asks for it gets the vendor attestations and a plain description of Mastiff's own controls. Mastiff itself has no certification and must not imply one.
5. **Offboarding: export, then delete.** Client gets a full export. Mastiff deletes within a stated window and says so in writing (section 4).
6. **One tension with the roadmap.** STATUS.md names shared vendor memory and alerts across local clients as the long-term moat. A promise not to share one office's data with another (promise 1 below) rules that out unless each office opts in separately in writing. Do not put cross-client sharing in the first agreement.

## 2. What Mastiff holds

| Item | Where it comes from | Class | Notes |
| --- | --- | --- | --- |
| Vendor name | Vendor list, payment entry | Business information; a person's name if the vendor is a sole proprietor | Not a statutory data element alone |
| Bank name, last four of account | Vendor list | Redacted by design (rule 4) | Four digits is the legal limit for "redacted" in Michigan (3.1) |
| Callback number on file | Vendor list | Business contact; a personal phone if sole proprietor | Highest integrity value: changes need logging and a second person |
| Payment amounts, dates | Wall entries, look-back files | Sensitive business information | Reveals spend patterns |
| Staff names, emails, roles | Accounts, log | Ordinary personal data | Needed for the "who called, who signed" record |
| Log of checks, holds, callbacks, releases | Wall | The client's record | Must be exportable (R1 field 12) |
| Raw look-back files | Prospect hands over 6 to 18 months of payments | Unknown until opened; may hold full account numbers or tax IDs | Not in the planned data model but will arrive. This is the riskiest item. |

## 3. Findings

### 3.1 Is last four plus vendor name "personal information" or "financial information"?

**Michigan Identity Theft Protection Act (2004 PA 452).**
- Definition of personal information (MCL 445.63(r), as relayed): first name or first initial and last name linked to a Social Security number, a driver license or state ID number, or "demand deposit or other financial account number, or credit card or debit card number" in combination with a security code, access code or password that would permit access to the resident's financial accounts. Last four digits plus a vendor name is not that combination. [Source: MCL 445.63]
- "Redact" (445.63(t), as relayed) means altering a number so that no more than 4 sequential digits of an account number (5 for an SSN) are accessible. Mastiff's rule 4 matches the statute's own line. [Source: MCL 445.63]
- Breach duty (445.72(1), as relayed): notice is owed when a resident's unencrypted and unredacted personal information was accessed and acquired, unless the holder determines the breach has not or is not likely to cause substantial loss or injury or identity theft. [Source: MCL 445.72]
- Mastiff's position (445.72(2), as relayed): a person that maintains a database holding data it does not own or license must tell the owner or licensor of a breach, subject to the same likelihood-of-harm test. That is the duty Mastiff would have. [Source: MCL 445.72]
- Timing and penalty (as relayed): notice "without unreasonable delay"; no attorney general notice; notice to the national consumer reporting agencies only if more than 1,000 Michigan residents are notified and the holder is not covered by the federal Gramm-Leach-Bliley provisions; a knowing failure to notify can draw a civil fine of up to $250 per failure, capped at $750,000 for one breach. [Source: MCL 445.72]
- A separate, broader term, "personal identifying information" (445.63(q)), lists name, address, telephone number, employer or taxpayer identification number and account numbers. That term is used for the Act's identity-theft offences, not for breach notice. [Source: MCL 445.63]
- **Pending change.** Senate Bill 360 (2025) passed the Senate 8/26/2025 and was referred to the House Committee on Government Operations the same day; the page I opened showed no later action. A law-firm summary dated 2025-09-09 says it would add notice to the attorney general at 100 or more residents, a 45-day deadline, and new data elements including an email or username paired with a password or security answer, and would require service providers to be bound to recognized cybersecurity standards. Not law today. Re-check before the first client agreement. [Sources: SB 360 page; Fisher Phillips]

**FTC Safeguards Rule (16 CFR Part 314).**
- It protects "customer information": records of nonpublic personal information about a customer of a financial institution, where a "consumer" is an individual who gets a financial product or service for personal, family or household purposes. A business paying its own business vendor is outside that. [Source: 16 CFR 314.2]
- Financial institutions include "an accountant or other tax preparation service that is in the business of completing income tax returns" and investment advisers. The examples are not exhaustive (the test is what the business does), but construction firms are not among them and do not carry on financial activities in the rule's sense. So the rule most likely reaches the accounting and advisory clients and not the contractors; Lawyer to confirm. [Source: 16 CFR 314.2]
- A "service provider" is anyone who receives, maintains or accesses customer information through services given to a covered institution. Covered institutions must select capable providers, require safeguards by contract, and reassess them (314.4(f)). [Source: 16 CFR 314.4]
- Where it applies: encrypt customer information in transit and at rest (314.4(c)(3)); dispose of it no later than two years after last use (314.4(c)(6)); tell the FTC within 30 days of discovery of unauthorized acquisition of unencrypted information on at least 500 consumers (314.4(j)). The fewer-than-5,000-consumers carve-out (314.6) excuses only 314.4(b)(1), (d)(2), (h) and (i); it does not excuse (f), (c)(3), (c)(6) or (j). [Sources: 16 CFR 314.4; 314.6; FTC business guidance]
- **Reading for Mastiff:** the vendor list of an accounting office is business-to-business data, so Mastiff is probably not a "service provider" under this rule for it, and last-four plus vendor name is probably not "customer information". The exception to flag: an accounting office that pays bills on behalf of its individual (household) clients. Then the payee list could be nonpublic personal information about those consumers. Lawyer. Either way, expect accounting clients to ask for service-provider contract terms, and the five promises below are written to answer that request.

**Michigan Insurance Data Security Act (MCL 500.550 et seq.).** Applies to licensed insurers and producers. If an insurance agency ever becomes a client (the broker channel in the research plan), that agency must exercise due diligence in selecting service providers and require them to use appropriate administrative, technical and physical measures (500.555(6), as relayed), and has a 10-business-day notice duty to the state director after a cybersecurity event (500.559(1), as relayed; confirm). Not researched: whether Mastiff's data would be "nonpublic information" under that Act. Lawyer. [Sources: MCL 500.553, 500.555, 500.559]

**Other states.** Not researched. A vendor outside Michigan (an Ohio subcontractor, say) brings that state's law into play; most breach statutes key on a full account number plus an access code, but I did not verify any of them.

**Breach-notice duties in one place**

| Regime | Applies to Mastiff? | Trigger | Deadline |
| --- | --- | --- | --- |
| Michigan ITPA 445.72(2) | Yes, as maintainer, if the data meets the definition | Unauthorized access and acquisition of personal information, subject to likelihood-of-harm test | Without unreasonable delay; Mastiff tells the owner |
| FTC Safeguards 314.4(j) | Client's duty, only accounting and advisory clients who hold consumer data | Unencrypted information on 500 or more consumers | Client tells the FTC within 30 days of discovery |
| Mastiff's own contract | Yes | Confirmed unauthorized access to a client's data | Proposal: 72 hours |
| Supabase to Mastiff | Upstream | Security incident | "without undue delay, and where feasible, within forty-eight (48) hours" (DPA section 10) |
| Vercel, Resend to Mastiff | Upstream | Confirmed incident | "without undue delay" (no hour count) |

Conclusion: on the facts given, no statutory notice is likely to be triggered by last-four data alone, but the contract should promise notice anyway, because a client's own duties run on short clocks and a raw file with full numbers would change the analysis.

### 3.2 Supabase posture and what the free tier lacks

Published posture (security page and DPA):
- SOC 2 Type 2 and ISO 27001; HIPAA with a signed agreement. Report and certificate are available only to Team and Enterprise customers.
- Customer data encrypted at rest with AES-256 and in transit with TLS; the DPA says all hard disks are AES-256 encrypted, traffic uses TLS 1.2, and keys are protected by FIPS 140-2 hardware modules. Project APIs accept only HTTPS (TLS 1.2 or 1.3). **Postgres connections do not require SSL by default**; this must be switched on per project.
- Organization owners can enforce multi-factor authentication for all team members. Roles include read-only and billing-only. Supabase Auth supports authenticator-app (TOTP) and phone codes, and a row-level-security policy can refuse any session that has not passed the second factor (the page does not state which plans include which method).
- Row-level security (RLS) is the customer's job under the shared responsibility model. The docs say a table in an exposed schema without RLS "is readable and writable by any role with a grant on it", views bypass RLS by default, and the service-role key bypasses it and must stay server-side. A cross-client leak from a missed policy is the most likely way Mastiff exposes one office's data to another.
- Region: you choose it ("You choose the region, we don't select it for you"). US options: us-east-1 (N. Virginia), us-east-2 (Ohio), us-west-1, us-west-2. A general "East US" label may deploy elsewhere; pick the specific region. Database and backups are kept in the chosen region.
- But Supabase processes data outside the region in four categories: account and billing data; support (a globally distributed team may access your data when you ask for help or during an incident; access is logged and limited to what is needed); usage telemetry, logs and metadata; and content cached by a global CDN. The DPA's data importer is Supabase Pte. Ltd. in Singapore, and the DPA lets Supabase process data wherever it or its sub-processors have facilities (section 6.1).
- DPA terms useful to Mastiff: copy of data on request within 30 days after the agreement ends, then deletion including sub-processor copies; 30 days' notice of sub-processor changes with a five-day objection window; audit reports on request.
- Supabase's terms cap liability at fees paid in the prior twelve months, with carve-outs, and put backup and security of customer data on the customer (sections 11 and 7(b)).

| | Free | Pro (from $25 a month) | Team (from $599 a month) |
| --- | --- | --- | --- |
| Automatic backups | None | Daily, 7 days | Daily, 14 days |
| Point-in-time recovery | No | Add-on, about $100 a month per 7 days; needs at least Small compute; replaces daily backups | Same add-on |
| API and database log retention | 1 day | 7 days | 28 days |
| Dashboard single sign-on for staff | No | No | Yes |
| SOC 2 report | No | No | Yes |
| Idle projects | Paused after 1 week | Never | Never |
| Support | Community | Email | Priority email and SLAs |
| Auth audit logs | 1 hour | 7 days | 28 days |

Pro includes a $10 monthly credit that covers one Micro compute instance; Small compute is about $15 a month (approximate, from the compute table). Storage objects are not in backups, only the database is; Mastiff should not keep client files in Storage. Deleting a Supabase project removes all data including backups.

### 3.3 Vercel and Resend

**Vercel.**
- Hobby is "restricted to non-commercial personal use only." Commercial use is any deployment used for the financial gain of anyone involved in any part of production, and the examples include "advertising the sale of a product or service." The marketing site and the wall are both commercial on that wording, even during a free pilot. Pro is required. If in doubt, Vercel's page says to ask their support. [Source: Vercel fair use guidelines]
- Pro is $20 a month (the page lists a $20 developer seat; it does not say how the plan fee and seat fee combine, so confirm at checkout). Hobby keeps runtime logs 1 hour, Pro 1 day. SOC 2 Type 2 and ISO 27001:2022 are published; the compliance page says data at rest is AES-256 and in transit TLS 1.3. [Sources: Vercel pricing; compliance]
- Vercel's data processing addendum says it applies to Enterprise and Pro customers; Hobby is not mentioned. Breach notice is "without undue delay"; deletion after termination is "within a commercially reasonable timeframe", no number of days. [Source: Vercel DPA]
- Functions default to Washington, D.C. (iad1). Cleveland (cle1, AWS us-east-2) exists and sits in the same AWS region as Supabase Ohio. Vercel's compute regions are 19; its 126 points of presence only route traffic, and the compute region handles TLS. Static content is cached widely, so authenticated pages must be sent with no-store caching. Vercel also says its primary processing is in the United States but data may be processed anywhere it or its sub-processors operate (DPA section 13.1). [Sources: Vercel regions; compliance; DPA]

**Resend.**
- SOC 2 Type II (stated on its security page); AES-256 at rest, TLS in transit; "Stored data is held in the United States"; the sending region you pick controls where mail is sent from, not where it is stored. Email content and logs are kept 30 days on Free, Pro and Scale; remaining customer data is deleted within 90 days of account termination; backups kept 7 days. [Sources: Resend security; DPA]
- The security page says Resend runs a small sample of emails through a self-hosted model on RunPod for trust and safety, and that Anthropic receives content only through Resend's AI editor and support agent, not normal API sending. [Source: Resend security]
- Free plan: 3,000 emails a month, 100 a day, 3 domains. Plenty for five pilot offices. [Source: Resend pricing]
- **Consequence:** an email body is a stored copy that lives 30 days outside Mastiff's control and may be sampled. Hold notices and weekly digests should say "a hold is waiting" and link to the wall. No vendor names, bank details, phone numbers or amounts in email.

**Cost of doing it properly before the first paid client:** Supabase Pro $25 plus Vercel Pro about $20 plus Resend Free $0, about $45 a month, roughly $540 a year, against a planned price near $199 a month per office. Proposal: pay it from the first pilot that receives a real file.

### 3.4 Retention and offboarding

What the sources set as outer limits:
- Michigan MCL 445.72a (summarized by the fetch tool, which declined to reproduce the text): a person that keeps a database of personal information on multiple people must destroy an individual's data once it is removed from the database, unless kept elsewhere for another lawful purpose. "Destroy" means shredding, erasing or otherwise altering so it cannot be read or reconstructed by generally available means. A knowing violation is a misdemeanor with a fine up to $250 per violation. Read the live text.
- Accounting and advisory clients under the Safeguards Rule must dispose of customer information no later than two years after last use. Shorter is better for them.
- Mastiff's own exposure to a claim runs six years on contract (MCL 600.5807(9)). That argues for keeping something; data minimization argues against keeping client records. Resolve by (a) keeping only Mastiff's own records (signed agreement, billing, a count of checks and holds with no vendor detail, and the deletion confirmation) and (b) a legal-hold exception for data needed to defend a claim. Lawyer.
- The client may need its log for years: the IRS default is three years from filing, longer in some cases (6 years for large omissions of income, 7 for bad-debt or worthless-securities claims), and tax records are kept until the limitations period runs. Insurers ask for the log after a loss. So the client, not Mastiff, should hold the long-term copy, which is why export must be a first-class feature, not a favor. [Source: IRS]

Mechanics:
- Deleting rows inside the Supabase project leaves the data in daily backups for up to 7 days on Pro. Deleting the whole project removes backups too, but that is only possible after the last client is gone; one project holds all offices (a project per office would cost $25 each).
- Resend keeps email and log data 30 days and deletes the rest within 90 days of account closure. Mastiff cannot shorten that, so email carries no client data.

### 3.5 Who at Mastiff can see client data

Two people can: Devin and the second principal. This is true by construction (the Supabase dashboard and service-role key reach everything), so the control is discipline and a record, not a technical wall. Supabase's role model can limit the second person to read-only if their job allows it. Staff at Supabase, Vercel and Resend can reach the data only as described in their terms (Supabase: for support or incident response, logged). Anthropic is not listed as a sub-processor in the facts given, but the look-back scan in STATUS.md is run "by hand" by Claude on files Devin collects, and rule 5 contemplates AI reading client documents. If a client file ever goes into an AI tool, that tool becomes a sub-processor and must be disclosed. Anthropic's API documentation says conversation content is not retained by default (exceptions for certain models that require 30-day retention), retained data is not used for training without permission, and zero retention is by arrangement; the consumer apps are governed by separate terms that I did not read. Proposal: no client file in a consumer chat app; API only, disclosed in the schedule.

### 3.6 Sub-processors and where they store data

| Provider | Role | Stored in US? | Outside the US |
| --- | --- | --- | --- |
| Supabase (Supabase, Inc., US; Supabase Pte. Ltd., Singapore) on Amazon Web Services | Database, login, backups | Yes, in the region you choose; backups in the same region | Telemetry, logs, account data, CDN cache and support access can be outside the region; the DPA names the Singapore entity as data importer |
| Vercel (on AWS) | App hosting, request handling, runtime logs | Functions run in the region you pin (US) | DPA allows processing anywhere; I could not read which sub-processors or where (3.6 note) |
| Resend (sending through AWS) | Email | Yes, "stored data is held in the United States" | Its listed sub-processors are all US-based; I could not confirm that the page was Resend's list (it did not name Resend), so treat as provisional |

Supabase's sub-processor list as of 2026-10-12 has 22 entries, all in the United States except Supabase Pte. Ltd. (Singapore) and ConfigCat (Hungary, feature flags). The list does not say which of them touch project contents. The likeliest are the hosting providers (Amazon Web Services, Cloudflare, Google, Upstash, Vercel) and monitoring (Sentry, Braintrust); the rest are described as support, communication, marketing or internal tools. It also lists OpenAI for "natural language processing and generation services", with no detail on what data goes there. The June 1, 2026 list also named Atlassian, Fly.io and PandaDoc, which the October list drops. Vercel's sub-processor page I could open showed only AI-related names and no locations (SpaceXAI, Baseten, Cerebras, Fireworks, Groq, Raindrop) plus a note that Honeycomb, Datadog, Microsoft, Google and AWS are named in the legal section; the full list with locations sits in its trust center, which I could not read.

## 4. Proposed custody decision (ten lines)

1. **Where:** one Supabase Pro project in AWS US East (Ohio, us-east-2), chosen by name, holds all offices; the app runs on Vercel Pro with functions pinned to Cleveland (cle1); email through Resend. Pay for Pro tiers from the first pilot that receives a real file.
2. **What:** vendor name, bank name, last four, callback number, amounts and dates, staff names and emails, and the log. Nothing longer than four digits of any account or tax ID is accepted or stored; raw look-back files are cut to four digits on Devin's encrypted machine, never uploaded raw, and the original is deleted when the scan is done.
3. **Encryption:** AES-256 at rest and TLS in transit as provided by Supabase and Vercel; require SSL on the Postgres connection; no authenticated page is ever cached.
4. **Isolation:** row-level security on every table keyed to the office, an automated test that office A cannot read office B, service-role key server-side only, second-factor sign-in required for every user, and edits to a callback number need a second person and are logged.
5. **Access:** Devin and one named second person only, each with a named account and an authenticator app; any read of client data outside the app is noted in a Mastiff access log; no contractors; no client file in a consumer AI app.
6. **No leaks by side door:** no vendor details in application logs, error reports, analytics or email bodies; notices say "a hold is waiting" and link to the wall.
7. **Retention:** kept while the office is a client; the office can export at any time; after the pilot or service ends, 30 days to export, then Mastiff deletes the office's rows within 30 more days; backups clear within 7 days of that; written confirmation; legal-hold exception for defending a claim.
8. **Offboarding package:** vendor list with callback numbers, office settings (cap, weekly total, hours, second-person list), and the full log as CSV and printable page showing all 13 R1 fields, with the export date and time.
9. **Sub-processors disclosed in the agreement:** Supabase (on AWS), Vercel, Resend; stored data stays in the US; Supabase telemetry, support access and CDN cache, and Vercel processing, may reach outside it, and the schedule says so; 30 days' notice before any change.
10. **Review triggers:** move to Supabase Team ($599 a month, SOC 2 report, dashboard sign-on, 14-day backups) when a client or insurer needs the report; add point-in-time recovery when paid clients hold live holds; redo this decision if full account numbers are ever needed.

Outside the ten lines, one timing change (Proposal): move the Michigan LLC, tech E&O and cyber insurance, and the lawyer's review of the confidentiality agreement from "before the first paid client" to before the first real payment file arrives, since custody starts at the pilot. Sign the agreement in the LLC's name, not Devin's.

## 5. The five promises the confidentiality agreement should make

Written for the client to read. Avoid the words "fraud", "illegal" and "you were hit" in the agreement itself.

1. **We use your information only to run your checks.** We use your files and records only to run your checks, build your look-back and read-out, and support your office. We do not sell them, share them with anyone else, or use them for another office or for marketing. We will not combine your vendor information with other offices unless you agree separately in writing.
2. **We keep as little as we can.** We keep only the last four digits of any account or tax ID number. If a file reaches us with more, we cut it down to four digits or delete it, and tell you. We never ask for bank logins, and we do not touch your bank or your books.
3. **Two people, named providers, United States storage.** Only the two people named in the schedule at Mastiff can see your data. It is kept encrypted, in the United States, with the providers listed in the schedule (Supabase, Vercel, Resend), whose staff may reach it only to run or support the service. We give you 30 days' notice before adding or replacing one, and you may end the pilot if you object.
4. **We tell you fast.** If we confirm that someone who should not have your data has seen it, we tell you within 72 hours, say what we know, and help with any notice you decide to give. Whether and whom to notify stays your decision.
5. **You can take it with you, and we delete it.** You can export your vendor list and log at any time. When the pilot or service ends you have 30 days to take a copy; we then delete your records within 30 days and confirm in writing, and backups clear within 7 days after that. We keep only our own agreement and billing records, and anything we must keep by law or need to defend a claim, and only for that purpose.

What the agreement should not say: no certification Mastiff does not hold; no "bank-grade", "military-grade" or "unhackable" claims; no promise that nothing will ever go wrong; nothing that implies Mastiff moves money or decides a payment ("Mastiff flags. Your firm makes every payment decision"). The 72-hour, 30-day and 30-day figures are proposals, not sourced standards; they were chosen to sit well inside the 30-day FTC clock that accounting clients face and to match the 30-day export window in Supabase's own DPA.

## 6. For the Michigan lawyer

1. Is Mastiff a "service provider" under 16 CFR 314.2 for any accounting client, and does paying bills on behalf of household clients change that?
2. Does last-four plus name ever amount to "personal information" for any Michigan resident under MCL 445.63(r), and what happens if a raw file with full numbers is lost before truncation?
3. The notice duty and clock in promise 4, and whether to promise more or less than 72 hours.
4. Retention and deletion terms in promise 5 against Mastiff's six-year contract exposure; wording of the legal-hold exception.
5. Liability cap and indemnity in the client agreement (Supabase caps its own liability at twelve months of fees).
6. Whether to sign the first agreement before the LLC exists.
7. Flow-down terms insurance agencies would need (Michigan Insurance Data Security Act), if the broker channel proceeds.
8. Out-of-state vendors and residents.
9. Whether the sub-processor change right (30 days' notice, right to end the pilot) is workable given that Supabase and Vercel each give Mastiff only five days to object to their changes.

## 7. Not verified or not found

- Live text of MCL 445.72a, 445.72 and 445.63: read through a summarizing tool, which declined to reproduce 445.72a in full.
- eCFR (the official Part 314 page) redirected to a block page; the rule text was read from the Cornell Legal Information Institute copy, which may lag the official text.
- Which Vercel sub-processors exist and where; Vercel trust center not readable. Only the privacy policy, DPA and compliance page support the Vercel location claims.
- That the Resend sub-processor page I read is Resend's own list (it did not name Resend).
- Where Supabase backups are stored beyond "in your selected region" (FAQ); the backups page says deleted projects' backups are removed from S3.
- Michigan SB 360 text: the bill analysis (certificate error) and the attorney general's August 2026 release (403) could not be opened. Status rests on the Legislature's bill page and a September 2025 law-firm summary; neither shows a 2026 House vote.
- Supabase's Free-plan terms on commercial use were not found on its terms page.
- Supabase Pro availability of phone MFA vs authenticator-app MFA by plan; the page gives no plan information.
- Other states' breach statutes; the Michigan Insurance Data Security Act scope for Mastiff; Anthropic consumer-app retention.
- Supabase dashboard single sign-on is shown as Team only; the Pro column lists SAML SSO for end users of your app (50 monthly users included, then $0.015 each), which is a different thing.

## 8. Sources opened (all read 2026-10-27)

Michigan and federal law
- MCL 445.63 definitions (personal information, redact, encrypted, personal identifying information): https://www.legislature.mi.gov/Laws/MCL?objectName=mcl-445-63
- MCL 445.72 breach notice, maintainer duty, fines, no AG notice: https://www.legislature.mi.gov/Laws/MCL?objectName=mcl-445-72
- MCL 445.72a destruction of data (summary only): https://www.legislature.mi.gov/Laws/MCL?objectName=mcl-445-72a
- SB 360 (2025) status: https://www.legislature.mi.gov/Bills/Bill?ObjectName=2025-SB-0360
- SB 359/360 summary, 2025-09-09 (secondary): https://www.fisherphillips.com/en/news-insights/what-businesses-need-to-know-about-pending-consumer-privacy-and-identity-theft-legislation.html
- MCL 500.553, 500.555, 500.559 Insurance Data Security Act: https://www.legislature.mi.gov/Laws/MCL?objectName=mcl-500-553 (and -555, -559)
- MCL 600.5807 contract limitation period: https://www.legislature.mi.gov/Laws/MCL?objectName=mcl-600-5807
- MCL 445.1902 trade secret definition (read; not relied on above): https://www.legislature.mi.gov/Laws/MCL?objectName=mcl-445-1902
- 16 CFR 314.2 definitions: https://www.law.cornell.edu/cfr/text/16/314.2
- 16 CFR 314.4 safeguards, service providers, disposal, FTC notice: https://www.law.cornell.edu/cfr/text/16/314.4
- 16 CFR 314.6 small-institution exceptions: https://www.law.cornell.edu/cfr/text/16/314.6
- FTC business guidance on the Safeguards Rule: https://www.ftc.gov/business-guidance/resources/ftc-safeguards-rule-what-your-business-needs-know
- IRS record-keeping periods: https://www.irs.gov/businesses/small-businesses-self-employed/how-long-should-i-keep-records

Supabase
- Pricing and plan table: https://supabase.com/pricing
- Security page (SOC 2, ISO, encryption, report access): https://supabase.com/security
- Backups, PITR price, project deletion: https://supabase.com/docs/guides/platform/backups
- Regions: https://supabase.com/docs/guides/platform/regions
- Data residency and transfers FAQ (four out-of-region categories, support access): https://supabase.com/legal/privacy-resources/data-residency-and-transfers-faq
- DPA (sub-processors, 48-hour incident notice, deletion, encryption): https://supabase.com/legal/dpa
- Terms of service: https://supabase.com/terms
- Platform security (SSL not enforced by default, MFA enforcement): https://supabase.com/docs/guides/security/platform-security
- Row level security: https://supabase.com/docs/guides/database/postgres/row-level-security
- Shared responsibility model: https://supabase.com/docs/guides/deployment/shared-responsibility-model
- Auth MFA: https://supabase.com/docs/guides/auth/auth-mfa
- Compute prices: https://supabase.com/docs/guides/platform/compute-and-disk
- Sub-processor list landing page: https://supabase.com/legal/customer-resources/subprocessor-list
- Sub-processor list 2026-10-12 (extracted text): https://supabase.com/legal/subprocessor-list/October-12-2026.pdf
- Sub-processor list 2026-06-01 (extracted text): https://supabase.com/legal/subprocessor-list/June-1-2026.pdf

Vercel
- Fair use and commercial-use rule: https://vercel.com/docs/limits/fair-use-guidelines
- Pricing: https://vercel.com/pricing
- Security and compliance: https://vercel.com/docs/security/compliance
- Regions: https://vercel.com/docs/regions
- DPA: https://vercel.com/legal/dpa
- Privacy notice: https://vercel.com/legal/privacy-policy
- Sub-processor page (partial): https://security.vercel.com/?itemName=legal&itemUid=e3fae2ca-94a9-416b-b577-5c90e382df57

Resend and Anthropic
- Resend security: https://resend.com/security
- Resend DPA: https://resend.com/legal/dpa
- Resend sub-processors (page did not name Resend): https://resend.com/legal/subprocessors
- Resend pricing: https://resend.com/pricing
- Anthropic API data retention: https://platform.claude.com/docs/en/manage-claude/api-and-data-retention

Could not open: the eCFR Part 314 page (redirected to a block page), the Senate Fiscal Agency analysis of SB 360 (certificate error), the attorney general's August 2026 data-breach release (403), a Resend email-retention docs page (404).
