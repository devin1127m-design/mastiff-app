# MASTIFF — Phase 2 build plan (pilot-ready)

Tell Claude Code: "Read PLAN.md and PLAN-2.md. Start at Step 0. Stop after each step and show me."
Only start this after Phase 1 (PLAN.md) is finished through Step 5.

## Where we are
Phase 1 (PLAN.md) is in production: marketing site, pilot form, Wall app v1 with the four hold rules.
Phase 2 is NOT new features. It is everything that has to be true before one real office can run its payments through Mastiff for 30 days, and before we can show them what it caught on day 31.

Rule for the whole plan: if a step tempts you to add something that isn't listed here, don't. Write it in `LATER.md` and move on.

## Rule zero — never slow the bookkeeper
Mastiff is advisory. If it ever makes paying a legitimate bill slower or harder, the office stops using it and we lose. Every step below is checked against these:
- **Mastiff never blocks a payment.** A HOLD can always be overridden by the approver with a one-line reason. The firm makes every payment call. Overrides are logged, never prevented.
- **A request takes two minutes or less.** At most six required fields: payee, amount, request type, bank, last 4, how it arrived. Everything else optional. Works on a phone.
- **PASS is silent.** No extra step, no notification, just a log line.
- **Only three things hold on their own:** payee not on file, bank details changed, amount out of range. Off-hours and pressure language show as a caution on the ticket; they hold only when combined with one of the three.
- **Nothing holds twice for the same reason.** A hold released after a callback updates the file: the new bank details or the new vendor are now known. Next time it passes.
- **Known vendors pass from day one.** Vendor import (Step 1) happens before the bookkeeper is invited, never after.
- **Resolving a hold takes four fields:** who called, which number, what the vendor said, outcome, plus the approver's name. Nothing else.
- **No interruptions.** One Monday digest. Notifications only when a hold is open past 24 hours.
- **Never re-key what they already have.** Vendors come in by import. Full account numbers are never asked for.
- **Tune before adding.** If more than 1 in 10 requests holds in a week, loosen that org's thresholds in the weekly review before touching anything else.

---

## Step 0 — Audit (read only, change nothing)
Read the repo and report against PLAN.md, one line each, marked SHIPPED / PARTIAL / MISSING:
- 5 marketing pages; pilot form → `leads` table + email to Devin
- Auth (magic link); roles owner / client admin / bookkeeper; invite by email
- Tables `orgs`, `members`, `vendors`, `requests`; RLS on every table
- Rules engine as a pure function with unit tests; the four rules
- Dashboard: list, filter, resolve, monthly counts
- Deploy: Vercel URL, custom domain yes/no, env vars present, which domain Resend sends from
List anything PARTIAL or MISSING as the first fixes. Stop and show me before touching code.

