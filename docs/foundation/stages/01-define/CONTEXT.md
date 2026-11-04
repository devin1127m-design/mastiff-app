# Stage 01: define (Layer 2)

Job: turn what the person wants Mastif to be into exact changes to `mastif/SPEC.md`.

## Inputs

| Source | File / location | Scope | Why |
|---|---|---|---|
| Layer 3 | `_config/product.md` | all | the intent to honour |
| Layer 3 | `_config/decisions.md` | all | do not reopen settled questions |
| Product | `mastif/SPEC.md` | sections touched by the request | the contract being changed |
| Layer 3 | `shared/claude-api.md` | only if the request shape changes | what the API accepts |

## Process

1. Read the inputs above; nothing else.
2. For each behaviour in `product.md` not yet in SPEC.md, or in conflict with it, write
   one proposal: the SPEC section, the exact new wording, what it costs, what it breaks.
3. Checkpoint: list the proposals in `output/<slug>-spec-changes.md` and stop for review.
4. After approval, apply the wording to `mastif/SPEC.md` only. No code in this stage.
5. Audit: every interface name, signature, default and field in the new wording is exact
   and consistent with the rest of SPEC.md.

## Outputs

| Artifact | Location | Format |
|---|---|---|
| Proposed changes | `output/<slug>-spec-changes.md` | markdown, one proposal per heading |
| Applied contract | `mastif/SPEC.md` | edited in place after approval |
| Settled decisions | `_config/decisions.md` | one appended line each |
