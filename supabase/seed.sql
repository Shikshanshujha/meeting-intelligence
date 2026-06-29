-- Gushwork demo pipeline seed (SQL alternative to npm run seed:data)
-- Prerequisites: migrations 001 + 002 applied, demo rep user seeded
-- Replace :rep_id with actual UUID from: select id from profiles where email = 'rep@gushwork.demo';

-- ─── Prospects ───────────────────────────────────────────────────────────────
insert into public.prospects (
  id, company, website, industry, employee_range, gtm_maturity, buying_intent,
  owner_id, qualification_score, stage, memory_json
) values
(
  '11111111-1111-4111-8111-111111111101',
  'VelocityHR',
  'https://velocityhr.io',
  'B2B SaaS',
  '120',
  'Series B — scaling content-led growth',
  'High — active SEO expansion initiative',
  (select id from public.profiles where email = 'rep@gushwork.demo'),
  78,
  'demo_scheduled',
  '{"concerns":["Content quality at scale","Hitting 25 blogs/month target"],"buying_signals":["Urgency high","Clear volume goal (8→25 blogs)"],"pain_points":["Content team overloaded","SEO scaling bottleneck"],"stakeholders":["Head of Content","VP Marketing"],"timeline":"Q2 launch window","objections":["Concern around AI-assisted content quality"],"next_actions":["Address quality workflow in next demo"],"sentiment":"positive","urgency":"high"}'::jsonb
),
(
  '11111111-1111-4111-8111-111111111102',
  'Nomad Commerce',
  'https://nomadcommerce.com',
  'D2C',
  '300',
  'Growth stage — multi-channel D2C',
  'Medium — evaluating consolidated SEO partner',
  (select id from public.profiles where email = 'rep@gushwork.demo'),
  52,
  'follow_up',
  '{"concerns":["Already working with multiple agencies","Traffic plateau"],"buying_signals":["Attended full demo"],"pain_points":["Organic traffic flat","Agency coordination overhead"],"stakeholders":["CMO","Growth lead"],"timeline":"Evaluating through end of quarter","objections":["Shopping behavior — comparing 3 vendors"],"next_actions":["Send differentiation one-pager"],"sentiment":"cautious","urgency":"medium"}'::jsonb
),
(
  '11111111-1111-4111-8111-111111111103',
  'SearchForge Digital',
  'https://searchforgedigital.com',
  'Agency',
  '40',
  'Established agency — services shop',
  'Low — likely research / competitive intel',
  (select id from public.profiles where email = 'rep@gushwork.demo'),
  18,
  'rejected',
  '{"concerns":["Deep implementation questions","Possible competitor research"],"buying_signals":[],"pain_points":["No validated buyer pain"],"stakeholders":["Founder (solo on call)"],"objections":["Asked for internal build specs"],"next_actions":["Do not pursue"],"sentiment":"negative","urgency":"low"}'::jsonb
)
on conflict (id) do update set
  company = excluded.company,
  memory_json = excluded.memory_json,
  qualification_score = excluded.qualification_score,
  stage = excluded.stage;

-- ─── Manager insights ──────────────────────────────────────────────────────────
insert into public.manager_insights (id, prospect_id, health, risk, coaching, pipeline_signal, patterns)
values
(
  '55555555-5555-4555-8555-555555555501',
  '11111111-1111-4111-8111-111111111101',
  'green',
  'Quality objection from last demo — manageable with workflow proof.',
  'Open the follow-up demo with editorial controls. Ask for pilot commitment before leaving the call.',
  'Demo scheduled — strong urgency, Q2 deadline',
  '["High intent","Repeat engagement","Quality objection pattern"]'::jsonb
),
(
  '55555555-5555-4555-8555-555555555502',
  '11111111-1111-4111-8111-111111111102',
  'yellow',
  'Likely stall — multi-vendor eval, CMO absent, no decision date.',
  'Push for economic buyer meeting and explicit decision timeline.',
  'Follow-up scheduled but deal lacks momentum',
  '["Shopping behavior","Missing economic buyer","Agency overlap"]'::jsonb
),
(
  '55555555-5555-4555-8555-555555555503',
  '11111111-1111-4111-8111-111111111103',
  'red',
  'Competitor research signal — agency asking build-level implementation details.',
  'Deprioritize immediately. Reallocate rep time to VelocityHR follow-up.',
  'Rejected — no further meetings',
  '["Competitor intel","No validated pain","Wrong buyer profile"]'::jsonb
)
on conflict (id) do update set
  health = excluded.health,
  risk = excluded.risk,
  coaching = excluded.coaching,
  pipeline_signal = excluded.pipeline_signal,
  patterns = excluded.patterns;

-- Meetings, notes, and briefs use relative dates — prefer: npm run seed:data
