import { createServiceClient } from "@/lib/auth/demo-users";
import { getSessionProfile } from "@/lib/auth/session";
import {
  mapProspectStageToWorkflow,
  WORKFLOW_STAGES,
} from "@/lib/workflow-stages";
import type { PipelineMilestoneRow } from "@/lib/data/queries";
import type { DealHealth, ProspectStage } from "@/types";

export interface ManagerRepProspectRow {
  id: string;
  company: string;
  industry: string | null;
  stage: ProspectStage;
  workflow_stage: string;
  qualification_score: number;
  health: DealHealth | null;
  updated_at: string;
}

export interface ManagerRepDetail {
  id: string;
  full_name: string;
  email: string;
  development_areas: string[];
  stats: {
    prospect_count: number;
    green: number;
    yellow: number;
    red: number;
    converted: number;
    rejected: number;
    active: number;
  };
  prospects: ManagerRepProspectRow[];
  recent_milestones: PipelineMilestoneRow[];
}

export async function getManagerRepDetail(
  repId: string
): Promise<ManagerRepDetail | null> {
  const profile = await getSessionProfile();

  if (!profile || profile.role !== "manager") {
    return null;
  }

  const supabase = createServiceClient();

  const { data: rep, error: repError } = await supabase
    .from("profiles")
    .select("id, full_name, email, development_areas")
    .eq("id", repId)
    .eq("role", "rep")
    .single();

  if (repError || !rep) {
    console.error("getManagerRepDetail rep:", repError?.message);
    return null;
  }

  const { data: prospects, error: prospectError } = await supabase
    .from("prospects")
    .select(
      `
      id,
      company,
      industry,
      stage,
      qualification_score,
      updated_at,
      manager_insights ( health )
    `
    )
    .eq("owner_id", repId)
    .order("updated_at", { ascending: false });

  if (prospectError) {
    console.error("getManagerRepDetail prospects:", prospectError.message);
    return null;
  }

  const prospectRows = prospects ?? [];
  const prospectIds = prospectRows.map((p) => p.id);
  const companyMap = new Map(prospectRows.map((p) => [p.id, p.company]));
  const healthMap = new Map<string, DealHealth | null>();

  for (const row of prospectRows) {
    const insight = Array.isArray(row.manager_insights)
      ? row.manager_insights[0]
      : row.manager_insights;
    healthMap.set(row.id, (insight?.health as DealHealth | undefined) ?? null);
  }

  let recent_milestones: PipelineMilestoneRow[] = [];

  if (prospectIds.length > 0) {
    const { data: milestones, error: milestoneError } = await supabase
      .from("pipeline_milestones")
      .select("id, prospect_id, occurred_at, label, next_step, tone")
      .in("prospect_id", prospectIds)
      .order("occurred_at", { ascending: false })
      .limit(12);

    if (milestoneError) {
      console.error("getManagerRepDetail milestones:", milestoneError.message);
    }

    recent_milestones = (milestones ?? []).map((row) => ({
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

  const mappedProspects: ManagerRepProspectRow[] = prospectRows.map((row) => {
    const workflowKey = mapProspectStageToWorkflow(row.stage as ProspectStage);
    const workflowLabel =
      WORKFLOW_STAGES.find((stage) => stage.key === workflowKey)?.label ??
      row.stage;

    return {
      id: row.id,
      company: row.company,
      industry: row.industry,
      stage: row.stage as ProspectStage,
      workflow_stage: workflowLabel,
      qualification_score: row.qualification_score,
      health: healthMap.get(row.id) ?? null,
      updated_at: row.updated_at,
    };
  });

  const stats = mappedProspects.reduce(
    (acc, prospect) => {
      acc.prospect_count += 1;
      if (prospect.health === "green") acc.green += 1;
      if (prospect.health === "yellow") acc.yellow += 1;
      if (prospect.health === "red") acc.red += 1;
      if (prospect.stage === "won") acc.converted += 1;
      if (prospect.stage === "rejected") acc.rejected += 1;
      if (prospect.stage !== "won" && prospect.stage !== "rejected") {
        acc.active += 1;
      }
      return acc;
    },
    {
      prospect_count: 0,
      green: 0,
      yellow: 0,
      red: 0,
      converted: 0,
      rejected: 0,
      active: 0,
    }
  );

  return {
    id: rep.id,
    full_name: rep.full_name,
    email: rep.email,
    development_areas: Array.isArray(rep.development_areas)
      ? (rep.development_areas as string[])
      : [],
    stats,
    prospects: mappedProspects,
    recent_milestones,
  };
}
