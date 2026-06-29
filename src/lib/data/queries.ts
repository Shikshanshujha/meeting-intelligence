import { createClient } from "@/lib/supabase/server";
import { getDateRange, isWithinRange, type DateRangeKey } from "@/lib/date-ranges";
import {
  formatDate,
  formatMeetingType,
  formatStage,
  isMeetingPast,
  isUpcoming,
} from "@/lib/data/formatters";
import type { WorkflowStageFilter } from "@/lib/infer-pipeline-stage";
import {
  mapProspectStageToWorkflow,
  type WorkflowStage,
} from "@/lib/workflow-stages";
import type {
  DealHealth,
  MeetingBrief,
  MeetingType,
  ProspectMemory,
  ProspectStage,
  StructuredSummary,
  TriageStatus,
} from "@/types";

export interface RepMeetingRow {
  id: string;
  type: MeetingType;
  scheduled_at: string;
  completed_at: string | null;
  meeting_link: string | null;
  triage_status: TriageStatus | null;
  triage_explanation: string | null;
  open_points: string[];
  prospect: {
    id: string;
    company: string;
    website: string;
    stage: ProspectStage;
    memory: ProspectMemory | null;
  };
  has_notes: boolean;
  has_brief: boolean;
}

export interface RepProspectOption {
  id: string;
  company: string;
  stage: ProspectStage;
}

export async function getRepProspects(repId: string): Promise<RepProspectOption[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("prospects")
    .select("id, company, stage")
    .eq("owner_id", repId)
    .not("stage", "in", '("won","rejected")')
    .order("company");

  if (error) {
    console.error("getRepProspects:", error.message);
    return [];
  }

  return (data ?? []).map((row) => ({
    id: row.id,
    company: row.company,
    stage: row.stage as ProspectStage,
  }));
}

export interface ManagerProspectRow {
  id: string;
  company: string;
  industry: string | null;
  stage: ProspectStage;
  qualification_score: number;
  owner_name: string;
  owner_id: string;
  updated_at: string;
  insight: {
    health: DealHealth;
    risk: string | null;
    coaching: string | null;
    pipeline_signal: string | null;
    patterns: string[];
  } | null;
}

export interface PipelineMilestoneRow {
  id: string;
  prospect_id: string;
  company: string;
  health: DealHealth | null;
  occurred_at: string;
  label: string;
  next_step: string | null;
  tone: string;
}

export interface RepComparisonRow {
  id: string;
  full_name: string;
  prospect_count: number;
  green: number;
  yellow: number;
  red: number;
  converted: number;
  development_areas: string[];
}

export interface LearningLeaps {
  worked_well: string[];
  didnt_work: string[];
}

export interface ManagerDashboardData {
  prospects: ManagerProspectRow[];
  milestones: PipelineMilestoneRow[];
  reps: RepComparisonRow[];
  learning: LearningLeaps;
}

export async function getRepMeetings(repId: string): Promise<RepMeetingRow[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("meetings")
    .select(
      `
      id,
      type,
      scheduled_at,
      completed_at,
      meeting_link,
      triage_status,
      triage_explanation,
      open_points,
      prospect:prospects!inner (
        id,
        company,
        website,
        stage,
        memory_json
      ),
      briefs ( id ),
      meeting_notes ( id )
    `
    )
    .eq("rep_id", repId)
    .order("scheduled_at", { ascending: true });

  if (error) {
    console.error("getRepMeetings:", error.message);
    return [];
  }

  return (data ?? []).map((row) => {
    const prospect = Array.isArray(row.prospect) ? row.prospect[0] : row.prospect;

    return {
      id: row.id,
      type: row.type as MeetingType,
      scheduled_at: row.scheduled_at,
      completed_at: row.completed_at ?? null,
      meeting_link: row.meeting_link ?? null,
      triage_status: row.triage_status as TriageStatus | null,
      triage_explanation: row.triage_explanation,
      open_points: Array.isArray(row.open_points)
        ? (row.open_points as string[])
        : [],
      prospect: {
        id: prospect.id,
        company: prospect.company,
        website: prospect.website,
        stage: prospect.stage as ProspectStage,
        memory: (prospect.memory_json as ProspectMemory | null) ?? null,
      },
      has_brief: (row.briefs?.length ?? 0) > 0,
      has_notes:
        Boolean(row.completed_at) && (row.meeting_notes?.length ?? 0) > 0,
    };
  });
}

