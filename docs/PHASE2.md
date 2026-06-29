# Phase 2 — Supabase setup checklist

## 1. Create Supabase project (free tier)

1. Go to [supabase.com](https://supabase.com) → New project
2. Copy **Project URL** and **anon key** from Settings → API
3. Copy **service_role key** (server-only, never expose to client)

## 2. Run migrations (SQL Editor → New query)

Run in order:

1. `supabase/migrations/001_initial_schema.sql`
2. `supabase/migrations/002_auth_profile_trigger.sql`

## 3. Disable email confirmation

Authentication → Providers → Email → turn off **Confirm email**

## 4. Configure env

```powershell
copy .env.example .env.local
```

Fill in Supabase keys. Demo user passwords can stay as defaults.

## 5. Seed demo users

```powershell
npm install
npm run seed:users
```

Creates:

| Role | Email | Password |
|------|-------|----------|
| Rep | rep@gushwork.demo | demo-rep-2026 |
| Manager | manager@gushwork.demo | demo-manager-2026 |

## 6. Run locally

```powershell
npm run dev
```

Open http://localhost:3000 → **Sales Rep** or **Sales Manager**

## Verify Phase 2

- [ ] Homepage shows two role buttons
- [ ] Rep button lands on `/rep` with name visible
- [ ] Manager button lands on `/manager`
- [ ] Visiting `/manager` as rep redirects away
- [ ] Switch role signs out and returns home
