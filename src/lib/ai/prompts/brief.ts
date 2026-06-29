import type { MeetingBrief, MeetingType, ProspectMemory } from "@/types";
import type { EnrichmentContext } from "@/lib/enrichment/types";

interface BriefPromptInput {
  company: string;
  website: string;
  industry?: string | null;
  employee_range?: string | null;
  buying_intent?: string | null;
  meetingType: MeetingType;
  memory: ProspectMemory;
  enrichment?: EnrichmentContext | null;
}

export function buildBriefPrompt(input: BriefPromptInput): string {
  return `You are a sales intelligence assistant for Gushwork (content-led SEO for B2B/D2C).

Generate a pre-meeting brief as JSON only. Keep every field scannable — short bullets, no paragraphs.

Meeting type: ${input.meetingType}
Company: ${input.company}
Website: ${input.website}
Industry: ${input.industry ?? "unknown"}
Employees: ${input.employee_range ?? "unknown"}
Buying intent: ${input.buying_intent ?? "unknown"}

Prospect memory from past meetings:
${JSON.stringify(input.memory, null, 2)}

Website enrichment (if any):
${JSON.stringify(input.enrichment ?? {}, null, 2)}

Return JSON matching this exact shape:
{
  "prospect_summary": "one line max 25 words",
  "previous_concerns": ["max 4 items"],
  "buying_signals": ["max 4 items"],
  "deal_risks": ["max 4 items"],
  "questions_to_ask": ["max 5 items"],
  "recommended_outcome": "one line"
}`;
}

function unwrapBriefObject(raw: unknown): Record<string, unknown> | null {
  if (!raw || typeof raw !== "object") return null;
  const obj = raw as Record<string, unknown>;

  if (obj.brief && typeof obj.brief === "object") {
    return obj.brief as Record<string, unknown>;
  }

  return obj;
}

function readString(value: unknown): string | null {
  if (typeof value === "string" && value.trim()) return value.trim();
  if (value && typeof value === "object" && "text" in value) {
    const text = (value as { text?: unknown }).text;
    if (typeof text === "string" && text.trim()) return text.trim();
  }
  return null;
}

function readStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => readString(item))
    .filter((item): item is string => Boolean(item))
    .slice(0, 5);
}

export function parseBriefResponse(raw: unknown): MeetingBrief | null {
  const obj = unwrapBriefObject(raw);
  if (!obj) return null;

  const prospectSummary =
    readString(obj.prospect_summary) ??
    readString(obj.prospectSummary) ??
    readString(obj.summary);

  if (!prospectSummary) return null;

  return {
    prospect_summary: prospectSummary.slice(0, 300),
    previous_concerns: readStringArray(
      obj.previous_concerns ?? obj.previousConcerns ?? obj.concerns
    ),
    buying_signals: readStringArray(
      obj.buying_signals ?? obj.buyingSignals ?? obj.signals
    ),
    deal_risks: readStringArray(obj.deal_risks ?? obj.dealRisks ?? obj.risks),
    questions_to_ask: readStringArray(
      obj.questions_to_ask ?? obj.questionsToAsk ?? obj.questions
    ),
    recommended_outcome:
      readString(obj.recommended_outcome ?? obj.recommendedOutcome) ??
      "Advance deal with clear next step.",
  };
}
