# CLAUDE.md — Mastiff app

Read this first. Two Claude sessions work on this repo: Claude Code on Devin's PC and Eris (Claude in the chat app, building in a cloud container). Git is the handoff. Pull before you start, push when a step is done, and say in the commit message what changed and what is next.

## What Mastiff is
Payment verification for small offices. The bookkeeper enters (or forwards) a payment request before it is keyed. Mastiff answers Pass or Hold with a one-line reason. On a hold, Mastiff staff call the vendor at the number already on file and log it. The office's second person records the decision. The office owns the verified vendor file and the log.

**Mastiff flags. Your firm makes every payment decision.** That sentence is on every screen and every report. Never remove it.

## Rules you can't break
1. **Rule zero: never slow the bookkeeper.** A hold is advice, never a block. The office can release anything on its own authority.
2. **Only three things hold on their own:** payee not on file, bank details changed, amount out of range. Off-hours and urgency wording are cautions; they never hold alone. The rules live in `src/lib/rules.ts` and stay plain, readable code. No ML in the verdict.
3. **Wording:** "would have held," "worth checking," "missing." Never "fraud," "scam," "you were hit."
4. **Data:** last four digits of any account, ever. The database rejects longer values; the importer cuts them. Never store a routing number or tax ID. Never ask for a bank login.
5. **AI reads; a person confirms the exceptions, and the pay screen is the check for the rest.** When intake arrives (step 3): a confident read of a bill from a vendor on file that passes the three rules goes straight into the pay run with no tap. The bookkeeper is asked to confirm only a low-confidence read, a new vendor, a hold, or an amount outside that vendor's pattern. The pay screen shows the extracted fields beside the invoice image, so the click on pay is the confirmation for everything that went straight through. Nothing the AI extracts is ever paid without a person having seen it on one of those two screens.
6. **Style:** black, white, one grey (#6B6B6B). Serif headings, Inter body. No gradients, icons, emoji, stock images. Reads like a bank or a law firm. Phone-first; the bookkeeper is on her phone.
7. **Freeze:** if it isn't in the roadmap below, write it in `LATER.md` and move on. Do not add features because they seem useful.

## Stack
Next.js 16 (App Router, TypeScript, Tailwind v4 via `@tailwindcss/postcss`), Supabase (auth, Postgres, RLS), Vercel. Production: https://mastiffdesk.com (Cloudflare DNS, bought Nov 5 2026; mastiff-app.vercel.app still works). Supabase project ref `udgnlvmmomketyudpgwb`. Vercel auto-deploys from `main`.

- No Node on Devin's PC; builds happen on Vercel. `tsconfig.json` excludes the folded-in folders (`site/`, `lookback/`, etc.) so their files never enter the app build. Push to `main` and check the Vercel deployment. Keep commits small so a broken build is easy to revert.
- Env vars (set in Vercel, never committed): `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `ANTHROPIC_API_KEY` (the invoice read; without it the upload still attaches and the form is filled by hand), optional `MASTIFF_MODEL`. Mail, all optional until the domain exists: `MASTIFF_INBOUND_SECRET` (must equal `webhook_secrets.inbound` in the database; the only way the session-less routes may write), `RESEND_API_KEY`, `RESEND_WEBHOOK_SECRET` (svix, from the Resend webhook), `MAIL_FROM`, `CRON_SECRET`. QuickBooks (step 7): `QBO_CLIENT_ID`, `QBO_CLIENT_SECRET`, `QBO_ENV` (sandbox until Intuit approves production); redirect URI `https://mastiffdesk.com/api/qbo/callback`. Never commit a key. Never use the service_role key anywhere in this app.
- Schema: `supabase/schema.sql` (tables, RLS), `supabase/002_invites.sql` (invites, `claim_invites()`), `supabase/003_lookbacks.sql`, `supabase/004_intake.sql` (intakes, invoice bucket), `supabase/005_mail.sql` (inbound_emails, notifications queue, hold/callback triggers, the secret-checked functions the no-session routes use), `supabase/006_queue_fn.sql` `supabase/007_connections.sql` (QuickBooks tokens, owner-only RLS; `requests.external_id`, `due_date`), `supabase/008_instructions.sql` (instructions; `vendors.pass_under`, `vendors.instructions`), `supabase/009_inbound_pass_under.sql`, `supabase/010_subs_partners.sql`, `011_my_org_ids_definer.sql`, `012_tighten_function_grants.sql`, `013_chat.sql` and `014_domain.sql` (inbound_email is `<slug>@mastiffdesk.com`; email links point at mastiffdesk.com) (certificate and waiver dates on vendors; partners, partner_members, `orgs.partner_id`; `my_org_ids()` now includes a partner's client offices; invites can carry a partner). All are applied to production. New schema changes go in a new numbered file under `supabase/` and get applied as a migration; do not edit the applied files.
- Auth: emailed sign-in link using the implicit flow from a server action (`src/lib/auth-actions.ts`), read client-side in `src/app/auth/callback/page.tsx`. This is deliberate: it makes the link work on a different device than the one that requested it. Do not switch back to PKCE. A 6-digit code replaces the link once custom SMTP (Resend) exists, which needs the domain.

## What is built (v1 Nov 3 2026; steps 1 to 10 Nov 4 2026, each waiting on its gate to be switched on and used)
- `/login`: email link sign-in.
- `/app`: office home (week count, holds waiting, vendors, verified count, recent).
- `/app` also carries step 4: "What Mastiff did", a feed built from the tables themselves (`src/lib/feed.ts`, never a separate log that can drift), each line opening the request; and a card into the Mastiff thread. On a passed request the office can "Turn into a hold" (`askForALook`), which is the take-over.
- `/app/vendors`: vendor file, add one, paste CSV import. Step 5 lives here too: `src/lib/memory.ts` works out each vendor's pattern from paid requests (10th to 90th percentile with room, cadence, sender domain) and the page offers it as a one-click usual range; it is never applied on its own.
- `/app/requests/new`: take a photo or upload a PDF (`InvoiceUpload`, shrunk on the phone, straight to the private `invoices` bucket), read by the model (`src/lib/intake.ts`), Rule 5 decides: straight into the log as `straight_through`, or parked in `intakes` and shown pre-filled for a tap. Or the four fields typed in. Home lists intakes waiting for a look.
- `/app/requests/[id]`: Pass/Hold stamp with reasons, the invoice image under the fields when there is one, callback log form (staff only), decision form (owner/approver only), vendor sidebar with last three payments.
- `/app/log` and `/app/log/export`: full log, holds filter, CSV with callbacks and decisions.
- `/app/settings`: cap, range multiple, payment hours, forwarding address (shown, not yet wired).
- `/app/lookback` and `/app/lookback/[id]`: upload a payment CSV, run the look-back in the app (TypeScript port of `lookback/`: rules 1 to 6 and the money findings; verified against the Python baseline by `src/lib/lookback/__tests__/port.test.ts`, run with `npx tsx`). Bank exports with no payee column (Chase-style "Description") work too: `bankdesc.py` / `bankdesc.ts` read the payee out of the description, merge city-suffixed variants, mark checks as payee-unknown, and deposits are skipped; `lookback/tests/fixtures/bank-export.csv` and `__tests__/bank.test.ts` hold the case. Report shows money worth checking first, then each flagged payment with a mark (to verify, verified fine, legitimate repeat, two different vendors, confirmed, recovered) and a note; marks are saved per office and are the training signal for vendor memory (step 5). Tables `lookbacks`, `lookback_marks` in `supabase/003_lookbacks.sql`.
- `/api/inbound`: Resend `email.received` webhook (signature verified). Fetches the email and first PDF/image attachment, stores it under `inbound/`, reads it, runs the rules in TypeScript, files through `receive_email()`: straight through, or an intake for a tap. No session, no service key; the functions check a shared secret.
- `/api/notify` and `/api/digest`: send the `notifications` queue through Resend (holds and callback results are queued by database triggers and flushed right after the action; the daily cron sweeps) and queue the Monday digest. `vercel.json` has the crons (Hobby plan: daily at most). Desk shows "Email in" and "Mail out".
- `/app/readout` (step 6): the day-30 read-out from the live tables (`src/lib/readout.ts`, a pure function with its own test): the numbers, every hold, the office's record against the nine carrier questions from `research/r1` (verbatim, with the not-advice and source lines), the 13 log fields, vendors verified by voice. Date range in the URL; `/app/readout/print` is the same page without the shell.
- `/app/settings` also carries step 7: Connect QuickBooks (owner only, Intuit OAuth, `/api/qbo/connect` and `/callback`), then "Pull vendors and unpaid bills" (`src/lib/qbo.ts`): vendors not on file are added (phone kept only if the office had none), each unpaid bill becomes a request with `source='qbo'` and `external_id` so it is never pulled twice. Only `query` is ever called; there is no write path.
- `/app/chat` (steps 4 and 8 together, Nov 5): one saved thread per office (`messages` table, `supabase/013_chat.sql`), phone-first bubbles. `converse()` in `src/lib/ask.ts` hands the model the office's records plus the last 12 turns; it answers a question, or turns an instruction into a proposal that `checkProposal` verifies and the owner confirms inline (`decideInThread`). The old `/app/instructions` page still exists for the record of proposals but is off the nav.
- `/app/instructions` (step 8, record only now): the owner or approver writes a sentence; the model maps it to one of seven settings (`src/lib/instructions.ts`: vendor pass-under, vendor usual range, vendor phone, vendor note, cap, multiple, hours); plain code checks the vendor exists and the numbers make sense; the page shows "Mastiff understood: …" and nothing is applied until Confirm. Anything else (skip a callback, release, pay) comes back "unclear". Confirmed and declined instructions appear in the feed. `pass_under` is honoured in `needsTap`; `vendors.instructions` shows on the request sidebar.
- `/app/subs` (step 9): mark vendors as subs, keep GL/WC/auto expiry, additional-insured and last-waiver dates (or paste the `pilot-kit` register), and `src/lib/subs.ts` (port of `lookback/subs.py`, tested) lists what is worth checking against paid requests: lapsed certificates, payments after a lapse, payments not covered by a waiver. A sub's request shows a one-line "before the next payment" caution; it never holds. `/app/log/positive-pay` is the CSV the office uploads to its bank itself.
- `/partner` (step 10): a partner firm's people see every attached client office (holds across all, per-office counts) and open one with `/app/switch?org=`, which sets the office cookie `requireOrg` reads. Partner people appear in each client office as a bookkeeper through `my_org_ids()`. Desk: add a firm, attach an office, invite a firm's person (`role='partner'`).
- `/desk`: staff only. All open holds across offices oldest first with the one-hour window flagged; add office; invite person; people list.
- Roles: `staff` table = Mastiff's people. `memberships.role` = owner | bookkeeper | approver. Invites are claimed on login by `claim_invites()`.

## The product in one line
**"You don't think about accounts payable until it's time to hit pay."** Bills reach Mastiff without keying, Mastiff reads and checks them, calls when a call is needed, and the owner's job is one click. Autonomous by the third office, not before the first: the manual desk (what is built today) is sold now, and each roadmap step replaces one thing Devin does by hand, built on real invoices from real offices. The owner never sees the difference.

## Roadmap (build in this order; stop after each and show Devin)
| # | Step | What the office gets | Gate to start |
| --- | --- | --- | --- |
| 1 | Domain, email, forwarding address | Bookkeeper forwards or auto-forwards invoices to `<slug>@mastiffdesk.com`; a request with `source='email'` and the raw email appears for staff to enter. Resend as custom SMTP so sign-in uses a 6-digit code | Domain bought |
| 2 | Hold notifications and Monday digest | Email (later SMS) to bookkeeper and approver when a hold is logged and when the callback result lands; a Monday digest. Silence means Pass | Step 1 |
| 3 | AI intake | Three doors in, one read: a forwarded email, an uploaded PDF, or a photo taken on the phone (camera button on the request page). The image stays attached to the request (private bucket, office and staff only) so the pay screen can show it beside the extracted fields; the read flags when a full account number is printed, and only the last four are ever stored. The invoice is read (hosted Claude model via the API, called from the app; per-office memory in Supabase, never in the model) and the request pre-filled. Rule 5 below decides when a tap is needed | One office forwarding real invoices |
| 4 | Activity feed and questions | Every action Mastiff took, visible live on the office home, each one overridable or taken over by the office. Beside it, a question box: "Why did this hold?" "What did the callback say?" "What did we pay Pinecrest this year?" The model reads the office's own tables and answers; it changes nothing | Step 3 |
| 5 | Vendor memory | Each vendor's normal pattern (amount range, cadence, sender domain) learned from history; `usual_min/max` become suggestions | 200+ real requests |
| 6 | Day-30 read-out | Printable renewal packet per office: requests, holds, callbacks, vendors verified by voice, mapped to the carrier questions in `pilot-kit/` | First pilot at day 25 |
| 7 | QuickBooks Online, read only | Bills and vendors pulled in with the owner's own login (OAuth). Nothing written back. Xero, Gmail and Microsoft 365 read connections follow the same pattern later | Second paying office asks |
| 8 | Instructions to Mastiff | "Always pass Metro Fasteners under $500." "Pay discount invoices on day 9." The model proposes a per-office setting, the owner confirms it, the feed records it; the model never changes a rule on its own | Step 5 |
| 9 | Construction add-ons | Certificate expiry, lien waiver gaps, positive pay export (the office uploads it; Mastiff never sends to a bank) | A construction office in a pilot |
| 10 | Partner portal | A bookkeeping firm sees all its client offices in one view | First white-label firm signs |

Later, year two if ever: voice callbacks, QuickBooks Desktop, write-back to any books system. Never: bank credentials, a release button, a pricing page before five clients, deception features, AI-written-text detection.

Calls: Mastiff suggests when and whom to call (vendor, number on file, last invoices, best time); a person dials and records who answered, what was said, outcome, and their name.

## Wiring
Everything on the roadmap is built; `WIRING.md` lists the keys and accounts that switch each part on, in order. Read it before telling Devin something is "not working": it is usually a key not yet set.

## Working with Devin
He is 16, learning to code, on his phone most of the time. Stop after each step and show him, in plain words, what changed and what he'd say to an owner about it. One step at a time; he has said "you did too much" when handed a wall. Never send email on his behalf without showing him the draft. Keep the app something he can demo on his phone in two minutes: Pass, Hold, callback, decision, CSV.

## From the foundation repo (October 2026), folded in 2026-11-04
The research, pilot kit, static site and look-back tool were built in a separate repo before this app existed. They now live here, alongside the app, and nothing in `src/` or `supabase/` depends on them:

- `plans/`: the product definition (`product.md`), the decision log (`decisions.md`), the October plans and working files.
- `research/`: insurer requirements and the 13 log fields (r1), competitor teardown (r3), verified statistics (r4), Mastiff's own exposure (r5), and `app-brief-2026-11-04.md`, the hand-off brief written for this app.
- `pilot-kit/`: operations manual, six service sheets, bookkeeper sheet, incident playbook, call script, agreement draft (lawyer first), the 14 printables.
- `site/`: the finished five-page marketing site as static HTML, to port into the app.
- `wall-demo/`: the static demo of the check, holds and log; reference only.
- `lookback/`: the Python look-back scan and day-30 read-out, 86 tests. The reference the TypeScript port must match; the fixture in `lookback/tests/fixtures/` has the planted patterns.

The 2026-11-04 entries in `plans/decisions.md` were reconciled with Devin the same morning and are now in the roadmap above (intake at 3, activity feed at 4, talk to Mastiff at 8, QuickBooks read-only at 7, hosted model, owner's-login-only connections). One entry was changed: "fully autonomous before selling begins" became "autonomous by the third office, not before the first." Rule 5 is the confirm-on-exception version above. The roadmap in this file is the single plan; `plans/decisions.md` records why.

### The October rules, kept for the record
1. Rule zero: never slow the bookkeeper.
2. Only three things hold on their own: payee not on file, bank details changed, amount out of range. Off-hours and urgency language are cautions.
3. Wording: "would have held," "worth checking," "missing." Never "fraud," "you were hit," "illegal," "caught," "prevented," "saved." Never state what an insurer requires. Every verdict says: "Mastiff flags. Your firm makes every payment decision."
4. Last 4 digits of any account or tax ID, never more.
5. AI reads, a person confirms. Superseded 2026-11-04 by Rule 5 above (confirm on exception; the pay screen is the check for the rest).
6. Style: black, white, one grey (#6B6B6B); serif headlines, Inter body; no gradients, icons, emoji, stock images, fake logos or testimonials.
7. Freeze: if it isn't in a plan, write it in `LATER.md` and move on.
