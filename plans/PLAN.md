# MASTIFF — Claude Code build plan

Paste this file into the repo root as `PLAN.md`, then tell Claude Code: "Read PLAN.md and start at Step 1. Stop after each step and show me."

## What we're building
A clean, professional marketing site for Mastiff + the Mastiff Wall app (v1, no new features).
Mastiff = a check on *what* is being requested before a small business pays. Bookkeeper logs a payment / vendor / bank-change request → Mastiff returns PASS or HOLD with a reason.

Only offer on the site right now: **free 30-day pilot**. Nothing else (no assessment, no monthly plan).

## Style rules (non-negotiable)
- Black, white, one grey (#6B6B6B). No other colors. No gradients, no glow, no dark-mode toggle.
- Fonts: one serif for headlines (Instrument Serif or similar), one sans for body (Inter). Nothing else.
- Lots of whitespace. No stock icons, no emoji, no hero illustrations.
- Reads like a law firm or accounting firm site, not a startup.

## Stack
- Next.js (App Router) + Tailwind. Static export for the marketing pages.
- Wall app: same repo under `/app`, Supabase (Postgres + auth + row-level security). Free tier.
- Deploy: Vercel. Domain to be pointed later.

---

## Step 1 — Scaffold
- `npx create-next-app@latest mastiff --ts --tailwind --app --eslint`
- Strip boilerplate. Set up fonts, Tailwind theme with only the three colors.
- Commit.

## Step 2 — Marketing site (5 pages, all static)
1. `/` Home
   - Headline: the wall concept in one line (e.g. "Every payment request gets checked before it gets paid.")
   - 3 short blocks: the problem (BEC / fake vendor / bank-change emails hitting small offices — cite FBI IC3 2025: $20.9B total, $3.05B BEC), how the wall works (log → check → pass/hold), who it's for (small accounting, advisory, construction offices).
   - One CTA: "Start a free 30-day pilot" → `/pilot`.
2. `/how-it-works` — the 4 rules in plain English: new vendor, bank-account change, unusual amount, off-hours request. One line each. State clearly: Mastiff flags, the firm makes every final payment decision.
3. `/pilot` — the offer: free for 30 days, no software to install, bookkeeper gets an invite, we review holds with you weekly. Simple form: name, firm, email, phone, # of payments/month. Posts to a Supabase `leads` table + emails Devin (Resend, free tier).
4. `/about` — short. Who runs it, Oxford MI, why small offices. No fake team, no fake logos.
5. `/legal` — privacy + terms stub, plus one line: "Mastiff is a verification and advisory service. It does not move money or block payments on its own."
- Footer: Mastiff · Oxford, Michigan · email.
- Mobile-first; check every page at 390px.

## Step 3 — Wall app v1 (`/app`)
Rebuild exactly what exists, nothing more.
- Auth: Supabase magic link. Roles: owner (Devin), client admin, bookkeeper. Invite by email.
- Tables: `orgs`, `members`, `vendors` (name, bank last4, first_seen), `requests` (org, vendor, amount, type [payment / new_vendor / bank_change], requested_at, submitted_by, result [pass/hold], reasons[], note, resolved_at).
- Form: log a request (vendor picker or "new vendor", amount, type, optional note).
- Rules engine (pure function, unit-tested):
  - new vendor → HOLD
  - bank details changed vs stored → HOLD
  - amount > 2× that vendor's 90-day average (or > $5,000 if no history) → HOLD
  - submitted outside Mon–Fri 7am–7pm local → HOLD
  - otherwise → PASS
- Dashboard: list of requests, filter by result, mark hold as resolved with a note. Counts at top: checked / holds / resolved this month.
- RLS so an org only sees its own rows.
- Same black/white/grey style as the site.

## Step 4 — Deploy
- Push to GitHub, connect Vercel, add env vars (Supabase, Resend).
- Test the pilot form end-to-end and one full request → hold → resolve flow.
- Lighthouse ≥ 90 on mobile for the marketing pages.

## Step 5 — Hand back
- Short README: how to invite a bookkeeper, how to add a client org, where leads land.
- Stop. No new features until pilot users exist.

## Do not
- Add pricing, an assessment offer, a "Trap"/deception mode, AI email parsing, or integrations (QuickBooks, Gmail, etc.).
- Add colors, animations, testimonials, or logos that aren't real.
