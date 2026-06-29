import { generateJson, isGeminiConfigured } from "@/lib/ai/gemini";
import {
  buildManagerInsightFromMemory,
  buildStructuredSummaryFromNotes,
  mergeMemory,
} from "@/lib/ai/fallbacks/templates";
import {
  buildManagerPrompt,
  parseManagerResponse,
} from "@/lib/ai/prompts/manager";
import {
  buildMemoryPrompt,
  buildMergedMemory,
  parseMemoryResponse,
} from "@/lib/ai/prompts/memory";
import { inferProspectStageFromNotes } from "@/lib/infer-pipeline-stage";
import { createServiceClient } from "@/lib/auth/demo-users";
import { createClient } from "@/lib/supabase/server";
import type {
  MeetingType,
  ProspectMemory,
  ProspectStage,
  StructuredSummary,
} from "@/types";

export interface ProcessNotesOptions {
  markComplete?: boolean;
}

export interface ProcessNotesResult {
  structured_summary: StructuredSummary;
  memory: ProspectMemory;
  source: "ai" | "template";
  completed: boolean;
  memory_stamp: string;
  stage: ProspectStage;
}

async function invalidateProspectBriefs(
  serviceClient: ReturnType<typeof createServiceClient>,
  prospectId: string
) {
  const { data: meetings } = await serviceClient
    .from("meetings")
    .select("id")
    .eq("prospect_id", prospectId);

  const meetingIds = (meetings ?? []).map((m) => m.id);
  if (meetingIds.length === 0) return;

  await serviceClient.from("briefs").delete().in("meeting_id", meetingIds);
}

export async function processNotesWorkflow(
  meetingId: string,
  repId: string,
  rawNotes: string,
  transcript?: string | null,
  options?: ProcessNotesOptions
): Promise<ProcessNotesResult> {
  if (!options?.markComplete) {
    throw new Error("Notes can only be submitted when marking the meeting complete");
  }

  const supabase = await createClient();

  const { data: meeting, error } = await supabase
    .from("meetings")
    .select(
      `
      id,
      type,
      rep_id,
      completed_at,
      prospect:prospects (
        id,
        company,
        stage,
        memory_json,
        qualification_score
      )
    `
    )
    .eq("id", meetingId)
    .eq("rep_id", repId)
    .single();

  if (error || !meeting) {
    throw new Error("Meeting not found");
  }

  if (meeting.completed_at) {
    throw new Error("This meeting is already completed");
  }

  const prospect = Array.isArray(meeting.prospect)
    ? meeting.prospect[0]
    : meeting.prospect;

  if (!prospect) {
    throw new Error("Prospect not found");
  }

  const currentStage = prospect.stage as ProspectStage;
  const meetingType = meeting.type as MeetingType;
  const existingMemory = (prospect.memory_json ?? {}) as ProspectMemory;
  const serviceClient = createServiceClient();

  let structured_summary: StructuredSummary;
  let memory: ProspectMemory;
  let source: "ai" | "template" = "template";

  if (isGeminiConfigured()) {
    const memoryPrompt = buildMemoryPrompt({
      company: prospect.company,
      rawNotes,
      transcript,
      existingMemory,
    });

    const aiSummary = await generateJson<unknown>(memoryPrompt);
    const parsedSummary = parseMemoryResponse(aiSummary);

    structured_summary =
      parsedSummary ?? buildStructuredSummaryFromNotes(rawNotes, transcript);
    memory = parsedSummary
      ? buildMergedMemory(existingMemory, structured_summary)
      : mergeMemory(existingMemory, structured_summary);
    source = parsedSummary ? "ai" : "template";
  } else {
    structured_summary = buildStructuredSummaryFromNotes(rawNotes, transcript);
    memory = mergeMemory(existingMemory, structured_summary);
  }

  const nextStage = inferProspectStageFromNotes(
    rawNotes,
    structured_summary,
    currentStage,
    meetingType,
    structured_summary.pipeline_stage
  );

  const { error: notesError } = await serviceClient.from("meeting_notes").upsert(
    {
      meeting_id: meetingId,
      raw_notes: rawNotes,
      transcript: transcript ?? null,
      structured_summary,
    },
    { onConflict: "meeting_id" }
  );

  if (notesError) {
    throw new Error(`Notes save failed: ${notesError.message}`);
  }

  const now = new Date().toISOString();

  const { error: memoryError } = await serviceClient
    .from("prospects")
    .update({
      memory_json: memory,
      stage: nextStage,
      updated_at: now,
    })
    .eq("id", prospect.id);

  if (memoryError) {
    throw new Error(`Memory update failed: ${memoryError.message}`);
  }

  await invalidateProspectBriefs(serviceClient, prospect.id);

  const { error: completeError } = await serviceClient
    .from("meetings")
    .update({
      completed_at: now,
      open_points: structured_summary.next_actions.slice(0, 5),
    })
    .eq("id", meetingId);

  if (completeError) {
    throw new Error(`Could not mark meeting complete: ${completeError.message}`);
  }

  const managerPrompt = buildManagerPrompt({
    company: prospect.company,
    memory,
    qualificationScore: prospect.qualification_score ?? 50,
    latestNotes: rawNotes,
  });

  let insight = buildManagerInsightFromMemory(
    prospect.company,
    memory,
    prospect.qualification_score ?? 50
  );

  if (isGeminiConfigured()) {
    const aiInsight = await generateJson<unknown>(managerPrompt);
    const parsedInsight = parseManagerResponse(aiInsight);
    if (parsedInsight) insight = parsedInsight;
  }

  const { error: insightError } = await serviceClient
    .from("manager_insights")
    .upsert(
      {
        prospect_id: prospect.id,
        health: insight.health,
        risk: insight.risk,
        coaching: insight.coaching,
        pipeline_signal: insight.pipeline_signal,
        patterns: insight.patterns,
        updated_at: now,
      },
      { onConflict: "prospect_id" }
    );

  if (insightError) {
    console.error("manager_insights upsert:", insightError.message);
  }

  try {
    const milestoneLabel =
      structured_summary.objections[0] ??
      structured_summary.pain_points[0] ??
      `Moved to ${nextStage.replace("_", " ")}`;
    const tone =
      nextStage === "rejected"
        ? "negative"
        : nextStage === "won"
          ? "positive"
          : structured_summary.sentiment === "negative"
            ? "negative"
            : structured_summary.sentiment === "positive"
              ? "positive"
              : "warning";

    await serviceClient.from("pipeline_milestones").insert({
      prospect_id: prospect.id,
      occurred_at: now,
      label: milestoneLabel.slice(0, 80),
      next_step: structured_summary.next_actions[0] ?? null,
      tone,
    });
  } catch (milestoneError) {
    console.error("pipeline_milestones insert:", milestoneError);
  }

  return {
    structured_summary,
    memory,
    source,
    completed: true,
    memory_stamp: now,
    stage: nextStage,
  };
}
