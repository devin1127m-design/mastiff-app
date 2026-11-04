# Layer 1: Where do I go?

## Routing

| The person asks for... | Stage |
|---|---|
| what Mastif is, should do, or should stop doing; a new capability; a behaviour change | `stages/01-define/` |
| code for a SPEC section, a bug fix, a refactor | `stages/02-build/` |
| running tests, a live run against the API, checking a claim | `stages/03-verify/` |
| README changes, a version bump, packaging, install instructions | `stages/04-release/` |
| a question about the project | answer from this file and `_config/decisions.md`; no stage |

A request that spans stages runs them in order, with a review gate after each.

## Desk file: current state (keep this section current; a stale desk file lies)

- 2026-10-28: `python -m lookback subs register.csv --payments p.csv`: construction cautions (GL/WC/auto certificate expired, expiring in 30 days or missing; WC exempt; not additional insured; payments made while a certificate had lapsed; payments not covered by a lien waiver). Template: `pilot-kit/subcontractor-register-template.csv`. Standalone version of PLAN-3 Step 3, cautions only. Pilot page offers it.
- 2026-10-28: `python -m lookback 1099 payments.csv [--vendors v.csv] [--year]`: 1099 readiness list ($600 through 2025, $2,000 from 2026 per OBBBA; card/app payments excluded; services vs goods noted; corp/legal/medical handling; W-9 status; deadline). Pilot page offers it. Next: COI and lien waiver checks (construction).
- 2026-10-28: look-back adds "Money to recover" (possible duplicate payments, total at top of report, <out>-money.csv with status and amount-recovered columns); pilot page offers it. Next add-ons agreed: W-9/1099 readiness, then COI and lien waiver checks (construction).
- 2026-10-28: site About and legal updated to the verification desk; About names Devin Martin. Waiting on contact email. Next: warm list of 20, three hand-run look-back scans.
- **Previous step: pilot reworked 2026-10-27 into a verification desk (five services: the check, we make the calls, verified vendor file, new-vendor onboarding, incident playbook; day-30 renewal packet) across product.md, the site, the pilot kit, plus call-script.md and incident-playbook. Open: lawyer must redo R5 engagement terms (Mastiff now makes calls); bank-confirmation step needs a fallback [CONFIRM]. Devin is brainstorming more services. Deploy on hold.**
- Repo moved to `C:\Users\devin\Documents\Mastiff` on 2026-10-26. The Next.js app goes in `mastiff/` under it.
- Action plan installed 2026-10-26 from Devin's CLAUDE.md. Missing from the repo: PLAN.md,
  PLAN-2.md, PLAN-3-construction.md, reference/Mastiff-Wall-v1.html. Site v1 saved to
  `reference/Mastiff-site-v1.html` from the artifact.
- Step 0 audit: no production code exists anywhere in this folder. Everything is MISSING.

- Plan: Mastiff, a payment-controls service for small offices (`_config/product.md`,
  from Devin's site). Pilot: free 30 days for the first five offices; the site form sends nothing yet.
- `mastif/` (Python AI agent): development stopped 2026-10-24, kept as an archive. Not part of the plan.
- Positioning and research plan: `stages/01-define/output/roi-and-research-2026-10-24.md`.
- R1 (carrier requirement audit): three research files done in `stages/01-define/output/r1/`
  (10 carriers plus Intact, broker questionnaires, case law). DONE 2026-10-24: merged into
  `r1/requirements-matrix.md` (matrix, 13 log fields, 20 question groups, cases, pitch, gaps).
- R3 competitor teardown DONE 2026-10-26: `stages/01-define/output/r3/competitor-teardown.md`.
- R4 primary statistics DONE 2026-10-25: `stages/01-define/output/r4/primary-statistics.md`.
- R5 our own exposure DONE 2026-10-27: `stages/01-define/output/r5/our-exposure.md` (liability, two-paragraph
  engagement terms draft, insurance recommendation, data custody decision, product wording changes; working
  notes `r5/legal-exposure.md`, `r5/insurance.md`, `r5/data-custody.md`). Seven decisions for Devin in its
  section 7.1; lawyer and broker questions in 7.2 and 7.3. Research left: R2 (Devin), R6 (after pilots).
- Next: R2 local conversations (Devin); site copy fixes from R3 and R4.
- Standing rule (global CLAUDE.md): cheapest capable model per task; heavy work to background agents.
- Nothing is committed; this folder is not a git repository.

## Open decisions

- How the `mastif/` agent serves Mastiff: engine behind the wall, internal operations agent
  for the business, both, or neither. Decides what `01-define` produces next.
- What the wall runs on (hosting, data store, custody of vendor data) and the flat monthly price.
- From R5 (2026-10-27): bind tech E&O + cyber and start paid Supabase/Vercel tiers before the first pilot
  office hands over a real file, rather than before the first paid client; "PASS" vs "Nothing flagged" on the
  verdict screen; whether "the wall" stays the client-facing name; strict last-four intake for look-back files;
  who the second named person with data access is.
- Move settled ones to `_config/decisions.md`.

## Shared resources

- `_config/conventions.md`: how to run things on this machine.
- `shared/claude-api.md`: where the Claude API reference docs are.
- `skills/live-run.md`, `skills/test-run.md`: step lists for the two routine procedures.
