# Site TODO

## Go live (steps are in README.md)

- [ ] Buy the domain, then replace the `DOMAIN` placeholder (`https://DOMAIN/`) in `sitemap.xml` and `robots.txt`.
- [ ] Connect Supabase: run `supabase/leads.sql`, put the project URL and anon key in `config.js`, redeploy.
- [ ] Connect Resend: verify the domain (three DNS records), set the secrets, deploy `supabase/notify-lead.ts` as an Edge Function, add the Database Webhook on INSERT into `leads`.
- [ ] Fill `contactEmail` in `config.js`.
- [ ] Test the pilot form end to end on the live domain (row in Supabase, email received).
- [ ] Lighthouse check on mobile.

## [CONFIRM] items (rendered without the marker; confirm or replace)

1. Form intro, `pilot.html`. Copy: "Tell us who you are. We reply within two business days to book the call. [CONFIRM: reply time]". Rendered as "...within two business days...". Confirm the reply time.
2. ~~About: surname and background~~ DONE 2026-10-28 (Devin Martin; managed a construction company's finances).
3. About, `about.html`. Copy: "Contact: [CONFIRM: contact email]." The sentence is not rendered. Add the contact email.
4. Footer, all pages. Copy: "Mastiff · Oxford, Michigan · [CONFIRM: contact email]". Rendered without the email. Add the contact email.
5. Legal, `legal.html`. Copy: "Effective date: [CONFIRM: date of publication]". Rendered as "Effective date: not yet published." Replace with the date.
6. Legal, "Privacy: who we are". Copy: "Questions about this page go to [CONFIRM: contact email]." Rendered as "...go to us through the pilot form." Replace with the email.
7. Legal, "Privacy: your choices". Copy: "Email [CONFIRM: contact email]." Rendered as "Contact us through the pilot form." Replace with the email.

## [LAWYER] items (rendered without the marker; counsel to review before launch)

1. Legal, meta description (`<meta name="description">`): "What Mastiff stores, what it does not, and the terms of the service. [LAWYER]".
2. Legal, Status: "This page has not yet been reviewed by counsel. Sections marked [LAWYER] must be reviewed before launch." Rendered: first sentence only. Remove it once counsel signs off.
3. Legal, "Privacy: who we are": "[LAWYER] confirm the legal entity name once the Michigan LLC is formed." Not rendered. Update "Mastiff ("we", "us")" with the entity name.
4. Legal, "Privacy: service providers": "...They process data on our behalf. [LAWYER] confirm the data-processing terms and the list of providers before launch."
5. Legal, "Privacy: security": "...and we cannot promise otherwise. [LAWYER]"
6. Legal, "Privacy: how long we keep data": "for [LAWYER: retention period] after it stops." Rendered as "for a set period after it stops." Insert the retention period.
7. Legal, "Privacy: your choices": "[LAWYER] confirm response time and exceptions." Not rendered.
8. Legal, "Terms: what flags mean": "...and may hold one that is genuine. [LAWYER]"
9. Legal, "Terms: the pilot": "...requires a separate written agreement. [LAWYER]"
10. Legal, "Terms: no warranty": "...flag every improper request. [LAWYER]"
11. Legal, "Terms: limit of liability": "limited to [LAWYER: amount or "the fees you paid us, which for the pilot is none"]." Rendered with the second option ("the fees you paid us, which for the pilot is none"). "[LAWYER] confirm enforceability and wording." is not rendered.
12. Legal, "Terms: governing law": "...courts located in Oakland County, Michigan. [LAWYER]"
13. Legal, "Terms: changes": "...email active pilot offices. [LAWYER]"

## Before launch (from the copy file's developer notes)

- [ ] Re-check the live source pages for footnotes 1, 3 and 4 (Certos, CFC, SeedPod); those quotes came through a summarizer.
- [ ] Confirm the IC3 report publication date on ic3.gov (footnote 2).
- [ ] Footnote 6 refers to the "R3 competitor teardown". Decide whether to publish a summary or reword the pointer.

## Verification-desk copy (2026-10-30)

About and legal describe the five services (calls made by Mastiff, verified vendor file, new-vendor onboarding, incident playbook). Records stored: payee, amount, last four, callback record (who called, number, what was said, approver); files deleted on request at the end of the pilot. [LAWYER] A Michigan lawyer must review "Terms: what the service is", "your responsibilities", the retention period and the deletion-on-request wording with the R5 engagement terms before any real file arrives.
