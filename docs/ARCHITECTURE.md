# Meeting Intelligence System — Architecture (Phase 1)

## System overview

Two-sided product with one shared intelligence layer. Reps prepare and capture; managers observe deal health. Memory persists on `prospects.memory_json` and flows into every future brief.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           VERCEL (Next.js 15)                           │
├──────────────────────────────┬──────────────────────────────────────────┤
│         /rep (Rep UX)        │         /manager (Manager UX)            │
│  • Meeting list              │  • Deal health cards                     │
│  • Generate brief CTA        │  • Funnel + risk alerts                  │
│  • Submit notes              │  • Coaching (structured, not raw LLM)    │
└──────────────┬───────────────┴──────────────────┬───────────────────────┘
               │                                   │
               ▼                                   ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                         API Routes (/api/*)                              │
│  auth/demo  briefs/generate  meetings/notes  triage  manager/sync        │
└──────────────┬───────────────────────────────────────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                    Intelligence Pipeline (lib/ai)                        │
│                                                                          │
│   Input → Enrichment → Memory load → LLM workflow → Persist → UI       │
│              │              │              │                             │
│         Firecrawl      prospects     A: Brief                            │
│         (optional)     .memory_json  B: Triage                           │
│                                      C: Memory extract                   │
│                                      D: Manager insight                  │
│                                                                          │
│   Failures: Firecrawl skip | LLM → template | Analytics no-op            │
└──────────────┬───────────────────────────────────────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                         SUPABASE                                         │
│  Auth (demo users) │ Postgres + RLS │ Realtime optional (not MVP)        │
└──────────────────────────────────────────────────────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────────────────────────────────────┐
│  External: Gemini Flash │ Firecrawl │ PostHog (client, fire-and-forget)  │
└──────────────────────────────────────────────────────────────────────────┘
```

## Request flows

### Brief generation (Rep)

```
Rep selects meeting → POST /api/briefs/generate
  → load prospect + memory_json + past notes
  → Firecrawl website (cache hit/miss)
  → Prompt A (brief) + Prompt B (triage)
  → upsert briefs + meetings.triage_*
  → track brief_generated
```

### Post-meeting (Rep)

```
Rep submits notes → POST /api/meetings/[id]/notes
  → Prompt C (memory extraction)
  → merge into prospects.memory_json
  → Prompt D (manager insight) → manager_insights
  → track meeting_completed, memory_updated
```

### Manager dashboard

```
Manager lands /manager → server component reads manager_insights + prospects
  → no raw LLM strings exposed
  → cached on page (revalidate 60s)
  → track manager_opened
```

## Auth model (no signup)

Homepage offers two buttons. Each calls `POST /api/auth/demo` with `{ role: 'rep' | 'manager' }`, signs in via Supabase password auth using seeded demo credentials from env. Session cookie gates `/rep` and `/manager`. Middleware redirects wrong role.

## Key decisions

| Decision | Choice | Why |
|----------|--------|-----|
| Framework | Next.js App Router | Vercel-native, RSC for manager cache |
| DB | Supabase Postgres | Free tier, Auth + RLS in one place |
| Memory store | `prospects.memory_json` | Single source; avoids over-normalizing for MVP |
| AI | 4 separate prompt files | Spec requirement; easier fallbacks |
| Triage | Never auto-block | Stored as signal + explanation only |
| Manager data | `manager_insights` table | Reps never see coaching/risk raw layer |
| Enrichment | `enrichment_cache` | Avoid re-scraping; graceful skip on fail |
| Analytics | PostHog client only | Ignore failures; no server dependency |

## Folder structure

See repository root — `src/` mirrors product surfaces and pipeline stages.
