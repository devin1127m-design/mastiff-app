# Wiring: what Devin does to switch each part on

Everything in the roadmap is built and deployed. Each piece waits on one of the keys below. Set keys in Vercel → mastiff-app → Settings → Environment Variables (all environments), then Deployments → Redeploy. Never paste a key into chat with anyone else, a commit, or the repo.

## 1. The AI read, questions and instructions (do this first)
- console.anthropic.com → API keys → Create key.
- Vercel: `ANTHROPIC_API_KEY` = the key.
- Switches on: photo/PDF read, Ask Mastiff, Instructions.
- Test: New request → Take a photo of any bill → it should land on "Confirm this one" or straight on the request page.

## 2. The inbound secret (already generated)
- Vercel: `MASTIFF_INBOUND_SECRET` = the value Eris sent in chat on Nov 4. The matching value is in the database.
- Switches on: nothing visible yet; the email route and the sender need it.

## 3. The domain (done Nov 5: mastiffdesk.com on Cloudflare, attached to Vercel, DNS A 216.198.79.1 + 64.29.17.1, CNAME www → a5168e3ce1278061.vercel-dns-017.com, proxy off)

## 4. Resend (mail in and out)
- resend.com → sign up → Domains → add the domain → add the DNS records it gives (SPF, DKIM, MX for receiving). Wait for "Verified".
- API keys → Create → Vercel: `RESEND_API_KEY`.
- Vercel: `MAIL_FROM` = `Mastiff <desk@mastiffdesk.com>`.
- Receiving: Resend → Receiving → enable for `requests.mastiffdesk.com` (or the root domain, then the address is `<office>@mastiffdesk.com`; tell Eris which).
- Webhooks → Add → URL `https://mastiffdesk.com/api/inbound` (or the vercel.app URL) → event `email.received` → copy the signing secret → Vercel: `RESEND_WEBHOOK_SECRET`.
- Vercel: `CRON_SECRET` (set by Eris Nov 5; protects the daily cron routes).
- Switches on: forwarding to `<office>@requests.mastiffdesk.com`, hold and callback emails, the Monday digest.
- Test: forward a PDF invoice to the Test Office address; Desk → "Email in" shows it.

## 5. Sign-in by 6-digit code (needs 4)
- Supabase → Authentication → Emails → SMTP settings → enable custom SMTP with Resend (host `smtp.resend.com`, port 465, user `resend`, password = the Resend API key, sender = `desk@mastiffdesk.com`).
- Then tell Eris: the sign-in switches from the link to a code (one commit).

## 6. QuickBooks (when the second paying office asks)
- developer.intuit.com → Create app → QuickBooks Online and Payments → Keys & credentials.
- Redirect URI to add there: `https://mastiffdesk.com/api/qbo/callback` (and the vercel.app one while testing).
- Vercel: `QBO_CLIENT_ID`, `QBO_CLIENT_SECRET`, `QBO_ENV` = `sandbox` until Intuit approves production.
- Test: Settings → Connect QuickBooks with the sandbox company → Pull.

## 7. Not keys, but still yours
- Business phone (Google Voice) and email → one-pager, site, Google Business Profile.
- LLC (Dad as organizer), lawyer review of the agreement, E&O + cyber quotes.
- The bank export from work (Nov 5) → Look-back in the Test Office; tell Eris what looked wrong.

## Env var list, for checking
`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` (set), `ANTHROPIC_API_KEY`, `MASTIFF_INBOUND_SECRET`, `RESEND_API_KEY`, `RESEND_WEBHOOK_SECRET`, `MAIL_FROM`, `CRON_SECRET`, `QBO_CLIENT_ID`, `QBO_CLIENT_SECRET`, `QBO_ENV`. Optional: `MASTIFF_MODEL`.