export async function getManagerPipeline(): Promise<ManagerProspectRow[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("prospects")
    .select(
      `
      id,
      company,
      industry,
      stage,
      qualification_score,
      updated_at,
      owner:profiles!prospects_owner_id_fkey ( id, full_name ),
      manager_insights ( health, risk, coaching, pipeline_signal, patterns )
    `
    )
    .order("qualification_score", { ascending: false });

  if (error) {
    console.error("getManagerPipeline:", error.message);
    return [];
  }

  return (data ?? []).map((row) => {
    const owner = Array.isArray(row.owner) ? row.owner[0] : row.owner;
    const insight = Array.isArray(row.manager_insights)
      ? row.manager_insights[0]
      : row.manager_insights;

    return {
      id: row.id,
      company: row.company,
      industry: row.industry,
      stage: row.stage as ProspectStage,
      qualification_score: row.qualification_score,
      owner_name: owner?.full_name ?? "Unassigned",
      owner_id: owner?.id ?? "",
      updated_at: row.updated_at,
      insight: insight
        ? {
            health: insight.health as DealHealth,
            risk: insight.risk,
            coaching: insight.coaching,
            pipeline_signal: insight.pipeline_signal,
            patterns: Array.isArray(insight.patterns)
              ? (insight.patterns as string[])
              : [],
          }
        : null,
    };
  });
}

export async function getManagerDashboard(
  rangeKey: DateRangeKey = "current_quarter"
): Promise<ManagerDashboardData> {
  const range = getDateRange(rangeKey);
  const allProspects = await getManagerPipeline();
  const allMilestones = await getPipelineMilestonesFromProspects(allProspects);

  const activeProspectIds = new Set(
    allMilestones
      .filter((m) => isWithinRange(m.occurred_at, range))
      .map((m) => m.prospect_id)
  );

  const prospects = allProspects.filter(
    (p) => isWithinRange(p.updated_at, range) || activeProspectIds.has(p.id)
  );

  const milestones = allMilestones
    .filter((m) => isWithinRange(m.occurred_at, range))
    .filter((m) => prospects.some((p) => p.id === m.prospect_id) || activeProspectIds.has(m.prospect_id))
    .map((m) => {
      const prospect = allProspects.find((p) => p.id === m.prospect_id);
      return {
        ...m,
        company: prospect?.company ?? m.company,
        health: prospect?.insight?.health ?? m.health,
      };
    });

  const reps = await getRepComparison(allProspects);
  const learning = await getLearningLeaps();

  return { prospects, milestones, reps, learning };
}

async function getPipelineMilestonesFromProspects(
  prospects: ManagerProspectRow[]
): Promise<PipelineMilestoneRow[]> {
  const supabase = await createClient();
  const companyMap = new Map(prospects.map((p) => [p.id, p.company]));
  const healthMap = new Map(
    prospects.map((p) => [p.id, p.insight?.health ?? null])
  );

  const { data, error } = await supabase
    .from("pipeline_milestones")
    .select("id, prospect_id, occurred_at, label, next_step, tone")
    .order("occurred_at", { ascending: false });

  if (error) {
    console.error("getPipelineMilestones:", error.message);
    return [];
  }

  return (data ?? []).map((row) => ({
    id: row.id,
    prospect_id: row.prospect_id,
    company: companyMap.get(row.prospect_id) ?? "Unknown",
    health: healthMap.get(row.prospect_id) ?? null,
    occurred_at: row.occurred_at,
    label: row.label,
    next_step: row.next_step,
    tone: row.tone,
  }));
}

