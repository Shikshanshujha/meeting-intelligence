import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getSessionProfile } from "@/lib/auth/session";
import { scheduleMeetingWorkflow } from "@/lib/workflows/schedule-meeting";
import type { MeetingType } from "@/types";

export async function POST(request: Request) {
  const profile = await getSessionProfile();

  if (!profile || profile.role !== "rep") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const prospect_id = (body.prospect_id as string)?.trim();
    const scheduled_at = body.scheduled_at as string;
    const meeting_type = body.meeting_type as MeetingType | undefined;
    const meeting_link = (body.meeting_link as string)?.trim() || null;

    if (!prospect_id || !scheduled_at) {
      return NextResponse.json(
        { error: "Prospect and meeting date are required" },
        { status: 400 }
      );
    }

    const result = await scheduleMeetingWorkflow(profile.id, {
      prospect_id,
      scheduled_at,
      meeting_type,
      meeting_link,
    });

    revalidatePath("/rep");
    revalidatePath("/manager");
    revalidatePath(`/rep/meetings/${result.meeting_id}`);

    return NextResponse.json(result);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not schedule meeting";
    console.error("meetings route:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
