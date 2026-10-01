# JESSBERGER Eccentric

Next.js + Supabase Auth. German/English login, protected `/offers` workspace, sign-out.

The offers screen loads all rows from Supabase `public.eski_teklifler` into page memory when opened or refreshed. Authenticated, RLS-protected requests retrieve batches of up to 1,000 rows with a UUID cursor, respecting lower server row limits too. Counts and IDs are checked so a failed or incomplete load cannot be mistaken for the complete dataset. A changing row count during loading requires a retry. No sample records, persistent browser storage or database writes are used.

Its six groups follow `lib/offer-groups.ts`, with 46 fields in the agreed order. Each filter provides all distinct values in a searchable checkbox dropdown. Selections persist when changing the dropdown search. Selected values within one field combine with OR; different fields and the global search combine with AND. All filtering and 20-row pagination happen locally after loading. A small selection count replaces long lists of selected chips. Dropdown options render in increments of 100 while scrolling, with a keyboard-accessible Show more button. Refresh reloads the data while preserving selections. Global search strings and option lists are computed once per loaded dataset. The source values stay unchanged.
Inspect shows all fields. New/edit/revise/copy buttons are disabled until persistent writing and revision handling are implemented; the table currently grants read access only. Database loading errors are shown explicitly, with no sample-data fallback. No additional SQL or keys are needed when the supplied import setup SQL has already been applied. Attachments and PDF generation remain separate work.

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

Check German/English switching; wrong-password message; valid account login; `/offers` redirect for signed-out visitors; sign-out; reload and session persistence. Live login needs configured variables and an existing Supabase user. For offers, confirm the imported count (expected 5,145), inspect a record, search an offer outside the first page, combine filters from different groups, clear filters, and move between pages.

Query references: https://supabase.com/docs/reference/javascript/select and https://supabase.com/docs/reference/javascript/using-filters-ilike.

Auth implementation follows https://supabase.com/docs/guides/auth/server-side/creating-a-client and https://nextjs.org/docs/app/getting-started/proxy.

