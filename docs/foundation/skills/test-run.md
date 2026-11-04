# Skill: run the offline suite

1. From `mastif/`:
   `& "C:\Users\devin\AppData\Local\mastif-dev\venv\Scripts\python.exe" -m pytest -q -p no:cacheprovider`
2. Expected: all tests pass offline against the fake client in `tests/conftest.py`
   (471 as of 2026-10-21). Record the new count in the stage output when it changes.
3. If `No module named mastif`: the editable install points at a stale path. From `mastif/`:
   `python -m pip install -e . --no-deps -q`, then rerun.
4. A failing test is reported with its output, never summarised as "mostly green".
