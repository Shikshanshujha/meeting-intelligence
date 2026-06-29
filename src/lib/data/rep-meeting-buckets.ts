import type { RepMeetingRow } from "@/lib/data/queries";
import {
  mapProspectStageToWorkflow,
  WORKFLOW_STAGES,
  type WorkflowStage,
} from "@/lib/workflow-stages";

function meetingActivityDate(meeting: RepMeetingRow): string {
  return meeting.completed_at ?? meeting.scheduled_at;
}

function sortMeetingsNewestFirst(meetings: RepMeetingRow[]): RepMeetingRow[] {
  return meetings
    .slice()
    .sort(
      (a, b) =>
        new Date(meetingActivityDate(b)).getTime() -
        new Date(meetingActivityDate(a)).getTime()
    );
}

/**
 * Past meetings grouped by workflow stage.
 * Follow-up shows every completed meeting; other stages show one card per company.
 */
export function bucketPastMeetingsByWorkflow(
  pastMeetings: RepMeetingRow[]
): { stage: WorkflowStage; label: string; meetings: RepMeetingRow[] }[] {
  return WORKFLOW_STAGES.map((stage) => {
    const matches = pastMeetings.filter(
      (meeting) => mapProspectStageToWorkflow(meeting.prospect.stage) === stage.key
    );

    if (stage.key === "follow_up") {
      return {
        stage: stage.key,
        label: stage.label,
        meetings: sortMeetingsNewestFirst(matches),
      };
    }

    const latestByProspect = new Map<string, RepMeetingRow>();
    for (const meeting of matches) {
      const existing = latestByProspect.get(meeting.prospect.id);
      if (!existing) {
        latestByProspect.set(meeting.prospect.id, meeting);
        continue;
      }

      if (
        new Date(meetingActivityDate(meeting)).getTime() >
        new Date(meetingActivityDate(existing)).getTime()
      ) {
        latestByProspect.set(meeting.prospect.id, meeting);
      }
    }

    return {
      stage: stage.key,
      label: stage.label,
      meetings: sortMeetingsNewestFirst(Array.from(latestByProspect.values())),
    };
  });
}
