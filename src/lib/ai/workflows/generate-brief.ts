import { generateJsonWithMeta, isGeminiConfigured } from "@/lib/ai/gemini";
import {
  buildBriefPrompt,
  parseBriefResponse,
} from "@/lib/ai/prompts/brief";
import { type TriageResult } from "@/lib/ai/prompts/triage";
import {
  buildBriefFromMemory,
  buildTriageFromMemory,
} from "@/lib/ai/fallbacks/templates";
import { enrichCompanyWebsite } from "@/lib/enrichment/firecrawl";
import { createServiceClient } from "@/lib/auth/demo-users";
import { createClient } from "@/lib/supabase/server";
import type { MeetingBrief, MeetingType, ProspectMemory } from "@/types";

export interface GenerateBriefResult {
  brief: MeetingBrief;
  source: "ai" | "template";
  triage: TriageResult;
  gemini_configured: boolean;
  ai_model?: string;
  ai_error?: string;
}

const ENRICHMENT_TIMEOUT_MS = 1500;

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T | null> {
  return Promise.race([
    promise,
    new Promise<null>((resolve) => setTimeout(() => resolve(null), ms)),
  ]);
}

function memoryHasBriefContext(memory: ProspectMemory): boolean {
  return (
    (memory.pain_points?.length ?? 0) > 0 ||
    (memory.objections?.length ?? 0) > 0 ||
    (memory.next_actions?.length ?? 0) > 0 ||
    (memory.buying_signals?.length ?? 0) > 0
  );
}

export async function pregenerateMeetingBrief(
  meetingId: string,
  repId: string
): Promise<void> {
  try {
    await generateBriefWorkflow(meetingId, repId);
  } catch (error) {
    console.error(`pregenerateMeetingBrief ${meetingId}:`, error);
  }
}

export async function generateBriefWorkflow(
  meetingId: string,
  repId: string
): Promise<GenerateBriefResult> {
  const supabase = await createClient();

  const { data: meeting, error } = await supabase
    .from("meetings")
    .select(
      `
      id,
      type,
      rep_id,
      prospect:prospects (
        id,
        company,
        website,
        industry,
        employee_range,
        buying_intent,
        memory_json,
        updated_at
      )
    `
    )
    .eq("id", meetingId)
    .eq("rep_id", repId)
    .single();

  if (error || !meeting) {
    throw new Error("Meeting not found");
  }

  const prospect = Array.isArray(meeting.prospect)
    ? meeting.prospect[0]
    : meeting.prospect;

  if (!prospect) {
    throw new Error("Prospect not found");
  }

  const memory = (prospect.memory_json ?? {}) as ProspectMemory;
  const meetingType = meeting.type as MeetingType;
  const enrichment = memoryHasBriefContext(memory)
    ? null
    : await withTimeout(enrichCompanyWebsite(prospect.website), ENRICHMENT_TIMEOUT_MS);

  const enrichedMemory: ProspectMemory = {
    ...memory,
    buying_signals: [
      ...(memory.buying_signals ?? []),
      ...(enrichment?.buying_signals ?? []),
    ].slice(0, 6),
  };

  let brief: MeetingBrief;
  const triage = buildTriageFromMemory(prospect, enrichedMemory);
  let source: "ai" | "template" = "template";
  let aiModel: string | undefined;
  let aiError: string | undefined;

  if (isGeminiConfigured()) {
    const briefPrompt = buildBriefPrompt({
      company: prospect.company,
      website: prospect.website,
      industry: enrichment?.industry ?? prospect.industry,
      employee_range: prospect.employee_range,
      buying_intent: prospect.buying_intent,
      meetingType,
      memory: enrichedMemory,
      enrichment,
    });

    const briefResult = await generateJsonWithMeta<unknown>(briefPrompt);
    const parsedBrief = parseBriefResponse(briefResult.data);

    brief =
      parsedBrief ??
      buildBriefFromMemory(
        { ...prospect, industry: enrichment?.industry ?? prospect.industry },
        meetingType,
        enrichedMemory
      );
    source = parsedBrief ? "ai" : "template";
    aiModel = briefResult.model;
    aiError = parsedBrief
      ? undefined
      : briefResult.error ??
        (briefResult.data
          ? "AI response could not be parsed"
          : "Gemini request failed");
  } else {
    brief = buildBriefFromMemory(prospect, meetingType, enrichedMemory);
  }

  const serviceClient = createServiceClient();

  const [{ error: triageError }, { error: briefError }] = await Promise.all([
    serviceClient
      .from("meetings")
      .update({
        triage_status: triage.status,
        triage_explanation: triage.explanation,
      })
      .eq("id", meetingId),
    serviceClient.from("briefs").upsert(
      {
        meeting_id: meetingId,
        brief,
        source,
      },
      { onConflict: "meeting_id" }
    ),
  ]);

  if (triageError) {
    throw triageError;
  }

  if (briefError) {
    throw briefError;
  }

  return {
    brief,
    source,
    triage,
    gemini_configured: isGeminiConfigured(),
    ai_model: aiModel,
    ai_error: aiError,
  };
}
