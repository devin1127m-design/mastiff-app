# Mastiff demo (wall-demo)

A clickable demo of the Mastiff check. Static files, sample data, no backend, no build step, no external scripts.

This is the v1 demo described in CLAUDE.md, Build order C, step 5. It is not production.

## Open it

From the repo root:

    python -m http.server

Then browse to http://localhost:8000/wall-demo/ . (Opening index.html directly also works in most browsers.)

## Sample vs real

Sample: the 12 vendors, their phone numbers (555-01xx, fictional), bank last 4 digits, averages, and the 8 past requests in the log. Dates are generated relative to when you first open the page.

Real: the rules in `wall.js` (`evaluate(request, vendors, settings)`), the form validation, hold resolution (callback to the number on file, approver different from submitter, override with a one-line reason), the five numbers, and CSV export. These run in your browser.

Rules: three things hold (payee not on file, bank details changed, amount over 2x the 90-day average, or over $5,000 with no history). Off-hours and urgency are cautions and never hold alone. Releasing a bank-change hold updates the vendor's stored last 4; releasing a new-payee hold adds the vendor. An override counts as released in the five numbers.

Storage: one localStorage key (`mastiff-wall-demo-v1`). "Reset demo" restores the sample data. Nothing leaves the browser. Only the last 4 digits of an account are accepted.
