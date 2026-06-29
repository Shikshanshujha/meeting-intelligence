# Vercel deployment checklist

## 1. Import repo

1. Go to [vercel.com/new](https://vercel.com/new)
2. Sign in with **GitHub**
3. Import **Shikshanshujha/meeting-intelligence**
4. Framework: **Next.js** (auto-detected)
5. Click **Deploy** (first deploy may fail until env vars are set — that's OK)

## 2. Environment variables

In Vercel → Project → **Settings → Environment Variables**, add:

| Name | Value | Environments |
|------|--------|--------------|
| `NEXT_PUBLIC_SUPABASE_URL` | From Supabase → Settings → API | Production, Preview, Development |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key | All |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service_role key | All |
| `GEMINI_API_KEY` | Google AI Studio key | All |
| `FIRECRAWL_API_KEY` | Optional | All |
| `NEXT_PUBLIC_POSTHOG_KEY` | `phc_...` from PostHog | All |
| `NEXT_PUBLIC_POSTHOG_HOST` | `https://us.i.posthog.com` | All |
| `NEXT_PUBLIC_APP_URL` | `https://YOUR-APP.vercel.app` | Production |
| `DEMO_REP_EMAIL` | `rep@gushwork.demo` | All |
| `DEMO_REP_PASSWORD` | `demo-rep-2026` | All |
| `DEMO_MANAGER_EMAIL` | `manager@gushwork.demo` | All |
| `DEMO_MANAGER_PASSWORD` | `demo-manager-2026` | All |

After adding vars, **Redeploy** from the Deployments tab.

## 3. Supabase auth URLs

Supabase → **Authentication → URL Configuration**:

- **Site URL:** `https://YOUR-APP.vercel.app`
- **Redirect URLs:** add `https://YOUR-APP.vercel.app/**`

## 4. Demo data on production Supabase

If production uses the same Supabase project as local, you're done.

If using a new Supabase project, run migrations `001`–`005` in SQL Editor, then locally:

```powershell
# Point .env.local at prod Supabase briefly, or set vars in shell
npm run seed
```

## 5. Smoke test

- Open `/` → pick Rep or Manager → sign in
- Rep: generate brief, complete a meeting
- Manager: pipeline loads with date filter
