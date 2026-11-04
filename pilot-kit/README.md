# Pilot runbook (no-app setup)

Adapted from PLAN-2 Step 5. Mastiff flags. Your firm makes every payment decision.

## 1. First call
- Ask for the payments export (QuickBooks, Xero or bank CSV), last 12-24 months, and the vendor list.
- Account columns must hold the last 4 digits only. If a file has more, ask for a redacted copy.

## 2. Run the look-back
From the repo root:

    python -m lookback preview payments.csv
    python -m lookback scan payments.csv --out reports/<office>-lookback --org "<Office>"

Confirm the column matching with them first. Walk the report together: what would have held, what is worth checking this week.

## 3. Sign the agreement
- `confidentiality-agreement-draft.md` is not signable until a Michigan lawyer reviews it. [LAWYER]
- Entity name on the signature block. [CONFIRM: Michigan LLC formed]
- Cover in place before real files arrive. [CONFIRM]

## 4. Set up the demo page
- Copy `wall-demo/` to a local folder on the bookkeeper's machine and open `index.html`, or use a served URL. [CONFIRM: which]
- Data stays in that browser only. Use the same browser every time.
- Enter their vendors by hand (name, bank last 4, callback number on file). Import comes later.
- Hand over `bookkeeper-sheet.html` (prints on one Letter page) after filling in your phone and email. [CONFIRM]
- Run one test of each with them: known vendor (PASS), bank change (HOLD), new payee (HOLD). Close one hold end to end.

## 5. Weekly
- Get the Export CSV file from the bookkeeper.
- Run:

      python -m lookback readout log.csv --out reports/<office>-weekN --org "<Office>"

- Review open holds together. If more than 1 in 10 requests holds, loosen that office's thresholds first.

## 6. Day 30
- Run:

      python -m lookback readout log.csv --out reports/<office>-day30 --org "<Office>" --start YYYY-MM-DD --end YYYY-MM-DD

- Deliver the one-page read-out and ask for their decision. No card, nothing renews.
- Delete their files on request, unless they ask us to keep them.

## Open items
[CONFIRM] phone and email; demo hosting method; LLC; cover. [LAWYER] agreement review.

## 7. Working the holds queue (daily, payment hours Mon-Fri 7am-7pm)
Do this in addition to section 5. Promise the bookkeeper a result within the hour.
1. Get the holds. Either the bookkeeper messages you (phone, text or email) or you open their Export CSV and read the open HOLD rows. [CONFIRM: which channel]
2. For each hold, find the vendor's callback number on file. Never use a number from the request.
3. Call it. Ask who is speaking, and whether the request (new bank, amount, payee) came from them.
4. Record four fields: who called, which number, what the vendor said, the outcome. Put them in the office's log as "reported by" the office, or send them to the bookkeeper to enter. [LAWYER: R5 2.6 items 1 and 3 on Mastiff making calls and writing entries]
5. Send the result to the bookkeeper within the hour: "Called [vendor] on the number on file at [time]. [Name] said [what]. Outcome: [confirmed / not confirmed]." Say nothing about whether to pay. The second person at the office signs off.
6. If the call is not answered, say so and try once more later. Do not leave account details on voicemail.
7. After the call, mark the vendor in the verified vendor file: phone confirmed, account last 4 confirmed, date, name of who confirmed it. By day 30 every active vendor should have a line.

## 8. New vendor onboarding
For each new sub or supplier, before the first payment:
1. The office asks the vendor for a W-9 and sends it to you. Keep it in the office's own files; do not copy the tax ID anywhere. Last 4 only.
2. Match the name on the W-9 to the payee name on the invoice.
3. Call the vendor on a number the office already has from a source other than the invoice (contract, licence, prior job). Confirm who they are.
4. Call the vendor's bank to confirm the account. [CONFIRM: many banks will not confirm account details to a third party. Fallback: the vendor reads the account name to you on the call and the office keeps a bank letter or voided check.]
5. Record the last four digits, the date and the name of who confirmed it, then tell the bookkeeper the first payment can be keyed. The office decides.

## 9. When to hand over the incident playbook
Give `incident-playbook.html` (one printed page) as soon as an office tells you a payment may have gone to the wrong account, and at kickoff as a standing copy for the owner. Stay on the phone while they work through steps 1 and 2. Do not promise recovery, say what the policy covers, or tell them what their insurer requires. Your part: send the log export and the dated callback list, and keep your own call notes.

## Day-30 renewal packet
Read-out plus the verified vendor file plus the log set against the questions carriers ask. Hand to the owner to give their broker. Do not say what the carrier requires.
