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
Next.js 16 (App Router, TypeScript, Tailwind v4 via `@tailwindcss/postcss`), Supabase (auth, Postgres, RLS), Vercel. Production: https://mastiff-app.vercel.app. Supabase project ref `udgnlvmmomketyudpgwb`. Vercel auto-deploys from `main`.

- No Node on Devin's PC; builds happen on Vercel. `tsconfig.json` excludes the folded-in folders (`site/`, `lookback/`, etc.) so their files never enter the app build. Push to `main` and check the Vercel deployment. Keep commits small so a broken build is easy to revert.
- Env vars (set in Vercel, never committed): `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`. Never commit a key. Never use the service_role key anywhere in this app.
- Schema: `supabase/schema.sql` (tables, RLS), `supabase/002_invites.sql` (invites, `claim_invites()`) and `supabase/003_lookbacks.sql`. All are applied to production. New schema changes go in a new numbered file under `supabase/` and get applied as a migration; do not edit the applied files.
- Auth: emailed sign-in link using the implicit flow from a server action (`src/lib/auth-actions.ts`), read client-side in `src/app/auth/callback/page.tsx`. This is deliberate: it makes the link work on a different device than the one that requested it. Do not switch back to PKCE. A 6-digit code replaces the link once custom SMTP (Resend) exists, which needs the domain.

## What is built (v1, Nov 3 2026)
- `/login`: email link sign-in.
- `/app`: office home (week count, holds waiting, vendors, verified count, recent).
- `/app/vendors`: vendor file, add one, paste CSV import.
- `/app/requests/new`: four fields, "Check it".
- `/app/requests/[id]`: Pass/Hold stamp with reasons, callback log form (staff only), decision form (owner/approver only), vendor sidebar with last three payments.
- `/app/log` and `/app/log/export`: full log, holds filter, CSV with callbacks and decisions.
- `/app/settings`: cap, range multiple, payment hours, forwarding address (shown, not yet wired).
- `/app/lookback` and `/app/lookback/[id]`: upload a payment CSV, run the look-back in the app (TypeScript port of `lookback/`: rules 1 to 6 and the money findings; verified against the Python baseline by `src/lib/lookback/__tests__/port.test.ts`, run with `npx tsx`). Report shows money worth checking first, then each flagged payment with a mark (to verify, verified fine, legitimate repeat, two different vendors, confirmed, recovered) and a note; marks are saved per office and are the training signal for vendor memory (step 5). Tables `lookbacks`, `lookback_marks` in `supabase/003_lookbacks.sql`.
- `/desk`: staff only. All open holds across offices oldest first with the one-hour window flagged; add office; invite person; people list.
- Roles: `staff` table = Mastiff's people. `memberships.role` = owner | bookkeeper | approver. Invites are claimed on login by `claim_invites()`.

## The product in one line
**"You don't think about accounts payable until it's time to hit pay."** Bills reach Mastiff without keying, Mastiff reads and checks them, calls when a call is needed, and the owner's job is one click. Autonomous by the third office, not before the first: the manual desk (what is built today) is sold now, and each roadmap step replaces one thing Devin does by hand, built on real invoices from real offices. The owner never sees the difference.

## Roadmap (build in this order; stop after each and show Devin)
| # | Step | What the office gets | Gate to start |
| --- | --- | --- | --- |
| 1 | Domain, email, forwarding address | Bookkeeper forwards or auto-forwards invoices to `<slug>@requests.<domain>`; a request with `source='email'` and the raw email appears for staff to enter. Resend as custom SMTP so sign-in uses a 6-digit code | Domain bought |
| 2 | Hold notifications and Monday digest | Email (later SMS) to bookkeeper and approver when a hold is logged and when the callback result lands; a Monday digest. Silence means Pass | Step 1 |
| 3 | AI intake | Three doors in, one read: a forwarded email, an uploaded PDF, or a photo taken on the phone (camera button on the request page). The image stays attached to the request so the pay screen can show it beside the extracted fields; a full account number visible in the image is masked on display and never stored. The invoice is read (hosted Claude model via the API, called from the app; per-office memory in Supabase, never in the model) and the request pre-filled. Rule 5 below decides when a tap is needed | One office forwarding real invoices |
| 4 | Activity feed and questions | Every action Mastiff took, visible live on the office home, each one overridable or taken over by the office. Beside it, a question box: "Why did this hold?" "What did the callback say?" "What did we pay Pinecrest this year?" The model reads the office's own tables and answers; it changes nothing | Step 3 |
| 5 | Vendor memory | Each vendor's normal pattern (amount range, cadence, sender domain) learned from history; `usual_min/max` become suggestions | 200+ real requests |
| 6 | Day-30 read-out | Printable renewal packet per office: requests, holds, callbacks, vendors verified by voice, mapped to the carrier questions in `pilot-kit/` | First pilot at day 25 |
| 7 | QuickBooks Online, read only | Bills and vendors pulled in with the owner's own login (OAuth). Nothing written back. Xero, Gmail and Microsoft 365 read connections follow the same pattern later | Second paying office asks |
| 8 | Instructions to Mastiff | "Always pass Metro Fasteners under $500." "Pay discount invoices on day 9." The model proposes a per-office setting, the owner confirms it, the feed records it; the model never changes a rule on its own | Step 5 |
| 9 | Construction add-ons | Certificate expiry, lien waiver gaps, positive pay export (the office uploads it; Mastiff never sends to a bank) | A construction office in a pilot |
| 10 | Partner portal | A bookkeeping firm sees all its client offices in one view | First white-label firm signs |

Later, year two if ever: voice callbacks, QuickBooks Desktop, write-back to any books system. Never: bank credentials, a release button, a pricing page before five clients, deception features, AI-written-text detection.

Calls: Mastiff suggests when and whom to call (vendor, number on file, last invoices, best time); a person dials and records who answered, what was said, outcome, and their name.

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
