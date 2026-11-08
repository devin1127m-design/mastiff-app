# Review for Eris, 2026-11-08: answers to the eight questions

Jarvis, against main at 577f063. Read-only; nothing changed. Ordered by what I would do first. Each answer ends with the change, with file and line where there is one.

## 1. A: the inbound route

Keep the API pull. Resend's `email.received` payload is a notice, not the mail; the documented way to the attachment is the receiving API and its download URL, which is what you do. Reading content off the webhook body would tie us to an undocumented shape.

Fail-open check: it fails closed where it matters. Unset `RESEND_WEBHOOK_SECRET` is 401 in production (`route.ts:18`), timestamp window and `timingSafeEqual` are right, `MASTIFF_INBOUND_SECRET` empty is 503. Change these:

- `route.ts:39` `JSON.parse(raw)` sits outside the try. A valid signature on a malformed body is a 500, and Resend will retry it for a day. Wrap it and return 400.
- `route.ts:73-81` every attachment failure is a silent `continue`, and the mail files as `no_attachment` with nothing created. Make sure Desk "Email in" shows `no_attachment` and `no_office` rows in their own colour, and that a failed fetch (`:58` not ok) sets `read_error` so a person sees it. Today a Resend outage looks like "no invoices arrived".
- `005_mail.sql` `receive_email` stores `left(p_body, 20000)` unmasked, and the route stores `from`, `to`, `subject` raw. Run the same last-four mask you added for free text over the body and subject before the insert. Vendors paste full account numbers into email bodies all the time.
- `015_review_a.sql:30` matches the office on the local part of any `to` address and never checks the domain. Resend only delivers for our domain today, so it is safe, but check `@mastiffdesk.com` in SQL anyway so a future second domain cannot alias an office.
- `route.ts:87` drops images under 30KB as logos. Fine. A real phone photo is never that small.

## 2. B: known sender for straight-through

Right call, keep it. The promise is to the owner, and the owner never sees a tap; the bookkeeper does, once per vendor, ever. The first invoice from a vendor not on file taps anyway (payee not on file), so the only extra tap this rule adds is the first emailed invoice from a vendor the office imported by CSV or QuickBooks. One tap per vendor, then silence. That is the right price for not letting anyone who learns `office@mastiffdesk.com` put a passed request in the log.

One change: the known domains are derived on every email by joining `inbound_emails` to passed requests (`015_review_a.sql:34-40`). Store it instead. Add `vendors.sender_domains text[]`, append the domain when a tapped intake is confirmed, and read it in the route. It is explicit, the office can see and edit it on the vendor page, and it is what step 5 calls "sender domain" anyway.

## 3. H: the 14-day duplicate window

Do not change it on one file. Score the first real result like this, in the look-back report for that one scan:

- Every flagged pair gets a mark. Precision is confirmed or recovered divided by flagged. Write that number at the top of the report.
- Add a second, unflagged list for this scan only: same payee, same amount, 15 to 45 days apart. That is where monthly bills live, and it is the whole false-positive risk of widening the window. Count them, do not flag them. If the 15-to-45 list is mostly rent and utilities, 14 stays. If it holds a real duplicate the office confirms, widen to 21 and re-score on the second office.
- `lookback/[id]/page.tsx:79` says the marks teach the next scan. Nothing reads `lookback_marks` (`scan.ts`, `memory.ts`). Either change the sentence to "marks are kept with the report" or wire one rule now: a pair marked "legitimate repeat" suppresses same payee plus same amount in the next scan for that office. The copy must not promise what the code does not do.

## 4. C: what the thread hands the model

Where it breaks, in order:

- `ask.ts:34` cuts the string at 150,000 characters from the tail. 400 request rows run about 170,000 characters, so the cut lands around row 340 and removes the oldest requests and then the whole lookbacks section, silently. The most useful summary in the context is the first thing lost.
- Cost and time. 55 to 65k input tokens per message; the ephemeral cache saves most of it within five minutes, then every new question pays in full. The 25-second timeout is tight on a 60k prompt.
- At 400 requests a year the hard cap at 400 rows is already one busy office.

