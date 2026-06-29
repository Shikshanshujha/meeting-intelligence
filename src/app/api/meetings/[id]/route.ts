import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getSessionProfile } from "@/lib/auth/session";
import {
  deleteMeetingWorkflow,
  rescheduleMeetingWorkflow,
} from "@/lib/workflows/manage-meeting";
import type { MeetingType } from "@/types";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: Request, context: RouteContext) {
  const profile = await getSessionProfile();

  if (!profile || profile.role !== "rep") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id: meetingId } = await context.params;
    const body = await request.json();
    const scheduled_at = body.scheduled_at as string;
    const meeting_type = body.meeting_type as MeetingType | undefined;
    const meeting_link = (body.meeting_link as string)?.trim() || null;

    if (!scheduled_at) {
      return NextResponse.json({ error: "Meeting date is required" }, { status: 400 });
    }

    const result = await rescheduleMeetingWorkflow(meetingId, profile.id, {
      scheduled_at,
      meeting_type,
      meeting_link,
    });

    revalidatePath("/rep");
    revalidatePath("/manager");
    revalidatePath(`/rep/meetings/${meetingId}`);

    return NextResponse.json(result);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not reschedule meeting";
    console.error("meetings PATCH:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const profile = await getSessionProfile();

  if (!profile || profile.role !== "rep") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id: meetingId } = await context.params;
    const result = await deleteMeetingWorkflow(meetingId, profile.id);

    revalidatePath("/rep");
    revalidatePath("/manager");
    revalidatePath(`/rep/meetings/${meetingId}`);

    return NextResponse.json(result);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not delete meeting";
    console.error("meetings DELETE:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
