import { createClient } from "@/lib/supabase/server";
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

export async function getManagerProspectDetail(
  prospectId: string
): Promise<ManagerProspectDetail | null> {
  const supabase = await createClient();

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
    console.error("getManagerProspectDetail:", error?.message);
    return null;
  }

  const owner = Array.isArray(prospect.owner) ? prospect.owner[0] : prospect.owner;
  const insightRow = Array.isArray(prospect.manager_insights)
    ? prospect.manager_insights[0]
    : prospect.manager_insights;

  const [{ data: meetings }, { data: milestones }] = await Promise.all([
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
        rep:profiles!meetings_rep_id_fkey ( full_name ),
        meeting_notes ( raw_notes, transcript, structured_summary )
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
    owner_name: owner?.full_name ?? "Unassigned",
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
    meetings: (meetings ?? []).map((row) => {
      const rep = Array.isArray(row.rep) ? row.rep[0] : row.rep;
      const notesRow = Array.isArray(row.meeting_notes)
        ? row.meeting_notes[0]
        : row.meeting_notes;

      return {
        id: row.id,
        type: row.type as MeetingType,
        scheduled_at: row.scheduled_at,
        completed_at: row.completed_at ?? null,
        triage_status: row.triage_status as TriageStatus | null,
        triage_explanation: row.triage_explanation,
        rep_name: rep?.full_name ?? "Rep",
        notes: notesRow
          ? {
              raw_notes: notesRow.raw_notes,
              transcript: notesRow.transcript,
              structured_summary: notesRow.structured_summary as StructuredSummary,
            }
          : null,
      };
    }),
    milestones: (milestones ?? []).map((row) => ({
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
