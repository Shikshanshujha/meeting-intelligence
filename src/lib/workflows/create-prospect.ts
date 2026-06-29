import { createServiceClient } from "@/lib/auth/demo-users";
import { createClient } from "@/lib/supabase/server";
import type { MeetingType } from "@/types";

export interface CreateProspectInput {
  company: string;
  website: string;
  industry?: string | null;
  employee_range?: string | null;
  buying_intent?: string | null;
  scheduled_at: string;
  meeting_link?: string | null;
  meeting_type?: MeetingType;
}

export interface CreateProspectResult {
  prospect_id: string;
  meeting_id: string;
  company: string;
}

function normalizeWebsite(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) return trimmed;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

export async function createProspectWorkflow(
  repId: string,
  input: CreateProspectInput
): Promise<CreateProspectResult> {
  const company = input.company.trim();
  const website = normalizeWebsite(input.website);

  if (!company) {
    throw new Error("Company name is required");
  }

  if (!website) {
    throw new Error("Website is required");
  }

  const scheduledAt = new Date(input.scheduled_at);
  if (Number.isNaN(scheduledAt.getTime())) {
    throw new Error("Invalid meeting date");
  }

  const supabase = await createClient();
  const serviceClient = createServiceClient();
  const meetingType = input.meeting_type ?? "discovery";

  const { data: prospect, error: prospectError } = await supabase
    .from("prospects")
    .insert({
      company,
      website,
      industry: input.industry?.trim() || null,
      employee_range: input.employee_range?.trim() || null,
      buying_intent: input.buying_intent?.trim() || null,
      owner_id: repId,
      qualification_score: 50,
      stage: "discovery",
      memory_json: {},
    })
    .select("id, company")
    .single();

  if (prospectError || !prospect) {
    throw new Error(prospectError?.message ?? "Could not create prospect");
  }

  const { data: meeting, error: meetingError } = await supabase
    .from("meetings")
    .insert({
      prospect_id: prospect.id,
      rep_id: repId,
      type: meetingType,
      scheduled_at: scheduledAt.toISOString(),
      meeting_link: input.meeting_link?.trim() || null,
      triage_status: "proceed",
      triage_explanation:
        "New prospect — run discovery to validate pain, timeline, and budget.",
      open_points: [],
    })
    .select("id")
    .single();

  if (meetingError || !meeting) {
    await serviceClient.from("prospects").delete().eq("id", prospect.id);
    throw new Error(meetingError?.message ?? "Could not schedule first meeting");
  }

  const { error: insightError } = await serviceClient
    .from("manager_insights")
    .insert({
      prospect_id: prospect.id,
      health: "yellow",
      risk: "New prospect — not yet qualified.",
      coaching:
        "Run a tight discovery call. Confirm pain, timeline, and economic buyer before heavy prep.",
      pipeline_signal: `${company} — first call scheduled`,
      patterns: ["New lead"],
    });

  if (insightError) {
    console.error("manager_insights insert:", insightError.message);
  }

  try {
    await serviceClient.from("pipeline_milestones").insert({
      prospect_id: prospect.id,
      occurred_at: new Date().toISOString(),
      label: "Prospect added to pipeline",
      next_step: "Complete first discovery call",
      tone: "neutral",
    });
  } catch (milestoneError) {
    console.error("pipeline_milestones insert:", milestoneError);
  }

  return {
    prospect_id: prospect.id,
    meeting_id: meeting.id,
    company: prospect.company,
  };
}
