import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { generateBriefWorkflow } from "@/lib/ai/workflows/generate-brief";
import { getSessionProfile } from "@/lib/auth/session";

export async function POST(request: Request) {
  const profile = await getSessionProfile();

  if (!profile || profile.role !== "rep") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const meetingId = body.meetingId as string;

    if (!meetingId) {
      return NextResponse.json({ error: "meetingId required" }, { status: 400 });
    }

    const result = await generateBriefWorkflow(meetingId, profile.id);

    revalidatePath(`/rep/meetings/${meetingId}`);
    revalidatePath("/rep");

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Brief generation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
