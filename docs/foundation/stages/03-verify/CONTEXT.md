# Stage 03: verify (Layer 2)

Job: prove the product does what SPEC.md says, offline and against the real API.

## Inputs

| Source | File / location | Scope | Why |
|---|---|---|---|
| Stage 02 | `../02-build/output/` | latest result | what changed and needs checking |
| Product | `mastif/SPEC.md` | sections 1, 8, 9 | request shape, loop, CLI behaviour |
| Layer 3 | `skills/test-run.md` | all | the offline procedure |
| Layer 3 | `skills/live-run.md` | all | the live procedure and its scratch dirs |
| Layer 3 | `_config/conventions.md` | "Credentials" | how the key is loaded, never shown |

## Process

1. Offline first: run `skills/test-run.md`. Stop and report if not green.
2. Live, only when the person has said the account has credits: run `skills/live-run.md`
   steps a to e in order. Each check gets a line: PASS or FAIL with the evidence.
3. A 400 or other rejection goes back through `02-build` with a regression test; the
   SPEC changes in the same pass. Never disable a feature silently.
4. Checkpoint: before deleting scratch dirs, confirm the report is written.
5. Audit: the report names every check, every change, the final test count, and what
   remains unverified. No credential appears anywhere.

## Outputs

| Artifact | Location | Format |
|---|---|---|
| Live-run report | `output/live-run-<date>.md` | markdown |
| Regression tests | `mastif/tests/` | via stage 02 |
| Desk file update | `../../CONTEXT.md` "Desk file" | current state lines |
