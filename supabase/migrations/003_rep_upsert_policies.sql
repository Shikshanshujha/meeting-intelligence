-- Allow reps to upsert briefs and meeting notes on their meetings
create policy "briefs_update"
  on public.briefs for update
  using (
    exists (
      select 1 from public.meetings m
      where m.id = briefs.meeting_id and m.rep_id = auth.uid()
    )
  );

create policy "meeting_notes_update"
  on public.meeting_notes for update
  using (
    exists (
      select 1 from public.meetings m
      where m.id = meeting_notes.meeting_id and m.rep_id = auth.uid()
    )
  );
