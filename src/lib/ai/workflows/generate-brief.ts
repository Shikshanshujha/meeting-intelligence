import { generateJsonWithMeta, isGeminiConfigured } from "@/lib/ai/gemini";
import {
  buildBriefPrompt,
  parseBriefResponse,
} from "@/lib/ai/prompts/brief";
import {
  buildTriagePrompt,
  parseTriageResponse,
  type TriageResult,
} from "@/lib/ai/prompts/triage";
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
  const enrichment = await enrichCompanyWebsite(prospect.website);

  const enrichedMemory: ProspectMemory = {
    ...memory,
    buying_signals: [
      ...(memory.buying_signals ?? []),
      ...(enrichment?.buying_signals ?? []),
    ].slice(0, 6),
  };

  let brief: MeetingBrief;
  let triage: TriageResult;
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

    const triagePrompt = buildTriagePrompt({
      company: prospect.company,
      industry: enrichment?.industry ?? prospect.industry,
      memory: enrichedMemory,
      enrichment,
    });

    const [briefResult, triageResult] = await Promise.all([
      generateJsonWithMeta<unknown>(briefPrompt),
      generateJsonWithMeta<unknown>(triagePrompt),
    ]);

    const parsedBrief = parseBriefResponse(briefResult.data);
    const parsedTriage = parseTriageResponse(triageResult.data);

    brief =
      parsedBrief ??
      buildBriefFromMemory(
        { ...prospect, industry: enrichment?.industry ?? prospect.industry },
        meetingType,
        enrichedMemory
      );
    triage = parsedTriage ?? buildTriageFromMemory(prospect, enrichedMemory);
    source = parsedBrief ? "ai" : "template";
    aiModel = briefResult.model ?? triageResult.model;
    aiError = parsedBrief
      ? undefined
      : briefResult.error ??
        (briefResult.data
          ? "AI response could not be parsed"
          : "Gemini request failed");
  } else {
    brief = buildBriefFromMemory(prospect, meetingType, enrichedMemory);
    triage = buildTriageFromMemory(prospect, enrichedMemory);
  }

  const serviceClient = createServiceClient();

  const { error: triageError } = await serviceClient
    .from("meetings")
    .update({
      triage_status: triage.status,
      triage_explanation: triage.explanation,
    })
    .eq("id", meetingId);

  if (triageError) {
    throw triageError;
  }

  const { error: briefError } = await serviceClient.from("briefs").upsert(
    {
      meeting_id: meetingId,
      brief,
      source,
    },
    { onConflict: "meeting_id" }
  );

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
