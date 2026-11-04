# Product: Mastiff (Layer 3, stable)

Rewritten 2026-11-04 to the direction in decisions.md (entries dated 2026-11-03 and 2026-11-04).
Those entries override older ones. Change this file first, then the site.

## Purpose

Mastiff is the office's accounts payable desk. Bills and payment requests reach it by email,
photo or the office's books without anyone keying them. Mastiff reads each one, checks it,
keeps the verified vendor file, suggests who to call, and prepares the payment run. The owner
hits pay, nothing else. The office makes every payment decision, in its own bank or books.

## The boundary that never moves

- The owner releases every payment, in their own bank or books. In Devin's words: "the owner
  hits pay, nothing else."
- Mastiff holds no bank credentials and no signing authority, and stores no password.
- Mastiff has no release button, and no button wired to the bank or the books that moves money.
- Mastiff never touches a bank's money-moving side. No payment initiation, no positive pay
  connection, no bank API that can send funds.
- Mastiff is advisory. Mastiff flags. Your firm makes every payment decision.

R5 2.6 lists the lines that keep Mastiff advisory. Items 1 and 3 (Mastiff staff making the
callback, Mastiff writing log entries) are overridden for the pilot and still need a Michigan
lawyer's confirmation before real files arrive. [LAWYER]

## What Mastiff does, in the order a bill flows

1. **Intake.** The office forwards a bill to its Mastiff address (slug@requests.mastiff.app),
   sends a phone photo, or connects its books. No keying.
2. **Read and extract.** Claude reads the body and attachments and pulls out payee, amount,
   last 4 of the account, invoice number and any request to change bank details. The result
   is a request in the same form as one typed by hand.
3. **Check.** Three things hold on their own: payee not on file, bank details changed, amount
   out of range. Two things are cautions: outside payment hours, and urgency wording. A
   caution holds only when combined with one of the three. The seven look-back rules and the
   money findings (possible duplicates, late fees and interest, missed discounts) run over
   history, in the app as in the look-back script.
4. **Verified vendor file.** Every callback is recorded against the vendor with its number,
   its source and the date it went on file. Over the pilot the office owns a vendor list where
   each active vendor's phone and account last 4 were confirmed by voice, dated and named.
5. **Call suggestions.** On a hold, Mastiff suggests when and whom to call: the vendor, the
   number already on file, the best time. In v1 Devin makes the call and records the four
   fields (number called, who answered, what they said, outcome). The caller is never the
   person who received the request. Voice automation is deferred.
6. **Prepare the payment run.** Mastiff assembles what is ready to pay, what is held and why,
   and what is waiting on a call, for the owner to review.
7. **The owner releases** in their own bank or books. Mastiff does not see the button.
8. **Record everything.** Each step is written to the log with the 13 fields of the hold
   record (see stages/01-define/output/r1/requirements-matrix.md, "What the log must record"):
   request received, type and amount, callback number and its origin, channel of verification,
   caller, every attempt, who answered, what they said, hold status, second approver, outcome,
   documents retained, optional new-account checks. The log is the office's record and exports
   as CSV and a printable page.

## Transparency

- **Live activity feed.** Every action Mastiff takes appears as it happens: what, on which
  request, when, and whether it can be undone.
- **Overridable.** The office can reverse a reversible action from the feed. Mastiff records
  the reversal.
- **Takeover.** The office can take over any request. Mastiff stops acting on it until handed
  back.
- **Talk to Mastiff.** The owner can ask questions, give instructions and set preferences in
  chat. Preferences are remembered per office and shown back on request.
- **Beyond payments.** Over time Mastiff may be asked about the bills it can see: what is due
  this week, what was paid to a vendor last year, which vendors lack a confirmed phone. It
  stays advisory, answers only from the office's own data, acts only within what the owner
  authorised, and carries the advisory line in every verdict and chat reply. It does not
  advise whether a held payment is safe to release, and it does not say what an insurer
  requires.

