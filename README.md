# Mastiff app

Payment verification for small offices. The bookkeeper enters (or forwards) a payment request before it is keyed; Mastiff answers Pass or Hold; on a hold Mastiff calls the vendor at the number on file and logs it; the office's second person records the decision. Mastiff flags. Your firm makes every payment decision.

Five screens: vendor file, new request, request (verdict, callbacks, decision), log with CSV export, settings. Plus the Desk: every open hold across every office, for Mastiff staff.

Rules live in `src/lib/rules.ts`: three holds (payee not on file, bank details changed, amount out of range), two cautions (off-hours, urgency wording) that never hold alone.

## Deploy (no Node needed on your PC)

1. **Supabase**: create a project. SQL editor → paste `supabase/schema.sql` → run.
   Authentication → Providers → Email: enabled. Authentication → URL configuration: add your Vercel URL to redirect URLs (`https://YOUR-APP.vercel.app/auth/callback`).
2. **GitHub**: this folder pushed to a repo.
3. **Vercel**: Import the repo. Framework: Next.js. Environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL` = Project Settings → API → Project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = the anon public key (never the service_role key)
   Deploy.
4. Open the app, sign in with your email (magic link).
5. Back in Supabase SQL editor: edit `supabase/seed.sql` with your email, run it. That makes you staff and creates a test office with three vendors.
6. Reload the app. You land on the Desk. Open Home, enter a request for "Ray's Drywall", $4,200, last four 2208: Pass. Enter one with last four 1234: Hold. Log a callback, record a decision, open the Log, download the CSV.

## Adding a real office

Desk → Add an office. Then in Supabase: Authentication → Users → Invite the bookkeeper and the second person by email. Then SQL:

    insert into memberships (user_id, org_id, role, name)
    select u.id, o.id, 'bookkeeper', 'Her Name' from auth.users u, orgs o
    where u.email = 'her@office.com' and o.slug = 'theirslug';

Roles: `bookkeeper` submits requests; `approver` and `owner` record decisions. A self-serve invite screen is the next build.

## Not in v1 (on purpose)

Email intake (the forwarding address is shown but not yet wired; it needs an inbound email service), AI reading of invoices, QuickBooks or bank integrations, pricing, deception features. See the business plan's roadmap.

## Data rule

Last four digits only. The database rejects anything longer in account fields; the import cuts full numbers to four. Never store a routing number or tax ID.