export async function getRepComparison(
  prospects: ManagerProspectRow[]
): Promise<RepComparisonRow[]> {
  const supabase = await createClient();

  const { data: reps, error } = await supabase
    .from("profiles")
    .select("id, full_name, development_areas")
    .eq("role", "rep");

  if (error || !reps) {
    console.error("getRepComparison:", error?.message);
    return [];
  }

  return reps.map((rep) => {
    const owned = prospects.filter((p) => p.owner_id === rep.id);
    const health = { green: 0, yellow: 0, red: 0 };
    for (const p of owned) {
      const h = p.insight?.health;
      if (h) health[h] += 1;
    }

    return {
      id: rep.id,
      full_name: rep.full_name,
      prospect_count: owned.length,
      green: health.green,
      yellow: health.yellow,
      red: health.red,
      converted: owned.filter((p) => p.stage === "won").length,
      development_areas: Array.isArray(rep.development_areas)
        ? (rep.development_areas as string[])
        : [],
    };
  });
}

export async function getLearningLeaps(): Promise<LearningLeaps> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("learning_leaps")
    .select("worked_well, didnt_work")
    .limit(1)
    .single();

  return {
    worked_well: Array.isArray(data?.worked_well)
      ? (data.worked_well as string[])
      : [],
    didnt_work: Array.isArray(data?.didnt_work)
      ? (data.didnt_work as string[])
      : [],
  };
}

export function getWorkflowCounts(prospects: ManagerProspectRow[]) {
  const counts: Record<WorkflowStage, number> = {
    first_call: 0,
    follow_up: 0,
    demo_scheduled: 0,
    ongoing_pilot: 0,
    converted: 0,
    rejected: 0,
  };

  for (const prospect of prospects) {
    const key = mapProspectStageToWorkflow(prospect.stage);
    counts[key] += 1;
  }

  return counts;
}

export function getHealthCounts(prospects: ManagerProspectRow[]) {
  return prospects.reduce(
    (acc, prospect) => {
      const health = prospect.insight?.health;
      if (health) acc[health] += 1;
      return acc;
    },
    { green: 0, yellow: 0, red: 0 }
  );
}

export function getStageCounts(prospects: ManagerProspectRow[]) {
  return prospects.reduce<Record<string, number>>((acc, prospect) => {
    acc[prospect.stage] = (acc[prospect.stage] ?? 0) + 1;
    return acc;
  }, {});
}

export {
  formatDate,
  formatMeetingType,
  formatStage,
  isMeetingPast,
  isUpcoming,
} from "@/lib/data/formatters";

export interface RepMeetingDetail {
  id: string;
  type: MeetingType;
  scheduled_at: string;
  completed_at: string | null;
  prospect_id: string;
  meeting_link: string | null;
  open_points: string[];
  triage_status: TriageStatus | null;
  triage_explanation: string | null;
  last_meeting_line: string | null;
  memory_stamp: string;
  prospect: {
    id: string;
    company: string;
    website: string;
    industry: string | null;
    stage: ProspectStage;
    memory_json: ProspectMemory;
  };
  brief: {
    brief: MeetingBrief;
    source: string;
  } | null;
  notes: {
    raw_notes: string;
    transcript: string | null;
    structured_summary: StructuredSummary;
  } | null;
}

