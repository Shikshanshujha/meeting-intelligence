# Setup commands (Phase 2+)

Run from project root: `C:\Users\imsik\Projects\meeting-intelligence`

## 1. Bootstrap Next.js (if not already scaffolded)

```powershell
cd C:\Users\imsik\Projects\meeting-intelligence
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm --yes
```

## 2. Install dependencies

```powershell
npm install @supabase/supabase-js @supabase/ssr @google/generative-ai posthog-js
npm install -D supabase
npx shadcn@latest init -y
npx shadcn@latest add button card badge tabs textarea skeleton alert
```

## 3. Environment

```powershell
copy .env.example .env.local
# Fill in Supabase, Gemini, Firecrawl, PostHog keys
```

## 4. Supabase project (free tier)

1. Create project at https://supabase.com
2. SQL Editor → paste `supabase/migrations/001_initial_schema.sql` → Run
3. Authentication → Providers → Email → disable "Confirm email"
4. Create demo users (Phase 3 seed script) or manually in Auth dashboard

## 5. Local dev

```powershell
npm run dev
```

Open http://localhost:3000

## 6. Deploy (Vercel free tier)

```powershell
npm i -g vercel
vercel
```

Add all env vars from `.env.example` in Vercel project settings.

## Service free-tier notes

| Service | Limit strategy |
|---------|----------------|
| Supabase | 500MB DB; seed stays small |
| Gemini Flash | Template fallback on 429/5xx |
| Firecrawl | Cache in `enrichment_cache`; skip on fail |
| PostHog | Client-only; swallow errors |
| Vercel | Edge-friendly; manager page revalidate 60s |
