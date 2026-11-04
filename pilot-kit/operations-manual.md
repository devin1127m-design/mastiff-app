# Mastiff operations manual

For Devin. Use it on the day, top to bottom. Mastiff flags. Your firm makes every payment decision.

Anything marked [CONFIRM] is a fact only you can fill in before first use (your phone, your email, how the office reaches Mastiff, your hours). Anything marked [LAWYER] waits for a Michigan lawyer. Do not guess either.

## The rules that never change

1. We never move money. We never block a payment. The office decides every payment.
2. We never say what an insurer requires, or that a claim will pay, or that a payment is safe to release.
3. Last 4 digits only, for any account number or tax ID. If a file has more, ask for a copy with the extra digits removed. Do not keep the long one.
4. Only three things hold on their own: payee not on file, bank details changed, amount out of range. Off-hours and urgency wording are cautions. They hold only together with one of the three.
5. Say "would have held", "worth checking", "missing", "possible". Never use the words ruled out in CLAUDE.md rule 3 and the wording rules. If unsure, describe what happened in plain facts.
6. Never slow the bookkeeper. If a hold is waiting on you, that is your clock, not theirs.
7. Credentials, bank logins and signing authority: never ask for them, never accept them.

## The 13 log fields (used throughout)

Every hold produces a record. This is the list, with the numbers used below.

1. Request received: who received it, when, which channel, a copy.
2. Request type, payee, amount.
3. Callback number used, and where it came from (source, and the date it was on file before the request).
4. Channel of verification (a phone call, not email, and different from how the request came in).
5. Caller: who made the call (not the person who received the request).
6. Time of the call, and every attempt, including unanswered ones.
7. Who answered: name and role at the vendor, and that they are not the person who sent the request.
8. What they said, written at the time: confirmed, denied, or different details.
9. Hold status: the payment waited until the vendor responded; release time is later than call time.
10. Second approver: name, role, time. Different from the person who entered it and the person who received it.
11. Outcome: released, rejected, escalated or changed, with the reason.
12. Documents kept: call notes, request copy, attachments, timestamps, exportable.
13. Optional: new-account checks (bank call, account age) and the time of any incident.

[LAWYER] Callbacks made by Mastiff, and Mastiff writing entries on the office's behalf, are an open question for a Michigan lawyer. Until it is answered, record the entries as "reported by" the office, or send them to the bookkeeper to enter.

---

# Part 1. Bringing an office on

Quick map. Day 0 the call. Day 1 files, look-back, walk the report, sign. Day 2 set up and hand over. Days 3 to 30 daily and weekly work. Day 30 read-out and decision.

## Day 0. The call

**Time:** 20 minutes. **Use:** `pilot-kit/call-script.md`. Say it as written, stop after the question, let them answer.

**What you do**
1. Pick the right script: contractor owner, CPA or bookkeeping firm, or a firm that does not pay vendors.
2. Open, ask the one question, make the offer, ask them to send the export, close.
3. Say what the export is: QuickBooks, Reports > Transaction List by Vendor, last 18 months, CSV.
4. Ask that the person who sends the wires joins the next call.
5. After the call, write one line in your own notes: office name, who you spoke to, what they said they would send, by when.

**What the office does:** answers two questions and agrees to send the export.

**What is produced:** a promised file and a date.

**What can go wrong**
- They ask about price. Say: "The pilot is free. We talk on day 30."
- They ask about insurance. Say: "Ask your broker what your policy needs. We keep a dated record of every call."
- They ask about account numbers. Say: "Last four digits only."
- No reply after a week. Send one short email asking if they still want the look-back. Then stop. Do not chase a third time.
- Five offices is the cap. If you already have five, say there is a waiting list.

## Day 1. Collect, run the look-back, walk the report, sign

**Time:** about 2 hours of your time in total, spread over the day.

### Step 1.1 Collect the files

**What you do**
1. Ask for two things: the payments export (QuickBooks, Xero or bank CSV, 12 to 24 months) and the vendor list.
2. Check that any account column holds the last 4 digits only. If a column holds a full number, do not copy it anywhere. Ask for a copy with those numbers removed.

