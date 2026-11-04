# Mastiff — status (Oct 26, 2026)

Start here. Everything newest and still current about Mastiff, in one folder.

## What it is
A safety check that runs before a small office pays a bill. The bookkeeper enters a payment, new vendor or bank-change request; Mastiff answers PASS or HOLD with a plain-English reason. A hold clears only after a callback to the number already on file and a second person's sign-off. Mastiff is advisory: it never blocks a payment, the firm makes every call.

Holds on their own: payee not on file, bank details changed, amount out of range.
Cautions only (hold when combined with one of the above): off-hours request, pressure/urgency language.
Planned, no AI needed: sender email doesn't match the vendor on file.

## Where it stands
| Piece | Status |
| --- | --- |
| Marketing site v1 (artifact) | Done Oct 21 — `reference/Mastiff-site-v1.html` |
| Wall app v1 (artifact) | Done Oct 19 — `reference/Mastiff-Wall-v1.html` |
| Action plan for Claude Code (`CLAUDE.md`) | Written Oct 26. This is what Claude Code follows |
| Real rebuild in Claude Code (`PLAN.md`) | Was mid-Phase 1 as of Oct 22. Code location unknown, so start fresh from this folder |
| `PLAN-2.md` (pilot-ready) | Written Oct 22 |
| `PLAN-3-construction.md` | Written Oct 26. Waits for a construction pilot |
| Competitor report | Done Oct 21 (live doc, link below) |
| Pilot offices / revenue | 0 / $0 |

Rough launch read: ~60% ready to pitch pilots (needs a real domain + working pilot form); ~25% to a live paid product.

## Decisions on the books
- **Offer:** free 30-day pilot. No card, nothing auto-renews. Day 30: a one-page read-out, then they decide.
- **Door-opener:** the free look-back scan of their last 6–18 months of payments. Claude runs it by hand on files Devin collects until the script exists (CLAUDE.md step 4).
- **Wording rule:** reports say "would have held" / "worth checking," never "fraud" or "you were hit."
- **Pricing (not on the site):** leaning ~$199/month flat per office; founding rate ~$149 locked for a year for the first clients in exchange for being a reference.
- **Lead niche:** construction (GCs and subs) — Devin ran a construction company's books. Lien waiver / insurance certificate / sworn statement / positive pay / W-9 checks come later as cautions (PLAN-3).
- **Channels:** warm intros (flooring trade, dad's contacts), then local CPA firms offering Mastiff to their clients.
- **No NDAs for prospects.** Offer *them* a confidentiality agreement instead, since Mastiff sees their payment files.
- **Not building yet:** AI email intake, integrations (QuickBooks, Gmail, M365), pricing page, Trap/deception mode, AI-written-text detection (would create false holds).
- **Before the first paid client:** Michigan LLC (~$50), tech E&O + cyber insurance, Supabase Pro. Have a lawyer review client agreements and the lien-waiver language.

## The edge, in one line each
- No local firm checks the payment itself; local IT firms only protect the inbox.
- Payment-verification software starts around $800/month and targets corporate AP teams.
- The county's own toolkit tells owners to do the callback by hand — Mastiff makes it happen every time and leaves the record insurers ask for.
- Long-term moat: shared vendor memory and fraud alerts across local clients.
- Watch: Cyber Protect LLC (owns local search, sells to trades and accountants) could add a "payment verification" line.

## Next move
Write the list of 20 warm names. Goal this month: 3 look-back scans done.

## Files here
- `STATUS.md` — this page
- `CLAUDE.md` — the action plan. Claude Code reads it automatically
- `PLAN.md` — Phase 1: site + Wall app on Next.js, Supabase, Vercel
- `PLAN-2.md` — Phase 2: Rule zero, vendor import, look-back scan, callback holds, weekly review, hardening, onboarding
- `PLAN-3-construction.md` — Phase 3: construction checks
- `reference/Mastiff-site-v1.html` — the current site. Open in a browser
- `reference/Mastiff-Wall-v1.html` — the v1 Wall app. Open in a browser

To start: open Claude Code in this folder and say "Read CLAUDE.md and start at Step 1."

## Live links (in Claude)
- Site: https://claude.ai/code/artifact/8e326170-0dbd-4893-81e9-e296cccdecae
- Wall app: https://claude.ai/code/artifact/b32b2e26-0812-4439-b211-328e2b463bcb
- Competitor report: https://claude.ai/code/artifact/af0a3fff-a82d-420c-a784-e841a5242157
- Pitch & SWOT, cases, plan and costs (Oct 16, older assessment-first strategy): https://claude.ai/code/artifact/afdfd955-ab31-478e-926b-ebdb4470bbf0
- Assessment plan slides (Oct 17, superseded by the pilot model): https://claude.ai/code/artifact/a4103dde-37d0-4f50-b666-45dc2a4d2dd3
- Main build chat: https://claude.ai/chat/1cf89c52-e034-4965-9762-85e610509862
