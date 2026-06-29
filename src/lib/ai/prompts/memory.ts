import type { ProspectMemory, StructuredSummary } from "@/types";
import { isProspectStage } from "@/lib/infer-pipeline-stage";

interface MemoryPromptInput {
  company: string;
  rawNotes: string;
  transcript?: string | null;
  existingMemory: ProspectMemory;
}

export function buildMemoryPrompt(input: MemoryPromptInput): string {
  return `Extract structured meeting intelligence from sales notes for Gushwork.

Company: ${input.company}
Existing memory: ${JSON.stringify(input.existingMemory)}

Rep notes:
${input.rawNotes}

${input.transcript ? `Transcript excerpt:\n${input.transcript.slice(0, 2000)}` : ""}

Return JSON only:
{
  "pain_points": ["strings"],
  "budget": "string or null",
  "stakeholders": ["strings"],
  "timeline": "string or null",
  "sentiment": "positive" | "neutral" | "cautious" | "negative",
  "objections": ["strings"],
  "next_actions": ["strings"],
  "pipeline_stage": "discovery" | "follow_up" | "demo_scheduled" | "closing" | "won" | "rejected"
}`;
}

export function parseMemoryResponse(raw: unknown): StructuredSummary | null {
  if (!raw || typeof raw !== "object") return null;
  const obj = raw as Record<string, unknown>;
  const arr = (v: unknown) =>
    Array.isArray(v) ? v.filter((x) => typeof x === "string") : [];

  const pipelineStage =
    typeof obj.pipeline_stage === "string" && isProspectStage(obj.pipeline_stage)
      ? obj.pipeline_stage
      : undefined;

  return {
    pain_points: arr(obj.pain_points),
    budget: typeof obj.budget === "string" ? obj.budget : undefined,
    stakeholders: arr(obj.stakeholders),
    timeline: typeof obj.timeline === "string" ? obj.timeline : undefined,
    sentiment: typeof obj.sentiment === "string" ? obj.sentiment : undefined,
    objections: arr(obj.objections),
    next_actions: arr(obj.next_actions),
    pipeline_stage: pipelineStage,
  };
}

export function buildMergedMemory(
  existing: ProspectMemory,
  summary: StructuredSummary
): ProspectMemory {
  const unique = (values: string[]) =>
    [...new Set(values.filter(Boolean))];

  return {
    concerns: unique([...(existing.concerns ?? []), ...summary.objections]),
    buying_signals: existing.buying_signals,
    pain_points: unique([...(existing.pain_points ?? []), ...summary.pain_points]),
    stakeholders: unique([
      ...(existing.stakeholders ?? []),
      ...summary.stakeholders,
    ]),
    timeline: summary.timeline ?? existing.timeline,
    objections: unique([...(existing.objections ?? []), ...summary.objections]),
    next_actions: summary.next_actions.length
      ? summary.next_actions
      : existing.next_actions,
    sentiment: summary.sentiment ?? existing.sentiment,
    urgency: existing.urgency,
  };
}
