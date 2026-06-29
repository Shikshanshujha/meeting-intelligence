# Phase 5 — Manager view

## Sections (`/manager`)

| Section | Source | Notes |
|---------|--------|-------|
| Health summary | `manager_insights.health` | Green / yellow / red counts + avg qualification |
| Qualification funnel | `prospects.stage` | Bar chart by stage |
| Pipeline movement | meetings + stages | Upcoming, completed, stage signals |
| Risk alerts | `manager_insights.risk` | Yellow + red only |
| Deal health grid | insights + prospects | Structured cards, no raw LLM |
| Coaching | `manager_insights.coaching` | Sorted by severity |
| Patterns | `manager_insights.patterns` | Aggregated tags |

## Design rules

- Data from `manager_insights` only — never raw prompts or LLM output
- Page cached with `revalidate = 60`
- `manager_opened` analytics event on load

## Verify Phase 5

Sign in as **Sales Manager**:

- [ ] Summary shows 1 green, 1 yellow, 1 red
- [ ] Funnel shows Demo Scheduled, Follow Up, Rejected
- [ ] Risk alerts: Nomad + SearchForge
- [ ] Coaching cards for all three deals
- [ ] Patterns: Shopping behavior, Competitor intel, etc.
- [ ] Pipeline movement lists upcoming VelocityHR + Nomad calls
- [ ] Understandable in under 60 seconds
