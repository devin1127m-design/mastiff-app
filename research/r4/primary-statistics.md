# R4: Primary-source verification of Mastiff statistics

Researched 2026-10-25. Method: PDFs downloaded and text-extracted (IC3, FinCEN, AFP key highlights); web pages read through a fetch tool (Certos, CFC, SeedPod, AFP release), so those quotes passed through a summarizer and should be re-checked against the live page before publishing. Page numbers: "p." is the printed page number; PDF page is noted where it differs.

## Verdict table

| # | Statistic | Verdict | Primary source | Page / date |
|---|---|---|---|---|
| 1a | BEC 2025: 24,768 complaints, $3,046,598,558 losses | confirmed | FBI IC3 2025 Internet Crime Report | pp. 25-26 |
| 1b | BEC 2024: 21,442 complaints, $2,770,151,146 (2025 is +10.0%) | confirmed | same | pp. 25-26 |
| 1c | BEC is #2 crime type by loss (after investment) | confirmed | same | p. 9 chart |
| 1d | BEC wire vs ACH split; small business | unsupported (not in report) | same | n/a |
| 2a | 76% of orgs hit by attempted/actual payments fraud (2025 data) | confirmed | AFP 2026 Key Highlights (summary, not full report) | p. 4, Apr 2026 |
| 2b | BEC 74% of orgs (2025) vs 63% (2024) | confirmed, with base caveat | AFP 2026 | p. 3, p. 8, p. 7 |
| 2c | Payment methods hit: checks 58%, ACH debit 30%, wire 25% | confirmed | AFP 2026 | p. 5 |
| 2d | Vendor impersonation share | 2024 data only: 60% of respondents; 2025 data is members-only | AFP 2025 Key Highlights | p. 2 (PDF p. 6), Apr 2025 |
| 3a | Manufacturing and construction most-targeted sector | corrected: true for 2017 and 2018 only (20% / 25% of incidents), report dated July 2019 | FinCEN Financial Trend Analysis | p. 3 (PDF p. 4); p. 1 |
| 3b | Average fake vendor invoice is $125,000 | corrected to $125,439 average for BEC "impersonating a vendor or client invoice", 2017-2018 SAR sample | same | p. 5 (PDF p. 6) |
| 4 | Certos: 81% saw AI fraud attempt; half confident; n=230 | confirmed (vendor survey; large firms) | Certos / Early Warning press release | Oct 8, 2026 |
| 5 | CFC $93,425 loss; callback policy not followed | confirmed (case is from 2019) | CFC case study | Nov 5, 2019 |
| 6 | Insurers require callbacks + two approvers and deny claims when skipped | corrected: "may deny" when a required verification is skipped; "two approvers" not stated; no primary cited | SeedPod Cyber (broker, secondary) | "Updated September 2026" |
| 7 | Small-business-specific 2025-26 primary data | none found that fits; see item 7 | n/a | n/a |

## 1. FBI IC3 2025 Internet Crime Report

URL: https://www.ic3.gov/AnnualReport/Reports/2025_IC3Report.pdf (66 pages; printed page = PDF page). Publication date not stated in the extracted text; confirm on the ic3.gov landing page.

- p. 26, "Three Year Complaint Loss Comparison": `BEC $3,046,598,558  $2,770,151,146  $2,946,830,270` (2025, 2024, 2023).
- p. 25, "Three Year Complaint Count Comparison": `BEC 24,768 21,442 21,489`.
- p. 9, "Top 5 Cyber-Enabled Fraud Crime Types by Loss": Investment $8,648,617,756; BEC $3,046,598,558; Tech Support $2,134,675,818; Confidence/Romance $929,287,469; Government Impersonation $797,943,193. BEC is not in the top 5 by complaint count (p. 9).
- p. 9 (headline): 1,008,597 complaints and $20.877 billion total losses in 2025, up 26% (accessibility text, p. 4 block); p. 3 director letter: investment fraud "followed by business email compromises and tech support scams".
- p. 39 (AI): "In 2025, businesses reported losses over $30 million to BEC scams involving AI."
- p. 10 definition (App. B): "BEC is a scam targeting businesses or individuals working with suppliers and/or businesses regularly performing wire transfer payments."
- Real estate is a separate crime type: 12,368 complaints (p. 25), $275,110,419 (p. 26). Not part of the BEC row. Construction is not broken out.
- Wire vs ACH: p. 8 shows overall transaction types ("Wire Transfer/ACH" combined) for all complaints, not BEC-specific. p. 17 notes BEC used to dominate FFKC recovery cases but ACH account-takeover and tech-support cases rose in 2025. No BEC-by-payment-rail figure.
- Michigan: p. 29 ranks Michigan 16th by total complaint loss, $381,068,131 (all crime types, not BEC).

Verdict: confirmed for all BEC counts and dollars. Wire/ACH, construction, small business: unsupported by this report.

## 2. AFP Payments Fraud and Control Survey