Pre-aggregate, and reorder:

1. Settings, then vendors, then a per-vendor table: count, total, last date, holds, last four on file, usual range. Always sent. A few thousand tokens for any office size.
2. Every hold in the window, in full (reasons, callback, decision). Holds are what the owner asks about.
3. The last 60 requests in full.
4. Lookback summaries.
5. If the question names a vendor (match `nameKey` of the message against the vendor list before the call), add that vendor's full request history. That is the one retrieval step you need; it costs a string match, not an embedding.

Then the cap never trips, and "what did we pay Pinecrest this year" is answered from a line in the table instead of the model summing 40 rows.

## 5. D: bank-description merging

A cheaper safeguard than a mark: merge only when the stripped suffix looks like a place or a store number. Build the list from what `TRAIL_LOC` already knows (Michigan city words, two-letter state, digit runs, `#1234`, phone patterns). "Lake", "Auburn", "Oxford", "Hills" pass; "Rental", "Supply", "Pro" fail, so "Metro Fasteners Rental" stays its own payee and "Home Depot Pro Lake" still folds into "Home Depot Pro". Add a second guard: never merge when the suffix word appears anywhere in the file as its own payee or as the first word of one. Keep the mark on the report for the rest; add a test for "Metro Fasteners" versus "Metro Fasteners Rental" in `bank.test.ts`, which has no negative case today.

## 6. G: site copy against rule 3

- `legal/page.tsx:24` "We catch three patterns." "Catch" is on the never list. "We check for three patterns."
- `page.tsx:67` "Most offices find some" and `pilot/page.tsx:16` "Most offices find money." There are zero offices; we cannot say "most". "Offices usually find something worth a look" is still a claim. Cut both sentences until three real scans back them, then write the real number.
- `page.tsx:76` the stat tile carries "AI-enabled fraud attempt". It is the survey's wording and the footnote marks it vendor-sponsored, but it is the one place "fraud" appears in Mastiff's own voice on the page. Keep the citation in the footnote; on the tile write "said their company faced an AI-enabled payment attempt in the past year", or drop the tile and keep the two with primary sources (FBI, CFC).
- `pilot/page.tsx:18` "the questions carriers ask on the application." Descriptive, not a requirement; passes. Keep "Ask your broker" beside it as the legal page does.
- `page.tsx:77` "the callback its own policy required" is the firm's own policy, not an insurer's. Passes.
- The sentence is on every page through `SiteShell.tsx:22`. Good.

## 7. E: spam on the pilot form

Non-problem at this size, with two cheap fixes and one real bug:

- `actions.ts:475` the insert error is not checked, so a failed insert still shows "sent". Check it and show the phone number to call instead.
- Add a hidden `started_at` timestamp; reject under three seconds. Catches most bots the honeypot misses, costs nothing.
- A partial unique index on `lower(email)` for the last 24 hours (`create unique index ... where created_at > now() - interval '1 day'` is not allowed; use a trigger or just `on conflict` with a `(lower(email), date_trunc('day', created_at))` unique index). Stops the same bot filing a thousand.

Vercel's WAF rate rules are Pro-plan. Not worth it before the first spam lead. Staff-only read is right.

## 8. F: the phone tab bar

Five fixed tabs is right; a hamburger hides the one thing the bookkeeper does (Send). The owner on a phone can reach Home, Send, Mastiff, Log, Vendors from the bar. Settings, Read-out, Look-back and Subs are not on the bar; your note says a More grid on Home carries them, and the reader did not find it in `Shell.tsx`, so confirm it is on `/app/page.tsx` and that it includes Settings (the owner's cap and hours) and Sign out. Nothing else falls out of reach: the decision form is on the request page, reached from Log, and partners' Offices switcher is on the bar when it applies.

## Not asked, noticed

- My 2026-11-05 review file still carries the line asking you to set `CRON_SECRET`; you did. Ignore it.
- Zero offices in production is the right state to start the school. Before the export arrives, make one Test Office again with the three members' real emails so the first forwarded invoice has somewhere to land and the hold email has someone to reach.
