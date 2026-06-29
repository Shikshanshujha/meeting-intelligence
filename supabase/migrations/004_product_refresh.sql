-- Product refresh: meeting links, rep development areas, pipeline milestones, learning leaps

alter table public.meetings
  add column if not exists meeting_link text,
  add column if not exists open_points jsonb not null default '[]'::jsonb;

alter table public.profiles
  add column if not exists development_areas jsonb not null default '[]'::jsonb;

create table if not exists public.pipeline_milestones (
  id uuid primary key default gen_random_uuid(),
  prospect_id uuid not null references public.prospects (id) on delete cascade,
  occurred_at timestamptz not null,
  label text not null,
  next_step text,
  tone text not null default 'neutral' check (tone in ('positive', 'negative', 'warning', 'neutral')),
  created_at timestamptz not null default now()
);

create index if not exists pipeline_milestones_prospect_id_idx
  on public.pipeline_milestones (prospect_id);

create index if not exists pipeline_milestones_occurred_at_idx
  on public.pipeline_milestones (occurred_at desc);

create table if not exists public.learning_leaps (
  id uuid primary key default gen_random_uuid(),
  worked_well jsonb not null default '[]'::jsonb,
  didnt_work jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.pipeline_milestones enable row level security;
alter table public.learning_leaps enable row level security;

create policy "pipeline_milestones_select"
  on public.pipeline_milestones for select
  using (
    exists (
      select 1 from public.prospects p
      where p.id = pipeline_milestones.prospect_id
        and (p.owner_id = auth.uid() or public.current_user_role() = 'manager')
    )
  );

create policy "learning_leaps_select_manager"
  on public.learning_leaps for select
  using (public.current_user_role() = 'manager');
