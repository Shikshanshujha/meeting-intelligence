# Phase 3 — Seed data

## Run seed (recommended)

```powershell
npm run seed
```

Or step by step:

```powershell
npm run seed:users   # rep + manager auth
npm run seed:data    # Gushwork pipeline
```

## What gets seeded

| Prospect | Stage | Health | Meetings |
|----------|-------|--------|----------|
| **VelocityHR** | Demo Scheduled | Green | Discovery + Demo (past), Demo (upcoming +2d) |
| **Nomad Commerce** | Follow-up | Yellow | Discovery + Demo (past), Closing (upcoming +5d) |
| **SearchForge Digital** | Rejected | Red | Discovery (past, triage: skip) |

Also seeded:

- `memory_json` on each prospect (cumulative context)
- Meeting notes + structured summaries on past calls
- Pre-built brief on VelocityHR upcoming demo
- `manager_insights` for all three deals

All prospects owned by **rep@gushwork.demo**.

## Verify Phase 3

**Rep (`/rep`):**
- [ ] 7 meetings listed (2 upcoming highlighted)
- [ ] VelocityHR upcoming shows "Brief ready"
- [ ] SearchForge shows red "Skip" triage badge

**Manager (`/manager`):**
- [ ] 3 deal health cards (green / yellow / red)
- [ ] Stage funnel counts visible
- [ ] Coaching cards for Nomad + SearchForge

## SQL alternative

`supabase/seed.sql` seeds prospects + manager insights only. Use `npm run seed:data` for full meeting history with relative dates.
