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
5. **AI reads, a person confirms.** When intake arrives (v2), nothing the AI extracts is saved until the bookkeeper confirms it.
6. **Style:** black, white, one grey (#6B6B6B). Serif headings, Inter body. No gradients, icons, emoji, stock images. Reads like a bank or a law firm. Phone-first; the bookkeeper is on her phone.
7. **Freeze:** if it isn't in the roadmap below, write it in `LATER.md` and move on. Do not add features because they seem useful.

## Stack
Next.js 16 (App Router, TypeScript, Tailwind v4 via `@tailwindcss/postcss`), Supabase (auth, Postgres, RLS), Vercel. Production: https://mastiff-app.vercel.app. Supabase project ref `udgnlvmmomketyudpgwb`. Vercel auto-deploys from `main`.

- No Node on Devin's PC; builds happen on Vercel. Push to `main` and check the Vercel deployment. Keep commits small so a broken build is easy to revert.
- Env vars (set in Vercel, never committed): `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`. Never commit a key. Never use the service_role key anywhere in this app.
- Schema: `supabase/schema.sql` (tables, RLS) and `supabase/002_invites.sql` (invites, `claim_invites()`). Both are applied to production. New schema changes go in a new numbered file under `supabase/` and get applied as a migration; do not edit the applied files.
- Auth: emailed sign-in link using the implicit flow from a server action (`src/lib/auth-actions.ts`), read client-side in `src/app/auth/callback/page.tsx`. This is deliberate: it makes the link work on a different device than the one that requested it. Do not switch back to PKCE. A 6-digit code replaces the link once custom SMTP (Resend) exists, which needs the domain.

## What is built (v1, Nov 3 2026)
- `/login`: email link sign-in.
- `/app`: office home (week count, holds waiting, vendors, verified count, recent).
- `/app/vendors`: vendor file, add one, paste CSV import.
- `/app/requests/new`: four fields, "Check it".
- `/app/requests/[id]`: Pass/Hold stamp with reasons, callback log form (staff only), decision form (owner/approver only), vendor sidebar with last three payments.
- `/app/log` and `/app/log/export`: full log, holds filter, CSV with callbacks and decisions.
- `/app/settings`: cap, range multiple, payment hours, forwarding address (shown, not yet wired).
- `/desk`: staff only. All open holds across offices oldest first with the one-hour window flagged; add office; invite person; people list.
- Roles: `staff` table = Mastiff's people. `memberships.role` = owner | bookkeeper | approver. Invites are claimed on login by `claim_invites()`.

## Roadmap (build in this order; stop after each and show Devin)
1. **Domain and email.** Once Devin buys the domain: Resend for transactional mail (custom SMTP in Supabase so the sign-in email can carry a 6-digit code), and an inbound address per office (`<slug>@requests.<domain>`) that creates a request with `source = 'email'` and the raw email attached for staff to enter. Bookkeeper does nothing.
2. **Hold notifications.** Email (later SMS) to the bookkeeper and approver when a hold is logged, when a callback result lands, and a Monday digest. Silence means Pass.
3. **Vendor memory.** Per-vendor usual range learned from history instead of typed; the `usual_min/max` fields become suggestions.
4. **Day-30 read-out.** A printable page per office: requests, holds, callbacks, vendors verified by voice, mapped to the carrier questions in the pilot kit.
5. **AI intake (v2).** Read the forwarded invoice/email, pre-fill the request, bookkeeper confirms. Rule 5 applies.
6. **Construction add-ons.** Certificate expiry, lien waiver gaps, positive pay export. Only once a construction office is in a pilot.
7. **Partner portal.** A bookkeeping firm sees all its client offices in one view.

Not now: QuickBooks/Xero/bank integrations, pricing page, deception features, AI-written-text detection, a native app.

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

Where `plans/decisions.md` (entries dated 2026-11-04) and the roadmap above disagree, Devin's decisions log is the newer word: the owner hits pay, nothing else; a live activity feed; the owner can talk to Mastiff; a hosted model with per-office memory in Supabase; connections only through the owner's own login, never a bank's money-moving side. Reconcile the roadmap with him before building past step 2.

### The October rules, kept for the record
1. Rule zero: never slow the bookkeeper.
2. Only three things hold on their own: payee not on file, bank details changed, amount out of range. Off-hours and urgency language are cautions.
3. Wording: "would have held," "worth checking," "missing." Never "fraud," "you were hit," "illegal," "caught," "prevented," "saved." Never state what an insurer requires. Every verdict says: "Mastiff flags. Your firm makes every payment decision."
4. Last 4 digits of any account or tax ID, never more.
5. AI reads, a person confirms. Per the 2026-11-04 decisions: a person confirms payment, not every extraction.
6. Style: black, white, one grey (#6B6B6B); serif headlines, Inter body; no gradients, icons, emoji, stock images, fake logos or testimonials.
7. Freeze: if it isn't in a plan, write it in `LATER.md` and move on.
