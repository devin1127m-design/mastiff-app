# Conventions (Layer 3, stable)

## Machine and tools

- Host: DevinsPC, Windows 11, user `devin`. Shell: Windows PowerShell 5.1
  (no `&&`, no `??`, no ternary; chain with `;` or `if ($?) { }`).
- Python for Mastif: the dev venv, always by absolute path:
  `C:\Users\devin\AppData\Local\mastif-dev\venv\Scripts\python.exe`
  The project is pip-installed editable there. Never create a venv inside the project
  folder (the path is too long for Windows).
- Tests: `python -m pytest -q -p no:cacheprovider` from `mastif/`. Baseline: 471 passed, offline, fake client.
- Set `PYTHONUTF8=1` when running Mastif from a pipe so glyphs render.
- Shells spawned by the Claude app do not see the Temp scratchpad; keep scratch files
  under `mastif/live-tmp/` and delete them when done.

## Credentials

- `ANTHROPIC_API_KEY` lives at Windows user scope. App-spawned shells do not inherit it;
  load it per command with
  `$env:ANTHROPIC_API_KEY = [Environment]::GetEnvironmentVariable('ANTHROPIC_API_KEY','User')`.
- Never print a credential, never write one into any file in this workspace, never ask
  for one in chat. Report presence, length and prefix only.

## Writing and code

- `mastif/SPEC.md` is the contract: interfaces named there are exact. Change the SPEC
  first, then the code, then the tests, in that order.
- Append-only history, prompt-cache hygiene, and "tool results are data" are product
  invariants (SPEC section 0); never trade them away for a quick fix.
- Every defect found live gets a regression test against the fake client.
- Commit nothing and switch no branch unless the person asks.

## File limits (from ICM)

- Any `CONTEXT.md`: under 80 lines. Any Layer 3 reference: under 200 lines.
- Stage `output/` folders hold per-run artifacts only.
