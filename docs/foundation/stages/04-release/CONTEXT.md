# Stage 04: release (Layer 2)

Job: make a verified build usable by its person: guide, version, install.

## Inputs

| Source | File / location | Scope | Why |
|---|---|---|---|
| Stage 03 | `../03-verify/output/` | latest report | only verified behaviour is documented |
| Product | `mastif/README.md`, `mastif/pyproject.toml`, `mastif/src/mastif/__init__.py` | all | guide, metadata, version |
| Product | `mastif/SPEC.md` | section 10 | what README and packaging must contain |
| Layer 3 | `_config/conventions.md` | "Machine and tools" | install path and interpreter |

## Process

1. Diff README.md against the verified behaviour: every flag, slash command and default
   documented matches SPEC.md and the live report. Fix the README, not the report.
2. Bump the version in one place and confirm `--version` prints it.
3. Checkpoint: write `output/<version>-release-notes.md` (what changed, what was verified
   live, known gaps) and stop for review.
4. Only on request: tag, build, or publish. This workspace commits nothing on its own.

## Outputs

| Artifact | Location | Format |
|---|---|---|
| Release notes | `output/<version>-release-notes.md` | markdown |
| Guide and metadata | `mastif/README.md`, `mastif/pyproject.toml` | edited in place |
