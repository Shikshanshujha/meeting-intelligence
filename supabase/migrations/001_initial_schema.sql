-- Meeting Intelligence System — initial schema
-- Run in Supabase SQL Editor or via supabase db push

-- ─── Extensions ──────────────────────────────────────────────────────────────
create extension if not exists "pgcrypto";

-- ─── Enums ───────────────────────────────────────────────────────────────────
create type user_role as enum ('rep', 'manager');
create type meeting_type as enum ('discovery', 'demo', 'closing');
create type deal_health as enum ('green', 'yellow', 'red');
create type triage_status as enum ('proceed', 'warning', 'reject');
create type prospect_stage as enum (
  'discovery',
  'demo_scheduled',
  'follow_up',
  'closing',
  'won',
  'rejected'
);

-- ─── Profiles (extends Supabase auth.users) ──────────────────────────────────
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null unique,
  full_name text not null,
  role user_role not null default 'rep',
  created_at timestamptz not null default now()
);

-- ─── Prospects ───────────────────────────────────────────────────────────────
create table public.prospects (
  id uuid primary key default gen_random_uuid(),
  company text not null,
  website text not null,
  industry text,
  employee_range text,
  gtm_maturity text,
  buying_intent text,
  owner_id uuid references public.profiles (id) on delete set null,
  memory_json jsonb not null default '{}'::jsonb,
  qualification_score smallint not null default 0 check (qualification_score between 0 and 100),
  stage prospect_stage not null default 'discovery',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index prospects_owner_id_idx on public.prospects (owner_id);
create index prospects_stage_idx on public.prospects (stage);

-- ─── Meetings ────────────────────────────────────────────────────────────────
create table public.meetings (
  id uuid primary key default gen_random_uuid(),
  prospect_id uuid not null references public.prospects (id) on delete cascade,
  rep_id uuid not null references public.profiles (id) on delete cascade,
  type meeting_type not null,
  scheduled_at timestamptz not null,
  triage_status triage_status,
  triage_explanation text,
  created_at timestamptz not null default now()
);

create index meetings_prospect_id_idx on public.meetings (prospect_id);
create index meetings_rep_id_idx on public.meetings (rep_id);
create index meetings_scheduled_at_idx on public.meetings (scheduled_at desc);

-- ─── Briefs (pre-meeting intelligence) ───────────────────────────────────────
create table public.briefs (
  id uuid primary key default gen_random_uuid(),
  meeting_id uuid not null unique references public.meetings (id) on delete cascade,
  brief jsonb not null default '{}'::jsonb,
  source text not null default 'ai' check (source in ('ai', 'template')),
  created_at timestamptz not null default now()
);

-- ─── Meeting notes (post-meeting extraction) ─────────────────────────────────
create table public.meeting_notes (
  id uuid primary key default gen_random_uuid(),
  meeting_id uuid not null unique references public.meetings (id) on delete cascade,
  raw_notes text not null,
  transcript text,
  structured_summary jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- ─── Manager insights (aggregated, not raw LLM) ──────────────────────────────
create table public.manager_insights (
  id uuid primary key default gen_random_uuid(),
  prospect_id uuid not null unique references public.prospects (id) on delete cascade,
  health deal_health not null default 'yellow',
  risk text,
  coaching text,
  pipeline_signal text,
  patterns jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

-- ─── Enrichment cache (Firecrawl) ────────────────────────────────────────────
create table public.enrichment_cache (
  website text primary key,
  data jsonb not null default '{}'::jsonb,
  fetched_at timestamptz not null default now()
);

-- ─── Updated-at trigger ──────────────────────────────────────────────────────
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger prospects_updated_at
  before update on public.prospects
  for each row execute function public.set_updated_at();

create trigger manager_insights_updated_at
  before update on public.manager_insights
  for each row execute function public.set_updated_at();

-- ─── Row Level Security ──────────────────────────────────────────────────────
alter table public.profiles enable row level security;
alter table public.prospects enable row level security;
alter table public.meetings enable row level security;
alter table public.briefs enable row level security;
alter table public.meeting_notes enable row level security;
alter table public.manager_insights enable row level security;
alter table public.enrichment_cache enable row level security;

-- Helper: current user role
create or replace function public.current_user_role()
returns user_role
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid();
$$;

-- Profiles: users read own profile; managers read all reps
create policy "profiles_select_own"
  on public.profiles for select
  using (id = auth.uid() or public.current_user_role() = 'manager');

-- Prospects: reps see owned; managers see all
create policy "prospects_select"
  on public.prospects for select
  using (
    owner_id = auth.uid()
    or public.current_user_role() = 'manager'
  );

create policy "prospects_insert_rep"
  on public.prospects for insert
  with check (owner_id = auth.uid() and public.current_user_role() = 'rep');

create policy "prospects_update"
  on public.prospects for update
  using (
    owner_id = auth.uid()
    or public.current_user_role() = 'manager'
  );

-- Meetings
create policy "meetings_select"
  on public.meetings for select
  using (
    rep_id = auth.uid()
    or public.current_user_role() = 'manager'
  );

create policy "meetings_insert_rep"
  on public.meetings for insert
  with check (rep_id = auth.uid());

create policy "meetings_update_rep"
  on public.meetings for update
  using (rep_id = auth.uid());

-- Briefs
create policy "briefs_select"
  on public.briefs for select
  using (
    exists (
      select 1 from public.meetings m
      where m.id = briefs.meeting_id
        and (m.rep_id = auth.uid() or public.current_user_role() = 'manager')
    )
  );

create policy "briefs_insert"
  on public.briefs for insert
  with check (
    exists (
      select 1 from public.meetings m
      where m.id = briefs.meeting_id and m.rep_id = auth.uid()
    )
  );

-- Meeting notes
create policy "meeting_notes_select"
  on public.meeting_notes for select
  using (
    exists (
      select 1 from public.meetings m
      where m.id = meeting_notes.meeting_id
        and (m.rep_id = auth.uid() or public.current_user_role() = 'manager')
    )
  );

create policy "meeting_notes_insert"
  on public.meeting_notes for insert
  with check (
    exists (
      select 1 from public.meetings m
      where m.id = meeting_notes.meeting_id and m.rep_id = auth.uid()
    )
  );

-- Manager insights: managers only (reps never see raw coaching layer)
create policy "manager_insights_select_manager"
  on public.manager_insights for select
  using (public.current_user_role() = 'manager');

create policy "manager_insights_all_manager"
  on public.manager_insights for all
  using (public.current_user_role() = 'manager');

-- Enrichment cache: service role writes; authenticated reads
create policy "enrichment_cache_select"
  on public.enrichment_cache for select
  using (auth.uid() is not null);

-- ─── JSON shape documentation (application-level, not enforced) ──────────────
comment on column public.prospects.memory_json is
  '{ concerns[], buying_signals[], pain_points[], stakeholders[], timeline, objections[], next_actions[], sentiment }';

comment on column public.briefs.brief is
  '{ prospect_summary, previous_concerns[], buying_signals[], deal_risks[], questions_to_ask[], recommended_outcome }';

comment on column public.meeting_notes.structured_summary is
  '{ pain_points[], budget, stakeholders[], timeline, sentiment, objections[], next_actions[] }';
