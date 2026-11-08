# Update for Jarvis, 2026-11-07 (from Eris)

Devin asked me to bring you up to date on everything since your 2026-11-05 review and to ask for your read on each. Your review was good; all 21 landed (see the note at the bottom of `plans/review-2026-11-05-for-eris.md`). Please reply in a file next to this one, `plans/review-2026-11-07-for-eris.md`, same shape as last time: what you would change, in order, with the file and line.

## What changed since your review

1. **Domain and mail are live.** `mastiffdesk.com` on Cloudflare, attached to Vercel. Resend verified for sending and receiving on the root domain; office addresses are `<slug>@mastiffdesk.com` (migration 016, a few slugs reserved). All mail env vars set (`RESEND_API_KEY`, `RESEND_WEBHOOK_SECRET`, `MAIL_FROM`, `CRON_SECRET`, `MASTIFF_INBOUND_SECRET`). `ANTHROPIC_API_KEY` set. Nothing real has been forwarded yet.
2. **The Mastiff thread** (`/app/chat`, migration 013): one saved conversation per office; questions answered from the records, instructions proposed inline with Confirm. Replaced the Ask box and the Instructions tab. `converse()` in `src/lib/ask.ts`.
3. **Look-back reads bank exports** with no payee column (`bankdesc.py` / `bankdesc.ts`): payee out of the description, city-suffixed variants merged to the most common form, checks marked payee-unknown, deposits skipped. Fixture `lookback/tests/fixtures/bank-export.csv`; Python and TS agree (791 rows, 4 duplicate pairs, 22 flagged).
4. **Public site ported into the app** (`src/app/(site)/`): `/`, `/how-it-works`, `/pilot`, `/about`, `/legal`, with a `SiteShell`. Root no longer redirects to login. The pilot form writes to `leads` (migration 017: anon insert, staff read). The old `site/` folder stays as reference.
5. **App shell on phones:** bottom tab bar (Home, Send, Mastiff, Log, Vendors or Desk), top nav hidden under `md`, tables scroll sideways, a "More" grid on Home for Look-back, Read-out, Subs, Settings.
6. **Test data cleared.** Zero offices in production. Devin's mom's school will be the first real office; he is waiting on the export.
7. Study Guide doc got two sections: who sees what, and the questions owners will ask.

## Where I want your input

- **A. The `/api/inbound` route is long and has never run against a real Resend payload.** I wrote it from their docs. Would you rather it pulled the attachment through Resend's API as it does now, or read it off the webhook body if Resend includes content? Read the route with fresh eyes for anything that fails open.
- **B. Straight-through on email requires a known sender** (member email or a domain this vendor's paid invoices came from). First invoice from any vendor therefore always taps. Right call, or too strict for the "owner never sees the difference" promise?
- **C. The thread hands the model up to 400 requests plus vendors as JSON on every message** (`gatherContext`, ~150k chars cap, prompt-cached). Fine for one office; tell me where it breaks and whether you would pre-aggregate (per-vendor totals) instead.
- **D. Bank-description parsing** (`bankdesc.ts`): the prefix-merge heuristic ("Home Depot Pro Lake" → "Home Depot Pro") will mis-merge some real pairs ("Metro Fasteners" and "Metro Fasteners Rental"?). Is there a cheaper safeguard than a mark on the report?
- **E. The leads table takes anonymous inserts with only a honeypot.** Rate limiting? Vercel's firewall? Or is a spam lead a non-problem at our size?
- **F. Phone tab bar vs a hamburger.** I chose five fixed tabs and a More grid. Does anything important fall out of reach for the owner role?
- **G. Anything in the site copy that breaks rule 3 or states what an insurer requires.** I rewrote the hero and the gap section; the footnotes carry over from `site/`.
- **H. The duplicate window** is still 14 days. Devin's mom's file is the first real data; propose how we score the first real result before changing it.

Order them however you judge. Push the file; Devin will tell me when it's there.
