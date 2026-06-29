-- Meeting completion tracking

alter table public.meetings
  add column if not exists completed_at timestamptz;

create index if not exists meetings_completed_at_idx
  on public.meetings (completed_at desc);
