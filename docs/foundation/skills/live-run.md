# Skill: live run against the real Claude API

Preconditions: `ANTHROPIC_API_KEY` at user scope (see `_config/conventions.md`), API
credits on the account, baseline suite green.

1. From `mastif/`, load the key into the process and set `PYTHONUTF8=1`.
2. Scratch dirs inside the project: `live-ws/` (workspace, holds `notes.txt` fixture),
   `live-home/` (MASTIF_HOME), `live-tmp/` (drivers and outputs). Never the real `~/.mastif`.
3. Checks, in order, each with `--workspace live-ws --home live-home`:
   a. Single-shot: `python -m mastif -m "Reply with one word: ready"`; text streams, exit 0.
   b. REPL via piped stdin (`live-tmp/repl_b.txt`): calculate, current_datetime,
      list_directory, read_file, an approved write_file (the `y` line), remember, recall,
      then `/usage`: `cache read` must be non-zero after the first turn.
   c. `--resume` with `live-tmp/repl_c_resume.txt`: prior conversation continues; the note from (b) is recalled.
   d. `python live-tmp/live_d_interrupt.py`: generator closed mid-text and right after a
      tool_use; transcript stays valid; the next request succeeds.
   e. `--show-thinking` with `live-tmp/repl_e_thinking.txt`: thinking renders; second turn gets no 400.
4. On a 400: read the error body; suspects are the betas list, `fallbacks`, top-level
   `cache_control`, thinking `display`, `output_config.effort`, `eager_input_streaming`.
   Fix `agent.py` and `SPEC.md` together; disable a feature by default only if the API
   clearly rejects it, and say why in SPEC.md and README.md.
5. Every live defect gets a fake-client regression test; suite stays green.
6. Delete `live-ws/`, `live-home/`, `live-tmp/`. Write the report to
   `stages/03-verify/output/live-run-<date>.md`: checks passed, rejections and fixes,
   final test count, what is still unverified.

Known-good error paths (verified 2026-10-21): a 401 prints the credentials message and
exits 2; a billing 400 prints one `error:` line and exits 1.
