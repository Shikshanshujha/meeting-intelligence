import { createServiceClient } from "@/lib/auth/demo-users";
import type { MeetingType, ProspectStage } from "@/types";

export interface ScheduleMeetingInput {
  prospect_id: string;
  scheduled_at: string;
  meeting_type?: MeetingType;
  meeting_link?: string | null;
}

export interface ScheduleMeetingResult {
  meeting_id: string;
  prospect_id: string;
  company: string;
}

export function inferMeetingTypeForStage(stage: ProspectStage): MeetingType {
  switch (stage) {
    case "discovery":
      return "discovery";
    case "demo_scheduled":
    case "follow_up":
      return "demo";
    case "closing":
      return "closing";
    case "won":
    case "rejected":
      return "discovery";
    default:
      return "discovery";
  }
}

export async function scheduleMeetingWorkflow(
  repId: string,
  input: ScheduleMeetingInput
): Promise<ScheduleMeetingResult> {
  const scheduledAt = new Date(input.scheduled_at);
  if (Number.isNaN(scheduledAt.getTime())) {
    throw new Error("Invalid meeting date");
  }

  const serviceClient = createServiceClient();

  const { data: prospect, error: prospectError } = await serviceClient
    .from("prospects")
    .select("id, company, stage, owner_id")
    .eq("id", input.prospect_id)
    .single();

  if (prospectError || !prospect) {
    throw new Error("Prospect not found");
  }

  if (prospect.owner_id !== repId) {
    throw new Error("You can only schedule meetings for your prospects");
  }

  const meetingType =
    input.meeting_type ?? inferMeetingTypeForStage(prospect.stage as ProspectStage);

  const { data: meeting, error: meetingError } = await serviceClient
    .from("meetings")
    .insert({
      prospect_id: prospect.id,
      rep_id: repId,
      type: meetingType,
      scheduled_at: scheduledAt.toISOString(),
      meeting_link: input.meeting_link?.trim() || null,
      triage_status: "proceed",
      triage_explanation: "Follow-up scheduled — review memory before the call.",
      open_points: [],
    })
    .select("id")
    .single();

  if (meetingError || !meeting) {
    throw new Error(meetingError?.message ?? "Could not schedule meeting");
  }

  try {
    await serviceClient.from("pipeline_milestones").insert({
      prospect_id: prospect.id,
      occurred_at: new Date().toISOString(),
      label: `${meetingType.charAt(0).toUpperCase()}${meetingType.slice(1)} scheduled`,
      next_step: "Prepare using prospect memory",
      tone: "neutral",
    });
  } catch (milestoneError) {
    console.error("pipeline_milestones insert:", milestoneError);
  }

  return {
    meeting_id: meeting.id,
    prospect_id: prospect.id,
    company: prospect.company,
  };
}
