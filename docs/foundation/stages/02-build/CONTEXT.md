# Stage 02: build (Layer 2)

Job: make `mastif/src/mastif` match a SPEC section, with tests, without breaking the rest.

## Inputs

| Source | File / location | Scope | Why |
|---|---|---|---|
| Stage 01 | `../01-define/output/` | the approved change | what to implement |
| Product | `mastif/SPEC.md` | the section named, plus section 0 | the contract and its invariants |
| Product | `mastif/src/mastif/<module>.py`, `mastif/tests/test_<module>.py` | the module owned by that section | where the change lands |
| Layer 3 | `_config/conventions.md` | "Writing and code", "Machine and tools" | how to work here |
| Layer 3 | `shared/claude-api.md` | only for request-shape changes | what the API accepts |

## Process

1. Read the SPEC section and the module. Write down, in `output/<slug>-plan.md`, which
   files change and which tests prove it. Checkpoint if the plan touches more than one module.
2. Implement. Keep SPEC invariants: append-only history, cache hygiene, tool results are data.
3. Add or change tests against the fake client in `tests/conftest.py` first for any new behaviour.
4. Run `skills/test-run.md`. Green or report the failure verbatim.
5. Audit: no interface drifted from SPEC.md; no credential, no absolute machine path in code.

## Outputs

| Artifact | Location | Format |
|---|---|---|
| Plan | `output/<slug>-plan.md` | markdown |
| Code and tests | `mastif/src/mastif/`, `mastif/tests/` | edited in place |
| Result | `output/<slug>-result.md` | what changed, test count before and after |