**What the office does:** exports and sends the files. About 10 to 20 minutes for them. [CONFIRM: how files reach you, for example email or a shared folder. Agree it in writing, and have the agreement signed, before real files arrive.]

**What is produced:** payments file and vendor list in a folder named for the office.

**What can go wrong**
- Wrong report type. Ask again for Transaction List by Vendor.
- The file has full account numbers. Ask for a redacted copy. The look-back cuts them to 4 digits on import, but do not rely on that: still ask.
- They are worried about privacy. Point to the five promises in the agreement draft: used only to run their checks, last four only, two named people, a prompt notice if something goes wrong, and export and deletion. [LAWYER: the agreement must be reviewed before anyone signs.]

### Step 1.2 Run the look-back

**What you do.** Open a terminal in the Mastiff folder (the repo root, `C:\Users\devin\Documents\Mastiff`). Run these two commands, replacing the file name and the office name.

    python -m lookback preview payments.csv

Read the screen. It shows how each column was matched (date, payee, amount) and the row counts. Check the three required columns are matched to the right things. If not, fix the file headers and run it again. Confirm the matching with the office.

    python -m lookback scan payments.csv --out reports/<office>-lookback --org "<Office name>"

It prints one summary line and writes into `reports/`: `<office>-lookback.html` (print-ready), `<office>-lookback.csv`, and `<office>-lookback-money.csv`, which lists payments that may have been paid twice.

Optional extras, only if they help:

    python -m lookback scan payments.csv --bills bills.csv --line 5000 --out reports/<office>-lookback
    python -m lookback 1099 payments.csv --vendors vendors.csv --org "<Office name>"
    python -m lookback subs --template register.csv
    python -m lookback subs register.csv --payments payments.csv --org "<Office name>"

The last two are for construction offices: a blank register to fill in, then the subcontractor check.

**What is produced:** the look-back report (HTML to print, CSV to sort), the money-to-recover list, optionally a 1099 readiness list and a subcontractor check.

**Time:** 15 minutes to run, 30 minutes to read it yourself first.

**What can go wrong**
- A plain message on screen and exit code 2: the file is bad. Read the message. Usually a missing column or an unreadable date. Fix the header or ask for a fresh export.
- Zero results. That is a result: report it as "nothing would have held in this file". Do not claim more.
- Too many results. Read the top ones first. Do not tell the office what any item means beyond "would have held" or "worth checking".

### Step 1.3 Walk the report

**What you do.** Book 30 minutes with the owner and the person who sends the wires. Share the screen or hand over the printed copy.
1. Read the summary line aloud.
2. Go through "would have held" first, then "worth checking". For each: "Under Mastiff's rules this would have held because [bank details changed / payee not on file / amount out of range]. It is worth checking whether the office remembers this one."
3. Leave the Status column to the office: to verify, verified fine, confirmed loss. You do not fill it in.
4. Show the money-to-recover list: "These may have been paid twice. Worth checking with the vendor."
5. Ask: "Do you want to try a 30-day pilot where we make the verification calls?"

**What the office does:** says what is familiar, marks the Status column.

**What can go wrong**
- They feel accused. Say: "This is what the rules would have flagged. It is not a finding that anything went wrong."
- They ask if a payment was bad. Say: "I cannot tell you that. It is worth a call to the vendor."
- They ask what insurance needs. Do not answer. Say: "Your broker can tell you."

### Step 1.4 Sign the agreement

**What you do**
1. Send the agreement: `pilot-kit/confidentiality-agreement-draft.md`. It is not signable until a Michigan lawyer has reviewed it. [LAWYER]
2. Put the entity name on the signature block. [CONFIRM: Michigan LLC formed, and its exact name]
3. Check your insurance cover is in place before real files arrive. [CONFIRM: cover in place]
4. Both sign. Keep one copy in the office's folder. Nothing renews. They can stop any day with one message.

**What can go wrong:** they will not sign before day 30. Then do not take real files. Offer the look-back on a redacted sample only.

---

## Day 2. Set up

**Time:** one 60-minute session with the bookkeeper and the owner. Do all of it in one sitting so nothing is left half done.