export async function getRepMeetingDetail(
  meetingId: string,
  repId: string
): Promise<RepMeetingDetail | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("meetings")
    .select(
      `
      id,
      type,
      scheduled_at,
      prospect_id,
      completed_at,
      meeting_link,
      open_points,
      triage_status,
      triage_explanation,
      prospect:prospects!inner (
        id,
        company,
        website,
        industry,
        stage,
        memory_json,
        updated_at
      ),
      briefs ( brief, source ),
      meeting_notes ( raw_notes, transcript, structured_summary )
    `
    )
    .eq("id", meetingId)
    .eq("rep_id", repId)
    .single();

  if (error || !data) {
    console.error("getRepMeetingDetail:", error?.message);
    return null;
  }

  const prospect = Array.isArray(data.prospect) ? data.prospect[0] : data.prospect;
  const briefRow = Array.isArray(data.briefs) ? data.briefs[0] : data.briefs;
  const notesRow = Array.isArray(data.meeting_notes)
    ? data.meeting_notes[0]
    : data.meeting_notes;

  const lastMeetingLine = await getLastMeetingLine(
    data.prospect_id,
    data.scheduled_at,
    repId
  );

  return {
    id: data.id,
    type: data.type as MeetingType,
    scheduled_at: data.scheduled_at,
    completed_at: data.completed_at ?? null,
    prospect_id: data.prospect_id,
    meeting_link: data.meeting_link,
    open_points: Array.isArray(data.open_points)
      ? (data.open_points as string[])
      : [],
    triage_status: data.triage_status as TriageStatus | null,
    triage_explanation: data.triage_explanation,
    last_meeting_line: lastMeetingLine,
    memory_stamp: prospect.updated_at ?? data.scheduled_at,
    prospect: {
      ...prospect,
      memory_json: (prospect.memory_json ?? {}) as ProspectMemory,
    },
    brief: briefRow
      ? {
          brief: briefRow.brief as MeetingBrief,
          source: briefRow.source,
        }
      : null,
    notes: notesRow
      ? {
          raw_notes: notesRow.raw_notes,
          transcript: notesRow.transcript,
          structured_summary: notesRow.structured_summary as StructuredSummary,
        }
      : null,
  };
}

async function getLastMeetingLine(
  prospectId: string,
  beforeDate: string,
  repId: string
): Promise<string | null> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("meetings")
    .select(
      `
      scheduled_at,
      meeting_notes ( raw_notes )
    `
    )
    .eq("prospect_id", prospectId)
    .eq("rep_id", repId)
    .lt("scheduled_at", beforeDate)
    .order("scheduled_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const notes = Array.isArray(data?.meeting_notes)
    ? data.meeting_notes[0]
    : data?.meeting_notes;

  if (!notes?.raw_notes) return null;

  const firstSentence = notes.raw_notes.split(/[.!?]/)[0]?.trim();
  return firstSentence ? `${firstSentence}.` : null;
}

export function getNextUpcomingMeeting(
  meetings: RepMeetingRow[]
): RepMeetingRow | null {
  return (
    meetings.find(
      (meeting) => isUpcoming(meeting.scheduled_at, meeting.completed_at)
    ) ?? null
  );
}

export function getUpcomingMeetingForProspect(
  meetings: RepMeetingRow[],
  prospectId: string
): RepMeetingRow | null {
  const upcoming = meetings.filter(
    (meeting) =>
      meeting.prospect.id === prospectId &&
      isUpcoming(meeting.scheduled_at, meeting.completed_at)
  );

  if (upcoming.length === 0) {
    return null;
  }

  return upcoming.sort(
    (a, b) =>
      new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime()
  )[0];
}

export function indexUpcomingMeetingsByProspect(
  meetings: RepMeetingRow[]
): Record<string, RepMeetingRow> {
  const indexed: Record<string, RepMeetingRow> = {};

  for (const meeting of meetings) {
    if (!isUpcoming(meeting.scheduled_at, meeting.completed_at)) {
      continue;
    }

    const existing = indexed[meeting.prospect.id];
    if (
      !existing ||
      new Date(meeting.scheduled_at).getTime() <
        new Date(existing.scheduled_at).getTime()
    ) {
      indexed[meeting.prospect.id] = meeting;
    }
  }

  return indexed;
}

export function filterRepMeetings(
  meetings: RepMeetingRow[],
  rangeKey: DateRangeKey,
  stageFilter: WorkflowStageFilter = "all"
): RepMeetingRow[] {
  const range = getDateRange(rangeKey);

  return meetings.filter((meeting) => {
    const workflow = mapProspectStageToWorkflow(meeting.prospect.stage);
    if (stageFilter !== "all" && workflow !== stageFilter) {
      return false;
    }

    const upcoming = isUpcoming(meeting.scheduled_at, meeting.completed_at);
    if (upcoming) {
      return true;
    }

    const activityDate = meeting.completed_at ?? meeting.scheduled_at;
    return isWithinRange(activityDate, range);
  });
}
