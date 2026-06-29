# Phase 4 — Rep view

## New routes

| Route | Purpose |
|-------|---------|
| `/rep` | Meeting list + **Next up** hero |
| `/rep/meetings/[id]` | Brief, triage, notes |

## Rep flow

1. Open **Next up** (or any meeting)
2. Tap **Generate brief** → scannable cards from prospect memory
3. After the call, **Submit notes** → memory merges for the next brief

## API

- `POST /api/briefs/generate` `{ meetingId }`
- `POST /api/meetings/[id]/notes` `{ raw_notes, transcript? }`

Uses template intelligence now; Gemini wired in Phase 6.

## Migration

Run in Supabase SQL Editor if not already:

`supabase/migrations/003_rep_upsert_policies.sql`

## Verify Phase 4

**VelocityHR (upcoming demo):**
- [ ] Pre-seeded brief visible OR regenerate pulls memory (quality concerns)

**Nomad Commerce (upcoming closing):**
- [ ] Generate brief → shows shopping/stall risks from memory

**Past meeting (any):**
- [ ] Submit/update notes → success message
- [ ] Regenerate brief on another upcoming meeting reflects new memory

**Mobile:**
- [ ] Single-column layout, large tap targets on Generate / Submit
