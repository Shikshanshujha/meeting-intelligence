import { pregenerateMeetingBrief } from "@/lib/ai/workflows/generate-brief";
import { createServiceClient } from "@/lib/auth/demo-users";
import { createClient } from "@/lib/supabase/server";
import type { MeetingType } from "@/types";

export interface RescheduleMeetingInput {
  scheduled_at: string;
  meeting_type?: MeetingType;
  meeting_link?: string | null;
}

export interface ManageMeetingResult {
  meeting_id: string;
  prospect_id: string;
}

async function getOwnedUpcomingMeeting(meetingId: string, repId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("meetings")
    .select("id, prospect_id, type, scheduled_at, completed_at, rep_id")
    .eq("id", meetingId)
    .eq("rep_id", repId)
    .single();

  if (error || !data) {
    throw new Error("Meeting not found");
  }

  if (data.completed_at) {
    throw new Error("Completed meetings cannot be changed");
  }

  if (new Date(data.scheduled_at) < new Date()) {
    throw new Error("Only upcoming meetings can be rescheduled or deleted");
  }

  return data;
}

export async function rescheduleMeetingWorkflow(
  meetingId: string,
  repId: string,
  input: RescheduleMeetingInput
): Promise<ManageMeetingResult> {
  await getOwnedUpcomingMeeting(meetingId, repId);

  const scheduledAt = new Date(input.scheduled_at);
  if (Number.isNaN(scheduledAt.getTime())) {
    throw new Error("Invalid meeting date");
  }

  if (scheduledAt < new Date()) {
    throw new Error("Meeting must be scheduled in the future");
  }

  const serviceClient = createServiceClient();

  const { data: meeting, error } = await serviceClient
    .from("meetings")
    .update({
      scheduled_at: scheduledAt.toISOString(),
      ...(input.meeting_type ? { type: input.meeting_type } : {}),
      meeting_link: input.meeting_link?.trim() || null,
    })
    .eq("id", meetingId)
    .eq("rep_id", repId)
    .select("id, prospect_id")
    .single();

  if (error || !meeting) {
    throw new Error(error?.message ?? "Could not reschedule meeting");
  }

  await serviceClient.from("briefs").delete().eq("meeting_id", meetingId);
  await pregenerateMeetingBrief(meetingId, repId);

  return {
    meeting_id: meeting.id,
    prospect_id: meeting.prospect_id,
  };
}

export async function deleteMeetingWorkflow(
  meetingId: string,
  repId: string
): Promise<ManageMeetingResult> {
  const meeting = await getOwnedUpcomingMeeting(meetingId, repId);
  const serviceClient = createServiceClient();

  const { error } = await serviceClient
    .from("meetings")
    .delete()
    .eq("id", meetingId)
    .eq("rep_id", repId);

  if (error) {
    throw new Error(error.message ?? "Could not delete meeting");
  }

  return {
    meeting_id: meetingId,
    prospect_id: meeting.prospect_id,
  };
}
