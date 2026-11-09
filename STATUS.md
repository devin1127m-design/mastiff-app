# Where Mastiff stands — parked 2026-11-09

Devin put Mastiff on the back burner on Nov 9, 2026, after the first two people asked for a payment file (his mom, for her school; Dan, his boss) both said "I don't want to share that." The read: the product is sound, the problem is real, and a sixteen-year-old cannot carry the trust a payment desk needs. He plans to come back to it older, with the thing already built. Nothing is deleted. Nothing costs money to leave running.

## What exists, live, at zero cost
- **mastiffdesk.com** (Cloudflare, paid through Nov 5 2027; Vercel Hobby; Supabase free tier). Front page, how it works, pilot form, about, legal.
- **mastiffdesk.com/scan**: the look-back in the browser. Anyone can pick a CSV and read the report; nothing is uploaded. This is the one page that can quietly produce a lead while nobody is looking. The pilot form writes to `leads`; Devin sees them on the Desk when he signs in.
- **The app**: every roadmap step, 1 to 10, built and deployed. Email door, photo read, the thread, vendor memory, read-out, QuickBooks read-only, instructions, subs, partner portal. Reviewed twice by Jarvis (Claude Code); all findings fixed. Tests run on every build.
- **Mail**: Resend verified on the domain; holds and callbacks email the office; Monday digest cron. Never exercised by a real office.
- **Zero offices in production.** Devin is the only staff row.

## What was never done
- No real office ever forwarded a real invoice. The AI read, the known-sender rule, the duplicate window and the confidence threshold are all untested on real data. `plans/review-2026-11-07-for-eris.md` section 3 says how to score the first real file.
- The 6-digit sign-in code (needs Supabase custom SMTP pointed at Resend; `WIRING.md` step 5).
- QuickBooks credentials (Intuit developer app; `WIRING.md` step 6).
- LLC, lawyer on the agreement (`pilot-kit/`), E&O and cyber insurance. Do these before any paying client.
- Google Voice number; the one-pager and site still have no phone.

## If it comes back
1. Read `CLAUDE.md` (the rules and what is built), then `WIRING.md`, then `plans/review-2026-11-07-for-eris.md`.
2. Rotate every key before anything else: Anthropic, Resend, the inbound secret, CRON_SECRET. They were set in Vercel in Nov 2026 and some passed through chat.
3. The first ask is never "send me your payments." It is "run mastiffdesk.com/scan yourself." The second is "forward the next bill and watch." A file comes third, if ever.
4. The first customers come through someone else's trust: a CPA or bookkeeping firm, or a family name on the intro. Cold is the hardest version; it was the only version tried.
5. The Study Guide (Claude Docs, "Mastiff Study Guide") has the whole business explained, including who sees what and the nineteen questions owners ask.

## The one line
"You don't think about accounts payable until it's time to hit pay." Mastiff flags. Your firm makes every payment decision.
