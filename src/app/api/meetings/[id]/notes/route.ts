import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { processNotesWorkflow } from "@/lib/ai/workflows/process-notes";
import { getSessionProfile } from "@/lib/auth/session";

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

    if (!rawNotes) {
      return NextResponse.json({ error: "Notes are required" }, { status: 400 });
    }

    const result = await processNotesWorkflow(
      meetingId,
      profile.id,
      rawNotes,
      transcript,
      { markComplete: true }
    );

    revalidatePath(`/rep/meetings/${meetingId}`);
    revalidatePath("/rep");

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not save notes";
    console.error("notes route:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