### Step 2.1 Payment hours and the payment line, with the owner

**What you do.** Ask the owner to say aloud, and write down:
1. Payment hours. Default: Monday to Friday, 7 am to 7 pm. This is when you promise a result within the hour. [CONFIRM: your own hours match]
2. The single-payment cap: a dollar amount above which a payment is "out of range".
3. A weekly total, if they want one.
4. The payment line: the phone number or email the bookkeeper uses to reach you. [CONFIRM: your number, your email and how the office reaches Mastiff]

**What the office does:** the owner decides the numbers. Do not choose them. If asked, say: "It is your call. Many offices start from the largest normal payment."

**What is produced:** one half-page of settings: hours, cap, weekly total, your contact.

### Step 2.2 The second person

**What you do.** Ask the owner to name who signs off a hold. It must be a different person from the one entering the payment. Write down name and role. Also ask for a backup, for days the first is away.

**What can go wrong:** a very small office has only one person. Then the owner is the second person, and the bookkeeper cannot also be the owner. If the owner and the bookkeeper are the same person, note it and tell the owner that the second sign-off will not be a different person. Do not claim it is. Suggest an outside person such as the office's accountant.

### Step 2.3 The bookkeeper's page on their machine

**What you do**
1. Copy the `wall-demo/` folder to a local folder on the bookkeeper's machine and open `index.html` in the browser. [CONFIRM: copy locally, or use a served URL]
2. Use the same browser every time. Data stays in that browser only. Tell them: do not clear browsing data, do not click Reset.
3. Enter their vendors by hand: name, bank last 4, callback number on file. Take the callback number from a source the office already has (contract, an earlier job, a business card), not from an invoice.
4. Run one test of each with them:
   - A known vendor. The answer should be PASS.
   - A known vendor with a different bank last 4. The answer should be HOLD.
   - A payee not in the list. The answer should be HOLD.
5. Close one hold end to end with them, so they see the whole path.

**What the office does:** reads out vendor details, enters them with you watching.

**What is produced:** a working page with the vendors loaded, and a tested path.

**What can go wrong**
- Someone types a full account number. The page rejects anything longer than 4 digits. If one gets through, delete the entry and tell the bookkeeper: last 4 only.
- A vendor has no callback number on file. Mark it missing. That vendor will hold until you find a number from a source other than the request. Do not use the invoice.
- Different browsers on different days: the data seems to vanish. Tell them to always use the same one.

### Step 2.4 Hand over the sheets

**What you do**
1. Fill in your phone and email on `bookkeeper-sheet.html`. [CONFIRM: phone and email] Print it on one Letter page.
2. Print `incident-playbook.html`, one page. Give one to the owner as a standing copy, and one to the bookkeeper. Say: "You may never need this. If you do, call me and I stay on the phone with you for the first two steps."
3. Give the owner the service sheets in `pilot-kit/services/` (00 to 05) to read alone.
4. Ask the bookkeeper: "What will you do when a HOLD comes up?" Let them say the steps back.

**What is produced:** the paper in their hands, and the bookkeeper able to say the steps.

---

## Days 3 to 30. Daily and weekly

### Daily holds queue

**Time:** 15 minutes when there is nothing to do, 10 to 15 minutes per hold. Budget about 1 hour a day per office in the first week, less after.

**What you do, every payment day in payment hours**
1. Check the channel the bookkeeper uses to reach you. [CONFIRM: phone, text or email, and how often you will look] Check at least at the start of the day, midday and the end of the day.
2. For each hold, follow the callback procedure in Part 2, service 2. Result back to the bookkeeper within the hour.
3. After each one, update the verified vendor file (service 3).
4. For each new vendor, follow service 4.
5. Keep your own call notes, with the time.

**What the office does:** enters each request in the page before keying it, tells you about each HOLD, has the second person sign off.

**What is produced:** call notes, results sent, the office log getting longer, the verified vendor file filling in.

