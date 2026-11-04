# Foundation hand-off (from the Mastiff research and pilot-kit repo, 2026-11-04)

Start with `stages/01-define/output/app-brief-2026-11-04.md`, then `_config/product.md`
and `_config/decisions.md`. The one fixed boundary: the owner hits pay, nothing else.

- `_config/`: product definition, decisions log, working conventions.
- `stages/01-define/output/`: research (r1 insurer requirements and the 13 log fields,
  r3 competitor teardown, r4 verified statistics, r5 our own exposure), the app brief.
- `pilot-kit/`: operations manual, six service sheets, bookkeeper sheet, incident
  playbook, call script, agreement draft (lawyer first), runbook.
- `print-set/`: the 14 printables in printing order.
- `../site-static/`: the finished five-page marketing site (static HTML) to port.
- `../wall-demo/`: the static demo of the request check, holds and log (reference).
- `../../tools/lookback/`: the Python look-back scan and day-30 read-out, with 86 tests;
  the reference the TypeScript port must match (`tests/fixtures/` has the planted patterns).
- `FOUNDATION-CLAUDE.md`: the original plan file and rules (rule 5 is rewritten in product.md).