## Step 1 — Vendor seeding (the day-one failure)
With an empty vendor table every payee is "new", every request holds, and the bookkeeper stops using it inside a week. Fix this before anyone is invited.
- CSV import of vendors per org: columns `name`, `bank_last4` (optional), `phone_on_file` (optional). Accept a vendor export from QuickBooks, Xero or a plain spreadsheet; match headers loosely; show a preview before commit; dedupe on a normalized name (lowercase, strip punctuation and LLC/Inc/Co).
- Vendors imported this way are `known`. A vendor added while resolving a hold is also `known`.
- Settings per org: payment hours (default Mon–Fri 7am–7pm in the org's timezone) and the single-payment line (default $5,000, used until a vendor has 90-day history).
- "Payee not on file" reasons show the closest known name, so a misspelling is obvious: `not on file (closest: Acme Supply LLC)`.
- Test: import a 200-row CSV; request against an imported vendor → PASS; against a misspelling → HOLD with the closest-match hint.

## Step 1b — Look-back scan: have they been hit before?
The same import that seeds vendors can carry payment history. Run Mastiff's rules backwards over it, roughly the last 600–700 payments (12–24 months for a small office), and show the office every payment that would have held. This is the day-one deliverable and the reason an office says yes.
- Input: a CSV of past payments from QuickBooks, Xero or the bank: `date`, `payee`, `amount`, and when present `method`, `check_or_ref`, `invoice_no`, `memo`, `account_last4`. Match headers loosely; preview before commit. Strip anything longer than 4 digits that looks like an account number on import.
- The checker is a pure function with unit tests, same engine as the live rules. It flags, in order of weight:
  1. Same vendor paid to a different account (last 4 or routing changed between payments) — the bank-change pattern
  2. A payee paid once and never again, especially a round amount or a first payment over the line
  3. Duplicate payment: same vendor and amount within 14 days, or the same invoice number twice
  4. Lookalike vendors: two vendor records whose normalized names nearly match (Acme Supply / Acme Supply LLC / Acme Suply)
  5. Amount out of range: over 2× that vendor's trailing average, or over the payment line
  6. Clusters just under the approval line (several payments at $4,900 when the line is $5,000)
  7. Payments with no matching bill, when both a bank file and an AP file are loaded
- Output: a **Look-back report** per org: a summary line ("640 payments, 18 months, 11 would have held, 3 need a call this week"), then a table — date, payee, amount, rule(s), what to check — sorted by weight, with a status column the office fills in: to verify / verified fine / confirmed loss. CSV and print-ready.
- Wording is strict: every flag says **"would have held"** and what to check. The report never says "fraud" or "you were hit." The office makes the call to the vendor and decides. A confirmed loss is recorded only when they mark it.
- Rerun is one click after a new import. The look-back also seeds the baselines in Step 3 so nothing is imported twice.
- Test: a 700-row fixture with 9 planted patterns (one of each above, plus two clean look-alikes that must NOT flag). All 9 found, 0 false flags on the clean rows.

## Step 2 — Hold resolution that proves something
A hold is only worth anything if closing it leaves a record a CPA or an insurer would accept. v1 "resolve with a note" is not enough. Replace it:
- Closing a hold requires: callback made to the phone **on file** (never the number in the email) — who called, which number, what the vendor said; a second person's name (approver ≠ submitter); and an outcome: `released` (legit), `rejected` (fraud or could not verify), `void` (duplicate / mistake).
- `rejected` is the headline number. Store `fraud_confirmed` (bool) and `amount_protected`.
- Reasons on every verdict in plain English, one line each. Every verdict screen carries: "Mastiff flags. Your firm makes every payment decision."
- The app never accepts more than the last 4 digits of an account number. Validate length; reject anything longer.

## Step 3 — Weekly review and the audit trail
The pilot promise is "we review holds with you weekly." Build what that review runs on.
- `/review` per org: this week's requests, holds and outcomes, still-open holds with their age, and five numbers — checked, holds, released, rejected, median hours to resolve. Same five numbers for the pilot to date.
- Monday 7am digest (Resend) to the org admin and Devin: those numbers plus the open holds. Plain text, no images.
- CSV export of the full request log per org, including every resolution field. This is the office's audit trail; it is theirs to take when the pilot ends.

## Step 4 — Production hardening
- Custom domain on Vercel. Resend sends from a subdomain (`mail.<domain>`) with SPF, DKIM and DMARC so magic links and digests do not land in spam. Test delivery to a Gmail address and to an Outlook/M365 address — small offices run M365.
- RLS tests that run in CI: a user in org A cannot read or write org B's vendors, requests or members. Fail the build if they can.
- Pilot form: rate limit + honeypot. `leads` readable by owner only.
- Error monitoring (Sentry free tier) and an uptime check on `/` and `/app`. Alerts to Devin's email.
- Backups: state the current Supabase tier's backup policy in README. If free tier, add a nightly `pg_dump` GitHub Action to private storage; otherwise the Step 3 CSV export is the documented fallback. Upgrade to Supabase Pro before the first paid client.
- Legal pages: complete privacy and terms, no "stub" — what we store (payee, amount, last 4, who submitted and resolved), that we never hold full account numbers, that Mastiff is advisory, data export and deletion on request, Oxford, Michigan.
- Lighthouse ≥ 90 on mobile for the marketing pages still holds after all of this.

## Step 5 — Hand back: the 20-minute onboarding
Update README with a runbook Devin follows on a call with an office:
1. Create the org; set timezone, payment hours, payment line.
2. Invite the client admin and the bookkeeper (magic link).
3. Import the vendor CSV and the payment history; confirm the counts with them.
4. Run the look-back. Walk the report together on the first call: what would have held, what to check this week.
5. Submit one test request each: known vendor, normal amount (PASS); bank change (HOLD); new payee (HOLD). Resolve one hold end to end.
6. Confirm the Monday digest is scheduled for them.
Then stop. No new features until pilot users exist and Devin says go.

---

## Later — write down, do not build
- AI intake: the bookkeeper forwards the request email to a per-org address; a model extracts payee, amount, bank and request type and pre-fills the form for a human to confirm. It never auto-submits. Gated until pilot users exist.
- Sender check (ships with AI intake): sender address vs the one on file, lookalike domains, display-name/address mismatch, reply-to mismatch, a new address inside an old thread. No AI-written-text detection — it would hold real invoices.
- QuickBooks / Xero / Gmail / M365 integrations. Pricing page. Trap / deception mode.
- Colors, animations, testimonials, or logos that aren't real.