**What can go wrong**
- The bookkeeper keys a payment without checking. Do not scold. Say: "Nothing is blocked. I would like to see the request next time before it is keyed."
- A hold arrives outside payment hours. Say so and promise the result at the start of the next payment day. Do not call outside hours.
- More than 1 in 10 requests holds. Loosen that office's thresholds first, with the owner's say-so. See the runbook, `pilot-kit/README.md`, section 5.
- You are sick or away. Tell every pilot office the day before. Say: "Holds wait until I am back. Nothing is blocked." Never let an office think silence means a clear.

### Weekly and Day 30

See "Weekly review" and "Day-30 read-out and renewal packet" at the end of Part 2.

---

# Part 2. How each service is performed

The same shape for each: what it is, the checklist you follow every time, the exact words, what gets recorded, the time budget, and the boundary lines.

## Service 1. The check

**What it is:** every payment request goes through the Mastiff page before it is keyed. The answer is PASS or HOLD with a one-line reason.

**How the bookkeeper uses the page**
1. Open the Mastiff page.
2. Enter five fields: payee, amount, request type, last 4 digits, how it arrived.
3. Read the answer.
4. PASS means carry on. HOLD means tell Mastiff.

**The three holds:** payee not on file, bank details changed, amount out of range. Nothing else holds on its own. Off-hours and urgency wording appear as cautions ("worth checking"). They hold only if one of the three is also present.

**When a request comes in by text or email instead (the bookkeeper sends it to you)**
1. Reply with the same two words every time: "Received. Checking." Do not say PASS or HOLD yet.
2. Enter it yourself, using only what the request says (payee, amount, request type, last 4, how it arrived), against the vendor details you hold for that office. [CONFIRM: whether you hold a copy of the office's vendor list; the office's page data stays in its own browser]
3. Send back the answer in the template below.
4. If it is a HOLD, go straight into service 2.

**Exact words, PASS:** "Checked [payee], [amount], at [time]. Result: PASS. Reason: [payee on file, same bank last 4, amount in range]. Mastiff flags. Your firm makes every payment decision."

**Exact words, HOLD:** "Checked [payee], [amount], at [time]. Result: HOLD. Reason: [payee not on file / bank details changed / amount out of range]. I am calling the number on file now and will send the result within the hour. Mastiff flags. Your firm makes every payment decision."

**Exact words, caution only:** "Result: PASS with a caution: [off-hours / urgency wording], worth checking. Mastiff flags. Your firm makes every payment decision."

**What gets recorded:** log fields 1 and 2 (the request, type, payee, amount) and 12 (a copy of the request). For a HOLD, the other fields fill in during service 2.

**Time budget:** 2 minutes per request on the bookkeeper's side. 5 minutes per request that comes to you.

**Boundary lines**
- Never move money. Never block. A PASS is not approval to pay; the office decides.
- Never say what an insurer requires.
- Last 4 only. If a request gives a full number, do not repeat it; enter only the last 4.

## Service 2. We make the calls

**What it is:** on every hold you call the vendor on the number already on file and send the result to the office within the hour during payment hours. The office's second person signs off.

**Checklist, every time, in this order**
1. Open the hold. Note the time you received it. (Fields 1, 2)
2. Find the number already on file. It must have been on file before this request arrived. Never use a number in the request, the invoice, an email signature, or a link. Write where the number came from and the date it was on file. (Field 3)
3. Check who received the request. You must be a different person from that person. (Field 5)
4. Call. Write down the time of the call. (Field 6)
5. Say the identification line below.
6. Confirm the specific change, not "is everything OK". Name the exact detail: new bank last 4, amount, payee.
7. Ask the name and role of the person answering. Confirm they are not the person who sent the request. (Field 7)
8. Read back what they said in your words and ask "Is that right?"
9. Write down what they said, at the time. (Field 8)
10. Record the four core fields: who called, which number, what the vendor said, the outcome. (Fields 5, 3, 8, 11)
11. Send the result to the office in the template below. The verification itself was a phone call, not email. (Field 4)
12. Remind them: the second person signs off, and it cannot be the person who entered the request. (Field 10)
13. The payment waits until the vendor has responded. The release time must be later than the call time. (Field 9)
14. Update the verified vendor file (service 3).

