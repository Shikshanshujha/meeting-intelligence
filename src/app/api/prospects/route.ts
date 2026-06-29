import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getSessionProfile } from "@/lib/auth/session";
import { createProspectWorkflow } from "@/lib/workflows/create-prospect";
import type { MeetingType } from "@/types";

export async function POST(request: Request) {
  const profile = await getSessionProfile();

  if (!profile || profile.role !== "rep") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const company = (body.company as string)?.trim();
    const website = (body.website as string)?.trim();
    const industry = (body.industry as string)?.trim() || null;
    const employee_range = (body.employee_range as string)?.trim() || null;
    const buying_intent = (body.buying_intent as string)?.trim() || null;
    const scheduled_at = body.scheduled_at as string;
    const meeting_link = (body.meeting_link as string)?.trim() || null;
    const meeting_type = body.meeting_type as MeetingType | undefined;

    if (!company || !website || !scheduled_at) {
      return NextResponse.json(
        { error: "Company, website, and meeting date are required" },
        { status: 400 }
      );
    }

    const result = await createProspectWorkflow(profile.id, {
      company,
      website,
      industry,
      employee_range,
      buying_intent,
      scheduled_at,
      meeting_link,
      meeting_type,
    });

    revalidatePath("/rep");
    revalidatePath("/manager");

    return NextResponse.json(result);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not create prospect";
    console.error("prospects route:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
