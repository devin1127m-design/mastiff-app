# Review for Eris: what still needs fixing (checked against 1ae79d8, 2026-11-05)

Jarvis read every file in `src/` and `supabase/003` to `014` after steps 1 to 10 landed, then re-checked each item against the current main. Nothing in the code was changed. The Anthropic key and the domain are now live, so the first block matters more than it did yesterday. Fix in this order; each is small.

## A. Fix before any office is invited

1. **Owner's Settings save does nothing.** `supabase/schema.sql:112` `orgs_write` is staff-only. `saveSettings` (`src/lib/actions.ts:159`) ignores the error, so the owner's cap and hours are silently dropped. Add an owner-role write policy on `orgs` (or a security-definer function) and show the error on the page.
2. **Cron routes fail open.** `src/app/api/notify/route.ts:10` and `digest` only check the bearer token if `CRON_SECRET` is set. It is unset in Vercel, so anyone with the URL can trigger the sends. Return 401 when the secret is unset. Devin asks that you handle the key too: generate a long random `CRON_SECRET`, set it in Vercel for all environments the way you did `ANTHROPIC_API_KEY`, redeploy, and tick it off in WIRING.md. Nothing on this item waits on Devin.
3. **Role checks exist only in the UI.** `schema.sql:122` `requests_update` and `:130` `decisions_write` allow any office member. The approver-only decision and the owner-only settings should be enforced in the policies by `memberships.role`.
4. **Any member can queue mail to any address.** `005_mail.sql:53` `notifications_insert` has no check on `to_email`, and it sends from mastiffdesk.com. Restrict inserts to the triggers (security definer) or to the org's own members' addresses.
5. **No time zone.** `rules.ts:73-75` uses `getHours()`/`getDay()`; Vercel runs in UTC, so a 3 pm Michigan request gets the off-hours caution and every time shown to an office (`org.ts:18`, `requests/[id]/page.tsx:142`, `mail.ts:57`, `ask.ts:28`) is five hours off. Add `orgs.timezone text default 'America/Detroit'` and use it everywhere a time is read or formatted.

## B. Rule 5 and the holds

6. **Emailed invoices pass with no sender check.** `005_mail.sql:107` files a confident read of a vendor on file as `passed`. Anyone who learns `<slug>@requests.mastiffdesk.com` can put a passed request in the log. Put an allowlist in front of straight-through: the vendor's known sender domain or the office's own members; anything else goes to `intakes` for a tap.
7. **Missing usual range skips the pattern check.** `intake.ts:93-94` only compares when `usual_min/max` are set, so a vendor with no range goes straight through at any amount under the cap. Treat a null range as "needs a tap" until memory fills it.
8. **QuickBooks vendors arrive verified.** `qbo.ts:80,83` sets `phone_on_file_since = today` on pulled vendors. They then never trigger "payee not on file", and with item 7 they pass straight through. Pulled vendors should land unverified (`phone_on_file_since null`, note "From QuickBooks, number not yet confirmed").
9. **Look-back counts a fourth hold.** `lookback/scan.ts:74` labels a round first payment of $1,000+ "would have held" and it feeds the headline. The live check would not hold it. Call it a caution.
10. **Bookkeeper waits on mail.** `actions.ts:112,139` `await flush()` before the redirect, up to 20 Resend sends. Fire and forget; the cron sweeps. The model calls in `intake.ts` and `ask.ts` have no timeout; add `AbortSignal.timeout(20_000)` and fall through to "needs a tap" / "could not answer".

## C. Data and wording

11. Free-text fields are never cut to last four: `requests.note`, `callbacks.what_said`, `vendors.notes`, `decisions.note`, QuickBooks `PrivateNote` (`qbo.ts:97`). `intake.ts:55` masks digits in `notes` only, not `payee` or `invoice_no`. One helper, applied on every write.
12. `log/page.tsx:18` "This is the record your insurer and your CPA ask for." States what an insurer asks for; cut the sentence.
13. The hold and callback emails (`005_mail.sql` / `014_domain.sql` bodies) do not carry the exact sentence "Mastiff flags. Your firm makes every payment decision." Add it as the last line of every outbound email.
14. `feed.ts:35` "Held {payee}" should read "Would have held".
15. `desk/page.tsx:105` promises a 6-digit code; login sends a link until Resend SMTP exists (WIRING 5).

## D. Smaller

16. `importVendors` (`actions.ts:55-62`) upserts null `callback_phone`/`account_last4` over existing vendors when the CSV lacks those columns, and splits on bare commas.
17. `inbound/route.ts:63-78` reads the first PDF or image attachment (a signature logo wins over the invoice); `:42` uses only `to[0]`.
18. `log/export/route.ts:5` escapes quotes but not leading `=`, `+`, `-`, `@` (spreadsheet formulas); payees come from invoices and QuickBooks.
19. `vendors/page.tsx:12` treats `passed` as paid when learning the range; `confirmed`/`released` only is safer.
20. `settings/page.tsx:21` shows `?msg=` from the URL as a notice; whitelist like `qbo` is.
21. Style: `desk/page.tsx:42` "⚠" glyph; `globals.css:7,30` #d9d9d9 and #fafafa are outside black, white, #6B6B6B.

## E. Tests never run

Five assert scripts (`intake`, `mail`, `memory`, `readout`, `lookback/port`) with no runner, no `test` script in `package.json`, no `tsx` dependency. `next build` only typechecks them. Add `"test": "tsx src/lib/**/__tests__/*.test.ts"` (devDependency `tsx`) and run it in the Vercel build command, or they never execute anywhere.
