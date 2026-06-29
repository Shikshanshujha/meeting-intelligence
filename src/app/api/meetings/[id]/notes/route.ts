import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { processNotesWorkflow } from "@/lib/ai/workflows/process-notes";
import { getSessionProfile } from "@/lib/auth/session";
import type { MeetingType } from "@/types";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const profile = await getSessionProfile();

  if (!profile || profile.role !== "rep") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id: meetingId } = await params;
    const body = await request.json();
    const rawNotes = (body.raw_notes as string)?.trim();
    const transcript = (body.transcript as string)?.trim() || null;
    const nextMeeting = body.next_meeting as
      | {
          scheduled_at?: string;
          type?: MeetingType;
          meeting_link?: string | null;
        }
      | undefined;

    if (!rawNotes) {
      return NextResponse.json({ error: "Notes are required" }, { status: 400 });
    }

    const result = await processNotesWorkflow(
      meetingId,
      profile.id,
      rawNotes,
      transcript,
      {
        markComplete: true,
        nextMeeting:
          nextMeeting?.scheduled_at
            ? {
                scheduled_at: nextMeeting.scheduled_at,
                type: nextMeeting.type,
                meeting_link: nextMeeting.meeting_link ?? null,
              }
            : undefined,
      }
    );

    revalidatePath(`/rep/meetings/${meetingId}`);
    if (result.next_meeting_id) {
      revalidatePath(`/rep/meetings/${result.next_meeting_id}`);
    }
    revalidatePath("/rep");
    revalidatePath("/manager");

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not save notes";
    console.error("notes route:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