**Exact words on the call**
- Identify yourself: "Hello, this is Devin Martin. I am calling for [Office name], about a payment to [vendor]. Am I speaking with someone who looks after your payments or accounts?"
- State the specific change: "[Office name] has a request that says [vendor]'s bank details have changed to an account ending [last 4]. Did you or your office send that request?"
- Ask for the name and role: "Can I take your name and your role there?"
- Read back: "So you are saying that [you sent it / you did not send it / the correct last 4 is XXXX]. Is that right?"
- Close: "Thank you. [Office name] will be in touch."
- Never say a full account number aloud and never ask them to say one. Last 4 only.
- Never ask them to approve a payment. Ask only about the request.

**Message to the office (exact template, sent within the hour)**

> Called [vendor] on the number on file at [time], [date]. Number source: [contract / prior job / other], on file since [date]. [Name], [role], answered. They said: [confirmed the request / did not send the request / gave different details: describe]. Outcome: [confirmed / not confirmed]. Second sign-off is with [named second person]. Mastiff flags. Your firm makes every payment decision.

Say nothing about whether to pay.

**If there is no answer within the hour**
1. Note the time of the attempt. (Field 6)
2. Do not leave account details on voicemail. Leave only: "This is Devin Martin calling for [Office name]. Please call [number] back." [CONFIRM: your number]
3. Tell the office inside the hour, even with nothing else to report: "Called [vendor] at [time] on the number on file. No answer. Outcome: not confirmed. The payment stays on hold until we reach them."
4. Try once more later in the day and note that time too.
5. If still no answer by the end of payment hours, tell the office, and try again the next payment morning. The hold stays a hold. Never treat silence as a clear.

**If the vendor denies the change** ("we did not send that")
1. Say: "Thank you. I will let the office know."
2. Tell the office at once by phone, then send the template. Outcome: not confirmed. The vendor said they did not send the request.
3. In the log, write the outcome as: **"Record not paid."** with the reason "vendor says request was not theirs". (Field 11)
4. Ask the office: "Has any payment already gone to those details?"
5. If a payment may already have gone out, hand over the incident playbook (service 5). If not, say: "Nothing has left, so the playbook is for your reference only."
6. Keep the request copy, with full email headers if it was an email. Do not delete anything. (Field 12)

**If the vendor confirms but the number on file may be out of date:** do not take a new number from the person who answered. Tell the office the number on file may be wrong, and ask them to find another source for it (a contract, a prior job).

**What gets recorded:** fields 1 to 12.

**Time budget:** 10 to 15 minutes per hold including the message. Result inside 60 minutes from the moment you receive the hold, in payment hours.

**Boundary lines**
- Never say whether to pay. Never say "safe to release".
- Never move money or touch the office's bank or books.
- The second person at the office signs off. Not you.
- Never use a number from the request. Never leave account details on voicemail.
- [LAWYER] Mastiff making the call and writing log entries is an open legal question. Until answered, say in the message that the entries are "reported by" the office.

## Service 3. The verified vendor file

**What it is:** a list where each active vendor's phone and account last 4 have been confirmed by voice, dated, with the name of who confirmed it.

**A verified entry contains**
1. Vendor name as on the W-9 or contract.
2. Phone number confirmed.
3. Account last 4 confirmed.
4. Date confirmed.
5. Name and role of the person at the vendor who confirmed.
6. Who made the call, and which number was used.
7. Source of the callback number.
8. Next re-check date.

Never more than the last 4 of an account or tax ID.

**Checklist, after every callback**
1. Open the vendor's line in the file.
2. Fill in items 2 to 7 above.
3. Set the next re-check date.
4. Send the updated file to the office with the weekly review.

**How often to re-verify:** at least once a year, and again any time the bank details or phone number change, or a vendor quiet for more than 12 months sends a request. [CONFIRM: your chosen interval; 12 months is a suggestion, not a rule from any insurer]

**How the office receives it:** as a CSV and a printed page, with the weekly review, and in full on day 30. It belongs to the office. They keep it if they stop.

**Exact words when sending:** "Attached is the vendor file as of [date]. [N] of [N] active vendors are confirmed by voice. Entries marked 'not yet' have not been called. Mastiff flags. Your firm makes every payment decision."

