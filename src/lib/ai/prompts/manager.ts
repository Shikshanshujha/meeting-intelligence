import type { DealHealth, ProspectMemory } from "@/types";

interface ManagerPromptInput {
  company: string;
  memory: ProspectMemory;
  qualificationScore: number;
  latestNotes: string;
}

export interface ManagerInsightResult {
  health: DealHealth;
  risk: string;
  coaching: string;
  pipeline_signal: string;
  patterns: string[];
}

export function buildManagerPrompt(input: ManagerPromptInput): string {
  return `You are a sales manager AI. Produce structured deal intelligence — NOT raw LLM prose for the UI.

Company: ${input.company}
Qualification score: ${input.qualificationScore}/100
Memory: ${JSON.stringify(input.memory)}
Latest notes excerpt: ${input.latestNotes.slice(0, 500)}

Return JSON only:
{
  "health": "green" | "yellow" | "red",
  "risk": "one line risk summary",
  "coaching": "one line coaching for the rep",
  "pipeline_signal": "one line pipeline read",
  "patterns": ["2-4 short pattern tags"]
}`;
}

export function parseManagerResponse(raw: unknown): ManagerInsightResult | null {
  if (!raw || typeof raw !== "object") return null;
  const obj = raw as Record<string, unknown>;
  const health = obj.health;
  if (health !== "green" && health !== "yellow" && health !== "red") {
    return null;
  }

  const str = (v: unknown, fallback: string) =>
    typeof v === "string" ? v.slice(0, 300) : fallback;

  return {
    health,
    risk: str(obj.risk, "Review deal qualification."),
    coaching: str(obj.coaching, "Coach rep on next steps."),
    pipeline_signal: str(obj.pipeline_signal, `${health} deal signal`),
    patterns: Array.isArray(obj.patterns)
      ? obj.patterns.filter((x) => typeof x === "string").slice(0, 4)
      : [],
  };
}
