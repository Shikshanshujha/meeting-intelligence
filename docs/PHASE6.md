# Phase 6 — AI pipeline

## Env vars (`.env.local`)

```env
GEMINI_API_KEY=...          # required for live AI
FIRECRAWL_API_KEY=...       # optional — website enrichment
```

Restart dev server after adding keys.

## Install

```powershell
npm install
```

## Pipeline

| Step | Prompt | Fallback |
|------|--------|----------|
| Generate brief | A (brief) + B (triage) | Template |
| Submit notes | C (memory) + D (manager) | Template |
| Before brief | Firecrawl scrape | Skip, use memory |

## Verify

**Rep — Generate brief**
- [ ] Brief shows **AI** label (not Template) when `GEMINI_API_KEY` set
- [ ] Triage badge updates on meeting

**Rep — Submit notes**
- [ ] Memory merges; regenerate brief reflects new context
- [ ] New milestone appears in manager pipeline movement

**Manager**
- [ ] Insights update after rep submits notes
- [ ] Pipeline movement grouped by health shows new milestone

**Graceful degradation**
- [ ] Remove `GEMINI_API_KEY` → briefs still generate (Template)
- [ ] Remove `FIRECRAWL_API_KEY` → no error, enrichment skipped