**What gets recorded:** fields 3, 5, 7, 8 and 12.

**Time budget:** 5 minutes per vendor to update after a call. 30 minutes a week to tidy and send.

**Boundary lines:** do not tell the office a verified vendor is safe to pay. A line says a call took place and what was said, nothing more. Last 4 only.

## Service 4. New vendor onboarding

**What it is:** before the first payment to a new vendor, you match the W-9 name, confirm the vendor by phone and confirm the bank. The office decides whether to pay.

**Checklist, every time**
1. The office asks the vendor for a W-9 and sends it to you. The W-9 stays in the office's own files. Do not copy the tax ID anywhere. Last 4 only.
2. Match the legal name and business name on the W-9 to the payee name on the invoice. Note matched or not matched.
3. Call the vendor on a number the office already has from a source other than the invoice (contract, licence, prior job). Confirm who they are.
4. Confirm the bank account (script below).
5. Record last 4, date, who confirmed.
6. Tell the bookkeeper: "The first payment can be keyed" or "not yet, because [reason]". The office decides.

**W-9 request wording (the office sends this, or you draft it for them)**

> Hello [Name]. Before we set you up to be paid, please send a completed W-9 for [Vendor legal name]. Please do not send bank account details by email. We will confirm your payment details by phone on a number we already hold. Thank you, [Office name].

**Name match:** an exact match is a match. Differences in "LLC", "Inc." or punctuation: note them. A different name entirely: record "not matched, worth checking" and ask the vendor.

