import type { ProspectMemory, TriageStatus } from "@/types";
import type { EnrichmentContext } from "@/lib/enrichment/types";

interface TriagePromptInput {
  company: string;
  industry?: string | null;
  memory: ProspectMemory;
  enrichment?: EnrichmentContext | null;
}

export interface TriageResult {
  status: TriageStatus;
  explanation: string;
}

export function buildTriagePrompt(input: TriagePromptInput): string {
  return `You are a sales qualification assistant. Decide if the rep should invest prep time in this meeting.

Never auto-block — only advise Proceed, Warning, or Skip (reject signal).

Company: ${input.company}
Industry: ${input.industry ?? "unknown"}
Memory: ${JSON.stringify(input.memory)}
Enrichment: ${JSON.stringify(input.enrichment ?? {})}

Watch for: competitor research, wrong buyer, low qualification, weak intent, shopping behavior.

Return JSON only:
{
  "status": "proceed" | "warning" | "reject",
  "explanation": "one sentence, max 30 words"
}`;
}

export function parseTriageResponse(raw: unknown): TriageResult | null {
  if (!raw || typeof raw !== "object") return null;
  const obj = raw as Record<string, unknown>;
  const status = obj.status;
  if (status !== "proceed" && status !== "warning" && status !== "reject") {
    return null;
  }
  if (typeof obj.explanation !== "string") return null;
  return { status, explanation: obj.explanation.slice(0, 250) };
}
