import { createServiceClient } from "@/lib/auth/demo-users";
import { getSessionProfile } from "@/lib/auth/session";
import type {
  DealHealth,
  MeetingType,
  ProspectMemory,
  ProspectStage,
  StructuredSummary,
  TriageStatus,
} from "@/types";
import type { PipelineMilestoneRow } from "./queries";

export interface ManagerProspectMeetingRow {
  id: string;
  type: MeetingType;
  scheduled_at: string;
  completed_at: string | null;
  triage_status: TriageStatus | null;
  triage_explanation: string | null;
  rep_name: string;
  has_notes: boolean;
  notes: {
    raw_notes: string;
    transcript: string | null;
    structured_summary: StructuredSummary;
  } | null;
}

export interface ManagerProspectDetail {
  id: string;
  company: string;
  website: string;
  industry: string | null;
  employee_range: string | null;
  gtm_maturity: string | null;
  buying_intent: string | null;
  stage: ProspectStage;
  qualification_score: number;
  memory_json: ProspectMemory;
  owner_name: string;
  updated_at: string;
  insight: {
    health: DealHealth;
    risk: string | null;
    coaching: string | null;
    pipeline_signal: string | null;
    patterns: string[];
  } | null;
  meetings: ManagerProspectMeetingRow[];
  milestones: PipelineMilestoneRow[];
}

export function countMeetingsWithNotes(
  meetings: ManagerProspectMeetingRow[]
): number {
  return meetings.filter((meeting) => meeting.has_notes).length;
}

export async function getManagerProspectDetail(
  prospectId: string
): Promise<ManagerProspectDetail | null> {
  const profile = await getSessionProfile();

  if (!profile || profile.role !== "manager") {
    return null;
  }

  const supabase = createServiceClient();

  const { data: prospect, error } = await supabase
    .from("prospects")
    .select(
      `
      id,
      company,
      website,
      industry,
      employee_range,
      gtm_maturity,
      buying_intent,
      stage,
      qualification_score,
      memory_json,
      updated_at,
      owner:profiles!prospects_owner_id_fkey ( full_name ),
      manager_insights ( health, risk, coaching, pipeline_signal, patterns )
    `
    )
    .eq("id", prospectId)
    .single();

  if (error || !prospect) {
    console.error("getManagerProspectDetail prospect:", error?.message);
    return null;
  }

  const owner = Array.isArray(prospect.owner) ? prospect.owner[0] : prospect.owner;
  const ownerName = owner?.full_name ?? "Unassigned";
  const insightRow = Array.isArray(prospect.manager_insights)
    ? prospect.manager_insights[0]
    : prospect.manager_insights;

  const [meetingsResult, milestonesResult] = await Promise.all([
    supabase
      .from("meetings")
      .select(
        `
        id,
        type,
        scheduled_at,
        completed_at,
        triage_status,
        triage_explanation,
        rep:profiles!meetings_rep_id_fkey ( full_name )
      `
      )
      .eq("prospect_id", prospectId)
      .order("scheduled_at", { ascending: false }),
    supabase
      .from("pipeline_milestones")
      .select("id, prospect_id, occurred_at, label, next_step, tone")
      .eq("prospect_id", prospectId)
      .order("occurred_at", { ascending: false }),
  ]);

  if (meetingsResult.error) {
    console.error("getManagerProspectDetail meetings:", meetingsResult.error.message);
  }

  if (milestonesResult.error) {
    console.error(
      "getManagerProspectDetail milestones:",
      milestonesResult.error.message
    );
  }

  const meetings = meetingsResult.data ?? [];
  const milestones = milestonesResult.data ?? [];
  const meetingIds = meetings.map((row) => row.id);

  const notesByMeetingId = new Map<
    string,
    {
      raw_notes: string;
      transcript: string | null;
      structured_summary: StructuredSummary;
    }
  >();

  if (meetingIds.length > 0) {
    const { data: notesRows, error: notesError } = await supabase
      .from("meeting_notes")
      .select("meeting_id, raw_notes, transcript, structured_summary")
      .in("meeting_id", meetingIds);

    if (notesError) {
      console.error("getManagerProspectDetail notes:", notesError.message);
    }

    for (const row of notesRows ?? []) {
      notesByMeetingId.set(row.meeting_id, {
        raw_notes: row.raw_notes,
        transcript: row.transcript,
        structured_summary: row.structured_summary as StructuredSummary,
      });
    }
  }

  return {
    id: prospect.id,
    company: prospect.company,
    website: prospect.website,
    industry: prospect.industry,
    employee_range: prospect.employee_range,
    gtm_maturity: prospect.gtm_maturity,
    buying_intent: prospect.buying_intent,
    stage: prospect.stage as ProspectStage,
    qualification_score: prospect.qualification_score,
    memory_json: (prospect.memory_json ?? {}) as ProspectMemory,
    owner_name: ownerName,
    updated_at: prospect.updated_at,
    insight: insightRow
      ? {
          health: insightRow.health as DealHealth,
          risk: insightRow.risk,
          coaching: insightRow.coaching,
          pipeline_signal: insightRow.pipeline_signal,
          patterns: Array.isArray(insightRow.patterns)
            ? (insightRow.patterns as string[])
            : [],
        }
      : null,
    meetings: meetings.map((row) => {
      const notesRow = notesByMeetingId.get(row.id) ?? null;
      const rep = Array.isArray(row.rep) ? row.rep[0] : row.rep;

      return {
        id: row.id,
        type: row.type as MeetingType,
        scheduled_at: row.scheduled_at,
        completed_at: row.completed_at ?? null,
        triage_status: row.triage_status as TriageStatus | null,
        triage_explanation: row.triage_explanation,
        rep_name: rep?.full_name ?? ownerName,
        has_notes: Boolean(notesRow?.raw_notes?.trim()),
        notes: notesRow
          ? {
              raw_notes: notesRow.raw_notes,
              transcript: notesRow.transcript,
              structured_summary: notesRow.structured_summary,
            }
          : null,
      };
    }),
    milestones: milestones.map((row) => ({
      id: row.id,
      prospect_id: row.prospect_id,
      company: prospect.company,
      health: (insightRow?.health as DealHealth | null) ?? null,
      occurred_at: row.occurred_at,
      label: row.label,
      next_step: row.next_step,
      tone: row.tone,
    })),
  };
}