**Bank confirmation call script (to the vendor's bank)**
1. "Hello, this is Devin Martin, calling for [Office name], which is about to pay one of your business customers, [Vendor]. We would like to confirm an account. Can you tell me if the account ending [last 4] is held in the name [Vendor legal name]?"
2. If they confirm: write down the name of the person, the time, and what they said.
3. If they will not confirm: that is common. Go to the fallback.

**Fallback when the bank will not confirm**
1. Call the vendor on the number the office holds. Ask them to read out the account name (not the number) and confirm the last 4.
2. The office asks the vendor for a bank letter or a voided check, and keeps it in the office's own files.
3. Record: "bank would not confirm; vendor confirmed by phone; bank letter requested". Mark the entry as phone-confirmed, not bank-confirmed.
4. [CONFIRM: any wording your lawyer wants on what to say to a third-party bank] [LAWYER]

**What is kept and where**
- The W-9 stays in the office's own files. Mastiff does not copy it.
- Mastiff keeps: vendor name, last 4, date, who confirmed, the call notes.
- Never a full account number or tax ID.

**Construction variant (subcontractors)**
- Ask for the certificate of insurance (COI) and the sworn statement listing the sub's suppliers and workers, per job.
- Look for: COI missing, expired or expiring within 14 days; a lien waiver name that does not match the vendor name on file; payments above the contract amount on the sworn statement.
- These are cautions only, worded "missing" or "worth checking before paying". They never create a hold on their own.
- Mastiff does not file, track or advise on liens and gives no legal advice.
- You run these by hand from a register until the office has used it. Blank register: `python -m lookback subs --template register.csv`.

**Exact words, construction request:** "Before the first payment, please send your insurance certificate and your sworn statement for [job]. This is a routine step for every sub."

**What gets recorded:** fields 2, 3, 5, 6, 7, 8 and 13 (new-account checks), and 12.

**Time budget:** 30 to 45 minutes of work per new vendor, spread over a day or two, because you wait on documents.

**Boundary lines:** never say a vendor is "approved". Never copy a tax ID. Never push the office to pay. Never say what an insurer requires. Last 4 only.

## Service 5. If a payment goes wrong

**What it is:** a one-page playbook for the first 24 hours after a payment may have gone to the wrong account, and your help with the records.

**When to hand over the playbook:** (a) at kickoff, as a standing copy for the owner; (b) at once, if an office tells you a payment may have gone to the wrong account, or a vendor says "we did not send that".

**Checklist when an office calls**
1. Stay calm and slow. Say: "Thank you for telling me. Let us go through the first two steps now."
2. Give them `incident-playbook.html`. Read steps 1 and 2 with them and stay on the phone while they call their bank.
3. Ask them to write down the time and the name of every person they speak to.
4. Tell them the other steps are for the owner and the bookkeeper, in order.
5. Tell them what you will send: the log export and a dated list of every callback on record. [CONFIRM: how and when you will send]
6. Keep your own call notes, with the time.
7. Within 24 hours send the log export and the dated callback list.

**Exact words**
- "I am sorry to hear it. The playbook has the first steps. Please call your bank now and I will stay on the line."
- "I cannot say whether any money will come back. Your bank and your broker can tell you what happens next."
- "Your broker can tell you what your policy needs."

**What not to say**
- Do not say money will come back.
- Do not say the policy will cover it, or what the policy requires.
- Do not say whose fault it was, or that anyone was careless. Say what the record shows: times, numbers, names.
- Do not give legal advice. The playbook is a checklist, not legal advice.
- Do not tell them to delete or change anything.

**What gets recorded:** fields 1 to 12 as they stand, plus 13 (incident time).

**Time budget:** the first call 30 to 45 minutes. The export and callback list within 24 hours.

**Boundary lines:** no promise of recovery, no coverage advice, no statement of what an insurer requires. Mastiff flags. Your firm makes every payment decision.

---

## Weekly review

**When:** the same day each week, 30 minutes. Bookkeeper and, ideally, owner.

**Checklist**
1. Ask the bookkeeper for the Export CSV from the Log tab. Do not ask them to clear anything.
2. Run:

        python -m lookback readout log.csv --out reports/<office>-weekN --org "<Office name>"

3. Go through the open holds together. For each: why it held, who called, what was said, who signed off, the outcome.
4. Look at: how many held, how long holds took, which vendors are now confirmed by voice.
5. If more than 1 in 10 requests holds, loosen that office's thresholds, with the owner's say-so.
6. Send the updated verified vendor file.
7. Ask: "Is anything slowing you down?" Fix that first.

**What can go wrong:** the export is empty or missing. Ask them to check they used the same browser. If data is lost, say so plainly and carry on from your own call notes.

## Day-30 read-out and renewal packet

**Time:** 45 minutes to prepare, 30 minutes with the owner.

**Checklist**
1. Run:

        python -m lookback readout log.csv --out reports/<office>-day30 --org "<Office name>" --start YYYY-MM-DD --end YYYY-MM-DD

2. Gather the packet: the one-page read-out; the verified vendor file; the log set beside the questions carriers commonly ask on applications. The read-out says on its face that it is not coverage advice.
3. Hand the packet to the owner for their broker. Say: "Your broker can tell you what your policy needs."
4. Walk it: what held, what was confirmed, how long holds took, how many vendors are now confirmed by voice.
5. Ask for their decision: continue, stop, or stop and keep the file.
6. If they continue, quote a flat monthly price. [CONFIRM: the price] Say: "The pilot was free. No card, nothing renews." No pricing is on the site.
7. If they stop: they keep the vendor file and the log. They have 30 days to export; you then delete their records within 30 more days and confirm in writing. Keep only your own agreement and billing records. [LAWYER: wording of the deletion confirmation]

**What not to say:** that the log satisfies an insurer; that a claim would pay; that anything was stopped. Say what the record shows.

---

# One-page quick card

1. PASS: carry on. HOLD: Mastiff calls.
2. Call the number on file, never the one in the request.
3. Say who you are, name the exact change, ask name and role, read back.
4. Send the result within the hour. Say nothing about whether to pay.
5. No answer: say so and hold.
6. Vendor denies: "Record not paid", and the playbook if money may have left.
7. Last 4 only, always.

Mastiff flags. Your firm makes every payment decision.

## Open items before first use

- [CONFIRM] your phone, your email, how the office reaches Mastiff, your hours.
- [CONFIRM] demo page hosting method; Michigan LLC; insurance cover.
- [CONFIRM] how files reach you; how you work on requests that come by text or email.
- [CONFIRM] flat monthly price for day 30.
- [LAWYER] agreement review; Mastiff making calls and writing entries; the deletion confirmation wording; wording to a third-party bank.