## Connections

Rule: anything the owner can authorise with their own login. Read by default; write only where
the plan says so. Never a stored password, never a bank's money-moving side, no desktop
software installed in v1.

- **v1 list:** QuickBooks Online (first), Xero, Gmail, Microsoft 365.
- **Writes (QuickBooks, Xero):** create or update a bill, or mark one for payment, only if the
  plan says so. Never pay.
- **Deferred:** QuickBooks Desktop, banks (read-only bank feeds are a later decision).
- **Site sentence:** "Mastiff connects to the tools you already use, with your login, and
  never to your bank."

## Model and memory

- Claude through the API, called from inside the Vercel app. No local model, nothing installed
  on client machines. The books live in the cloud and hosted models read bills and converse
  better than small local ones.
- Per-office memory lives in Supabase (preferences, conversations, the event feed), not in the
  model. Row-level security keys everything to the office.
- Zero-data-retention for the API is to be stated in the client agreement. No client file goes
  into a consumer AI app. [LAWYER]
- Last 4 only: no account or tax ID longer than 4 digits is accepted or stored, including from
  extracted text.
- The archived mastif/ agent (Claude API loop with tools, memory, approval gate) is the
  reference design. Its ideas move into the app; its code stays archived.

## Rules

- **Rule zero, unchanged:** never slow the bookkeeper. A request takes under two minutes of
  the bookkeeper's time, and PASS is silent.
- **Rule 5, rewritten:** a person confirms payment, not every extraction. The owner releases
  every payment; Mastiff may read, record and prepare without a person confirming each field,
  and every extraction stays visible and correctable in the feed.
- **Wording, unchanged:** flags say "would have held," "worth checking" or "missing." Never
  "fraud," "you were hit," "illegal," "caught," "prevented" or "saved." Every verdict screen
  and chat reply says: "Mastiff flags. Your firm makes every payment decision."
- **Last 4, unchanged:** never accept or store more than the last 4 digits of an account
  number or tax ID.
- Only the three holds hold on their own. Mastiff never states what an insurer requires.
- Style: black, white, one grey (#6B6B6B), serif headlines, Inter body; no gradients, icons,
  emoji, stock images, fake logos or testimonials.
- Anything not in a plan goes to LATER.md.

## The pilot

Free for 30 days, no card, nothing renews. Stop any day with one message. Day 30: a one-page
read-out, then the office decides. No pricing on the site. The first five offices are a hard
cap while one person works the call queue.

The five services stay: (1) the check, (2) call suggestions and recorded callbacks, (3) the
verified vendor file, (4) new vendor onboarding (W-9 name match, last 4 only, bank confirmed
before the first payment), (5) the incident playbook for the first 24 hours. New in the pilot:
the per-office intake address and the live activity feed. The look-back scan on 18 months of
payments comes first.

## Success

Observable, by day 30 of a pilot office:
- Bills arrive by email or photo without keying, and the request exists within minutes.
- Every hold has a callback entry and a second name in the log before any release.
- The bookkeeper's time per request stays under two minutes; PASS never interrupts them.
- The feed shows every Mastiff action, and the office has used override or takeover at least
  once, or been shown how.
- The vendor file has voice-confirmed phones for the active vendors.
- At least one pilot converts at day 30. No payment released to an account not on file.

## Open questions (move to decisions.md when settled)

- What the Gmail and Microsoft 365 connections may do beyond reading the Mastiff address.
- Whether Mastiff ever writes "mark for payment" in QuickBooks Online, and what the lawyer says.
- Zero-data-retention wording in the agreement; subprocessor schedule naming the AI service.
- Whether the owner's chat instructions count as "authorised" for each action class.
- Flat monthly price, and when voice calls come back onto the table.
- Hosting cost once real files arrive (Supabase Pro, Vercel Pro) per R5 5.1.