AFP 2026 (data year 2025), "Key Highlights" summary, April 2026, 465 respondents, fielded January 2026 (p. 2). Fetched from the Truist-hosted copy: https://www.truist.com/content/dam/truist-bank/us/en/documents/info/cci/2026-afp-payments-fraud-control-survey-report-key-highlights.pdf. AFP release: https://www.financialprofessionals.org/about/learn-more/press-releases/Details/over-75-percent-of-us-firms-experienced-payments-fraud-in-2025-while-ai-adoption-for-fraud-mitigation-lags (April 14, 2026). The full report is members-only ($295); not read. AFP is the research owner; Truist underwrites it.

- p. 4: "Seventy-six percent of organizations report that they experienced actual or attempted payments fraud activity in 2025." Orgs under $1B revenue: 67%; $1B+: 81%.
- p. 3: "BEC affected 74% of organizations in 2025, representing a significant increase from 2023 and 2024. Fraudsters primarily impersonate vendors or executives to request changes to payment instructions."
- Base caveat: p. 8 says "nearly 75% of organizations experienced email or BEC fraud" under the label "Percent of Organizations Experiencing Payments Fraud", and p. 7 gives "BEC/Fraudulent email 70%" for the same base. The 74% is therefore probably a share of fraud-affected organizations, not all organizations. Do not write "74% of all companies".
- p. 5: "Checks were the most frequently reported payment method subject to fraud (58% of organizations), followed by ACH debits (30%) and wire transfers (25%)."
- p. 10 (PDF p. 13): "49% of fraud via email in 2025 were made using wire transfers, a decline from 63% in 2024"; ACH debits 34%, checks 33%, ACH credits 31%, real-time payments 6%.
- p. 7 (sources table): invoice fraud 26%; manipulated ACH or wire transfer instructions 33%.
- p. 12 (PDF p. 15): 96% have policies to verify changes to invoices/bank details (58% rate them very effective); 94% verify by calling a contact using a number from official records (63% very effective, the highest rated).
- p. 3: smaller orgs (<$1B): "48% ... incurred a loss, and 24% of these companies were unsuccessful in recouping any funds lost." Quote: "Smaller organizations experience payments fraud less frequently, but when fraud succeeds, they are far more likely to absorb the full financial loss."
- Vendor impersonation: 2026 summary has no percentage; only the qualitative p. 3 sentence above. From AFP 2025 Key Highlights (April 2025, 521 respondents; data year 2024; https://truist.com/content/dam/truist-bank/us/en/documents/info/cci/2025-afp-payments-fraud-control-survey-report-key-highlights.pdf), p. 2: "Incidence of vendor imposter fraud was also high, at 45%, a sharp increase from 34%"; "Vendor impersonation experienced a slight increase, cited by 60% of respondents"; BEC "cited by 63% of respondents"; 79% had attempted/actual fraud; wires "reported by 63% of respondents" as the BEC-targeted method.

Verdict: confirmed as stated above. 2026 "targeted via BEC" and vendor-impersonation shares: confirmed only for the caveated or 2024 figures.

## 3. FinCEN Financial Trend Analysis (BEC)

Title: "Manufacturing and Construction Top Targets for Business Email Compromise", dated July 2019. Data: SARs filed 2016-2018; narrative samples from 2017 and 2018.

- p. 1 (PDF p. 2): "Manufacturing and construction was the most targeted sector in both 2017 and 2018, representing 20 percent of all analyzed transactions in 2017 and 25 percent in 2018."
- p. 3 (PDF p. 4): "Manufacturing and construction businesses were the top targeted sector for BEC fraud in 2017 and 2018, accounting for 20 percent of all reported BEC incidents in 2017 (with an average fraudulent transaction amount of $53,728), and 25 percent in 2018."
- p. 5 (PDF p. 6): "The average transaction amount for BECs impersonating a vendor or client invoice was $125,439, compared with $50,373 for impersonating a CEO. Despite representing 30 percent of total transactions, BEC fraud using a fraudulent vendor invoice accounted for 41 percent of total transaction amounts."
- p. 4: real estate had "the highest average fraudulent transaction amount of $179,001"; fraudulent vendor or client invoices grew from 30% (2017) to 39% (2018) of incidents, the most common method (p. 5).

Verdict: sector claim confirmed only as a 2017-2018 finding. $125,000 corrected to $125,439, and the figure is an average over invoice-impersonation BEC transactions in the FinCEN sample, not an "average fake vendor invoice" and not specific to small offices. The same report gives $53,728 for manufacturing/construction in 2017, so pairing "#1 sector" with "$125,000" overstates it. Data is 7-8 years old.

## 4. Certos survey (vendor survey)

URL: https://www.prnewswire.com/news-releases/ai-deepfakes-target-corporate-americas-multi-bank-blind-spot-302898894.html. Dateline NEW YORK, Oct. 8, 2026. Conducted by Accelerant Research in partnership with Early Warning Services, LLC (owner of Zelle, which backs Certos).

- "81% of corporate financial leaders surveyed say their company experienced attempted fraud" involving AI-generated or AI-enhanced content in the past year.
- "just 50% of CFOs and senior finance leaders are very or extremely confident" in identifying an AI fraud attempt before funds move.
- Sample: "230 qualified senior executives" (CFOs, Treasurers, Controllers, Heads of Finance) at Fortune 500 corporations, venture-backed growth companies and Forbes Top 100 non-profits; fielded online Aug 7-21, 2026.

Verdict: confirmed. Caveats: vendor-sponsored; respondents are not only CFOs/treasurers and are at large organizations, not small offices; "only half are very or extremely confident" is stricter than "half are confident". Release footnote oddly calls it "consumer research".

## 5. CFC cyber claims case study

URL: https://www.cfc.com/en-us/resources/case-studies/cyber-claims-case-study-subcontractor-scam. Published Tuesday, November 5, 2019.

- "the full $93,425 being transferred to the fraudulent account" after finance updated a subcontractor's bank details.
- Policy: staff were told "all requests for account changes should be followed up with a call to an individual at the company requesting the changes"; the finance employee skipped this step.
- Insured: "a small construction firm with revenues below $50 million."

Verdict: confirmed. Note it is an insurer's anonymised case, 2019, and says "skipped", which supports "nobody made the call". Do not present as recent.

## 6. SeedPod Cyber

URL: https://seedpodcyber.com/social-engineering-funds-transfer-fraud-cyber-insurance/. Page says "Updated September 2026"; no original date. SeedPod is a cyber insurance broker (secondary, commercial).

- "If the employee skipped the verification step, coverage may be denied."
- FAQ: denials can result from "failure to meet verification conditions the policy required, such as call-back confirmation of payment changes."
- Dual authorization "is a common policy condition"; verification typically means "a second confirmation through a separate communication channel."
- It never says insurers "require two approvers". It cites no carrier, policy form or court ruling for skipped-verification denials. Its only external number (about $2.77 billion BEC loss in 2024, no link) matches IC3 p. 26.

Verdict: corrected to "may deny", conditions vary by policy. Mark any use [secondary].

## 7. Small-business-specific primary data, 2025-2026

- FTC Consumer Sentinel (press release June 2026, https://ftc.gov/news-events/news/press-releases/2026/06/ftc-data-show-people-reported-losing-3-point-5-billion-imposter-scams-2025): consumer reports; business-impersonation losses near $1 billion are consumers deceived by fake businesses, not business victims. Read via search summary only. Not usable.
- AFP 2026 revenue split (above) is the closest primary data: orgs under $1B revenue are still mid-sized, not small offices.
- Nacha (https://www.nacha.org/news/business-email-compromise-attempts-rose-sharply-2025-report-finds, May 13, 2026) restates AFP: [secondary]. Nacha rule dates (fraud monitoring by originators, March 20 and June 22, 2026) appear in AFP 2026 p. 13; primary rule text at nacha.org not read.
- Michigan AG: April 15, 2026 alert on tax scams targeting small and mid-sized businesses (https://www.michigan.gov/ag/news/press-releases/2026/04/15/ag-nessel-reissues-business-tax-scams-alert); not BEC. No Michigan State Police BEC loss data found.
- SBA, Federal Reserve: nothing 2025-26 on payments fraud among small businesses surfaced.

## Proposed site copy

- 81%: "In an Aug 2026 survey of 230 senior finance executives at large organizations, 81% said their company had faced an AI-enabled fraud attempt in the past year, and only 50% were very or extremely confident they could spot one before money moved. (Certos / Early Warning Services)"
- #1 sector + $125,000: replace both with IC3: "The FBI logged $3.05 billion in business email compromise losses in 2025, the second-largest cybercrime category after investment fraud." If keeping FinCEN: "FinCEN's 2017-2018 analysis found manufacturing and construction was the most-targeted sector, and invoice-impersonation scams averaged $125,439 per transaction."
- $93,425: "A small construction firm lost $93,425 when a subcontractor's bank details were changed without the call-back its own policy required. (CFC claims case, 2019)"
- Insurers deny: "Some cyber policies make a call-back or second confirmation a condition of social-engineering cover, so skipping it can put a claim at risk; check your policy wording." [secondary: SeedPod, Sept 2026; cite policy wording if possible]

## Gaps

- AFP 2026 full report (members-only): no 2025 vendor-impersonation share, no BEC base definition for the 74%, no size cut below $1B. Buy the report ($295) or ask AFP.
- IC3: report publication date, any BEC-by-payment-rail or business-size figure, construction/real-estate BEC split: not found. Michigan BEC-only figure not extracted (p. 29 is all-crime).
- No primary 2025-26 small-business fraud dataset found (SBA, Federal Reserve Small Business Credit Survey fraud items, FTC business-victim data not checked in the raw data book).
- No insurer policy form or regulator source for "denied when skipped"; ask a carrier or broker for sample policy wording.
- Web-page quotes (Certos, CFC, SeedPod, AFP release) came via a fetch summarizer, not raw HTML; re-verify before launch.
- FinCEN and CFC figures are 2017-2019 vintage; no refreshed equivalent found.
