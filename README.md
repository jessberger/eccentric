# JESSBERGER Eccentric

Next.js + Supabase Auth. German/English login, protected `/offers` workspace, sign-out.

The offers screen currently uses two sample offers for design review. Its six groups follow `lib/offer-groups.ts`, with 46 fields in the agreed order. Group filters, inspection, editing, A/B/C revisions and copying work only in page memory; reloading discards changes. The imported Supabase `eski_teklifler` table is not queried or modified yet. Persistent offer storage, attachment handling and PDF generation will be implemented separately.

## Supabase

1. In Authentication settings, disable **Allow new users to sign up**. The application intentionally has no public registration or password reset screen.
2. Under Authentication → Users → Add user → Create new user, create the team accounts. Confirm the email during creation. The administrator manages passwords in Supabase.
3. Copy the project publishable key from Settings → API Keys. Never use a secret or service_role key in this application.
4. Under Authentication → URL Configuration, set Site URL to the production Vercel address once assigned. Password login does not require an email redirect flow.

## Vercel

Import `jessberger/eccentric` from GitHub. Framework: Next.js. Root: repository root. Use Node.js 22 or newer supported LTS.

Add these environment variables to Production and Preview before deploying:

```
NEXT_PUBLIC_SUPABASE_URL=https://hgcaqjodktbesapiyczb.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<your publishable or legacy anon key>
```

Redeploy after changing variables. Subsequent pushes to the configured production branch deploy automatically. No paid Supabase/Vercel integration is required: the app connects directly using these two variables.

## Scope and access

Every account in this dedicated Supabase Auth project can sign in. Keep public signup disabled. Authenticated pages validate the user on the server. Future database tables must enable RLS and define team access policies before storing real offer data. No service role key or database password is needed for this login.

Language is saved in a browser cookie; no account settings page. Technical PDFs will be bilingual regardless of interface language.

## Verification on the deployed site

Check German/English switching; wrong-password message; valid account login; `/offers` redirect for signed-out visitors; sign-out; reload and session persistence. Live login needs configured variables and an existing Supabase user.

Auth implementation follows https://supabase.com/docs/guides/auth/server-side/creating-a-client and https://nextjs.org/docs/app/getting-started/proxy.
