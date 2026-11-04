# Mastiff site: go-live checklist

Plain static HTML and CSS. No build tools. Pages: `index.html`, `how-it-works.html`, `pilot.html`, `about.html`, `legal.html`, `404.html`. Scripts: `config.js` and `pilot.js` only. Do the steps in order. Never paste a secret key into any file in this folder.

Preview locally first (optional): in this folder run `python -m http.server 8000`, then open http://localhost:8000/index.html. Clean URLs (`/pilot`) work only on Vercel.

## (a) Buy a domain
- Cost: about $10-20 per year. Signed in: your registrar account.
- Buy any name at any registrar (Namecheap, Cloudflare, Porkbun). Vercel also sells domains, which makes step (d) automatic.

## (b) Put the code on GitHub
- Cost: free. Signed in: GitHub.
- Create an account at github.com. Click New repository, name it `mastiff`, set it Private, do not add a README. Then in a terminal in the repo folder (`C:\Users\devin\Documents\Mastiff`):

```
git add -A
git commit -m "Site ready to deploy"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/mastiff.git
git push -u origin main
```

If `origin` already exists, use `git remote set-url origin https://github.com/YOUR-USERNAME/mastiff.git` instead of `remote add`.

## (c) Deploy on Vercel
- Cost: free (Hobby plan). Signed in: Vercel (sign up with GitHub).
- Add New > Project > import the `mastiff` repo.
- Root Directory: `site`. Framework Preset: Other. Build command: leave empty. Output directory: `.`
- Click Deploy. You get a `*.vercel.app` address. Open it and check all five pages.

## (d) Attach the domain
- Cost: free. Signed in: Vercel and your registrar.
- Vercel project > Settings > Domains > add your domain. Vercel shows two DNS records (usually an A record for the bare domain and a CNAME for `www`).
- At the registrar, open the DNS settings and add exactly those two records. Wait up to an hour; Vercel shows a green check when it works.
- Replace `DOMAIN` in `sitemap.xml` and `robots.txt` with your domain, then commit and push.

## (e) Connect Supabase (stores the leads)
- Cost: free tier. Signed in: Supabase.
- Create a project at supabase.com. SQL Editor > New query > paste all of `supabase/leads.sql` > Run.
- Project Settings > API: copy the Project URL and the **anon public** key (never `service_role`).
- Put them in `config.js` as `supabaseUrl` and `supabaseAnonKey`, and your address as `contactEmail`. Commit and push; Vercel redeploys on its own.

## (f) Email on every new lead (Resend + Supabase)
- Cost: free tier. Signed in: Resend, Supabase.
- Resend: create an account, Domains > Add Domain, then add the three DNS records it shows (at your registrar) and click Verify. Create an API key with sending access.
- Install the Supabase CLI (https://supabase.com/docs/guides/cli). In a terminal in the `site` folder run the commands below. The project ref is the first part of your Supabase project URL.

```
supabase login
supabase link --project-ref YOUR-PROJECT-REF
supabase secrets set RESEND_API_KEY=YOUR-RESEND-KEY NOTIFY_TO=you@yourdomain.com NOTIFY_FROM="Mastiff <leads@YOUR-DOMAIN>"
mkdir -p supabase/functions/notify-lead
cp supabase/notify-lead.ts supabase/functions/notify-lead/index.ts
supabase functions deploy notify-lead --no-verify-jwt
```

- In the Supabase dashboard: Database > Webhooks > Create a new hook. Table `leads`, event Insert, type Supabase Edge Functions, function `notify-lead`. Save.
- The function code is `supabase/notify-lead.ts`. It reads the keys from secrets only.

## (g) Test it live
- Cost: free. Signed in: none for the form; Supabase and your inbox to check.
- Submit the pilot form on the live site with test details. Confirm a row appears in Supabase (Table Editor > leads, source `site-pilot-form`) and that the email arrives. Then delete the test row. If no email arrives, check Database > Webhooks and Edge Functions > Logs.

## (h) Lighthouse on mobile
- Cost: free. Signed in: none.
- In Chrome, open the live home page, press F12 > Lighthouse > Mobile > Analyze. Repeat for `/pilot`. Note anything below 90.

## Notes
- `vercel.json` sets `cleanUrls` and `trailingSlash` only. Internal links use `.html` names so the site also works on a plain local server; Vercel serves them as `/pilot` and so on.
- Blank `config.js` values make the form show "This form is not connected yet" and send nothing.
