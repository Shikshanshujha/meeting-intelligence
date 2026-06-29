# Build Plan — 2-Day MVP

## Phase 1 — Architecture ✅ (this phase)

- [x] Folder structure
- [x] Architecture diagram
- [x] Environment variables
- [x] Setup commands
- [x] Database schema
- [x] Build plan

**Stop here.** Confirm before Phase 2.

---

## Phase 2 — Schema & Supabase ✅

- [x] Run migration `001_initial_schema.sql`
- [x] Create Supabase project (free tier) — manual step, see `docs/PHASE2.md`
- [x] Disable email confirmation for demo users
- [x] Seed auth users (rep + manager) via service role — `npm run seed:users`
- [x] Add `src/lib/supabase/` client + server helpers
- [x] Middleware for role-based route protection

**Deliverable:** DB live, demo login works, empty routes protected.

**Stop here.** Confirm before Phase 3.

---

## Phase 3 — Seed Data ✅

- [x] `supabase/seed.sql` with Gushwork demo prospects
- [x] `scripts/seed-demo-data.ts` — full meetings, notes, memory, insights
- [x] Historical meetings, notes, memory_json, manager_insights pre-populated
- [x] Rep owns all three; manager sees aggregate
- [x] Rep + manager pages show seeded pipeline (preview UI)

**Deliverable:** Cold start shows realistic pipeline, not empty app.

**Stop here.** Confirm before Phase 4.

---

## Phase 4 — Rep View (`/rep`) ✅

- [x] Meeting list with next-up highlight
- [x] Meeting detail: brief card + triage badge
- [x] **Single CTA:** "Generate Brief" → loading → scannable cards
- [x] Post-meeting notes form (textarea + optional transcript)
- [x] Mobile-first layout, strong empty states
- [x] Template brief + memory pipeline (Gemini in Phase 6)

**Deliverable:** Rep can brief → meet → submit notes; memory visible on second brief.

**Stop here.** Confirm before Phase 5.

---

## Phase 5 — Manager View (`/manager`) ✅

- [x] Deal health grid (green/yellow/red)
- [x] Qualification funnel (stage counts)
- [x] Risk alerts + coaching cards (from `manager_insights`, not LLM raw)
- [x] Pipeline movement (meetings + stage signals)
- [x] Patterns section (aggregated from insights)
- [x] `revalidate = 60` + `manager_opened` analytics

**Deliverable:** Manager understands deal quality in <60s.

**Stop here.** Confirm before Phase 6.

---

## Phase 6 — AI Pipeline ✅

- [x] `lib/enrichment/firecrawl.ts` with cache
- [x] Prompts A–D in `lib/ai/prompts/`
- [x] Workflows in `lib/ai/workflows/`
- [x] Template fallbacks in `lib/ai/fallbacks/`
- [x] API routes wired with graceful degradation
- [x] Pipeline milestone on notes submit

**Deliverable:** Live brief + triage + memory merge + manager sync.

**Stop here.** Confirm before Phase 7.

---

## Phase 7 — Polish & Deploy

- Homepage role picker (Continue As Rep / Manager)
- PostHog events (5 required events)
- shadcn/ui polish (Linear/Notion aesthetic)
- Vercel deploy + env vars
- Smoke test cold URL

**Deliverable:** Public URL, assignment-ready demo.

---

## Out of scope (explicitly)

- Signup / email verification
- Real-time collaboration
- Webhooks / CRM integrations
- Auto-blocking meetings
- README / walkthrough
- Production-scale caching, queues, or microservices
