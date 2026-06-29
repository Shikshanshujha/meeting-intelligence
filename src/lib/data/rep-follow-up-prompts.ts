import { isUpcoming } from "@/lib/data/formatters";
import type { RepMeetingRow } from "@/lib/data/queries";
import {
  hasExceededWorkingDaysSince,
  workingDaysSince,
} from "@/lib/working-days";
import type { ProspectStage } from "@/types";

export interface FollowUpPrompt {
  prospect_id: string;
  company: string;
  stage: ProspectStage;
  last_meeting_at: string;
  working_days_since: number;
  last_meeting_id: string;
}

const TERMINAL_STAGES: ProspectStage[] = ["won", "rejected"];

function lastMeetingTimestamp(meeting: RepMeetingRow): number {
  const iso = meeting.completed_at ?? meeting.scheduled_at;
  return new Date(iso).getTime();
}

export function deriveFollowUpPrompts(
  meetings: RepMeetingRow[],
  now = new Date()
): FollowUpPrompt[] {
  const byProspect = new Map<
    string,
    {
      company: string;
      stage: ProspectStage;
      meetings: RepMeetingRow[];
    }
  >();

  for (const meeting of meetings) {
    const { id: prospectId, company, stage } = meeting.prospect;
    const existing = byProspect.get(prospectId);

    if (existing) {
      existing.meetings.push(meeting);
      existing.stage = stage;
    } else {
      byProspect.set(prospectId, {
        company,
        stage,
        meetings: [meeting],
      });
    }
  }

  const prompts: FollowUpPrompt[] = [];

  for (const [prospectId, { company, stage, meetings: prospectMeetings }] of byProspect) {
    if (TERMINAL_STAGES.includes(stage)) {
      continue;
    }

    const hasUpcoming = prospectMeetings.some((meeting) =>
      isUpcoming(meeting.scheduled_at, meeting.completed_at)
    );

    if (hasUpcoming) {
      continue;
    }

    const pastMeetings = prospectMeetings.filter(
      (meeting) =>
        meeting.completed_at ||
        !isUpcoming(meeting.scheduled_at, meeting.completed_at)
    );

    if (pastMeetings.length === 0) {
      continue;
    }

    const lastMeeting = pastMeetings.reduce((latest, meeting) =>
      lastMeetingTimestamp(meeting) > lastMeetingTimestamp(latest) ? meeting : latest
    );

    const lastMeetDate = new Date(lastMeeting.completed_at ?? lastMeeting.scheduled_at);

    if (!hasExceededWorkingDaysSince(lastMeetDate, 2, now)) {
      continue;
    }

    prompts.push({
      prospect_id: prospectId,
      company,
      stage,
      last_meeting_at: lastMeeting.completed_at ?? lastMeeting.scheduled_at,
      working_days_since: workingDaysSince(lastMeetDate, now),
      last_meeting_id: lastMeeting.id,
    });
  }

  return prompts.sort(
    (a, b) =>
      b.working_days_since - a.working_days_since ||
      a.company.localeCompare(b.company)
  );
}
