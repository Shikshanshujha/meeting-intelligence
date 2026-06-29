import type {
  MeetingBrief,
  MeetingType,
  ProspectMemory,
  StructuredSummary,
  TriageStatus,
} from "@/types";

interface ProspectContext {
  company: string;
  website: string;
  industry?: string | null;
  employee_range?: string | null;
  buying_intent?: string | null;
}

interface TriageResult {
  status: TriageStatus;
  explanation: string;
}

export function buildBriefFromMemory(
  prospect: ProspectContext,
  meetingType: MeetingType,
  memory: ProspectMemory
): MeetingBrief {
  const industry = prospect.industry ?? "their industry";
  const size = prospect.employee_range ? `${prospect.employee_range} employees` : "mid-market";

  return {
    prospect_summary: `${prospect.company} (${size}, ${industry}). ${prospect.buying_intent ?? "Evaluating content-led growth support."}`,
    previous_concerns: memory.concerns?.slice(0, 4) ?? [
      "No prior concerns logged — validate pain on this call.",
    ],
    buying_signals: memory.buying_signals?.slice(0, 4) ?? [
      "First meeting — probe for urgency and budget.",
    ],
    deal_risks: [
      ...(memory.objections?.slice(0, 2) ?? []),
      ...(memory.urgency === "low" ? ["Low urgency signal"] : []),
    ].slice(0, 4),
    questions_to_ask: buildQuestions(meetingType, memory),
    recommended_outcome: buildRecommendedOutcome(meetingType, memory),
  };
}

function buildQuestions(
  meetingType: MeetingType,
  memory: ProspectMemory
): string[] {
  const base: Record<MeetingType, string[]> = {
    discovery: [
      "What's the cost of not solving this in the next 90 days?",
      "Who else weighs in on a decision like this?",
      "What does success look like by end of quarter?",
    ],
    demo: [
      "Did our workflow address your top concern from last time?",
      "What would need to be true to move forward?",
      "Who needs to see this before you can commit?",
    ],
    closing: [
      "Are we aligned on scope and timeline?",
      "What's blocking a yes today?",
      "Can we confirm start date and economic buyer sign-off?",
    ],
  };

  const fromMemory = (memory.next_actions ?? []).slice(0, 2);
  return [...fromMemory, ...base[meetingType]].slice(0, 5);
}

function buildRecommendedOutcome(
  meetingType: MeetingType,
  memory: ProspectMemory
): string {
  if (meetingType === "discovery") {
    return "Confirm pain, timeline, and secure a demo with the economic buyer.";
  }
  if (meetingType === "demo") {
    return memory.objections?.length
      ? "Resolve top objection and propose a time-bound pilot."
      : "Advance to proposal with clear next step and owner.";
  }
  return "Secure verbal commit or explicit decision date before leaving the call.";
}

export function buildTriageFromMemory(
  prospect: ProspectContext,
  memory: ProspectMemory
): TriageResult {
  const isAgency = prospect.industry?.toLowerCase().includes("agency");
  const hasCompetitorSignal =
    memory.concerns?.some((c) =>
      /competitor|research|implementation details/i.test(c)
    ) ?? false;
  const isShopping =
    memory.objections?.some((o) => /shopping|comparing|vendor/i.test(o)) ??
    false;
  const lowIntent = memory.urgency === "low" || (memory.buying_signals?.length ?? 0) === 0;

  if (isAgency && hasCompetitorSignal) {
    return {
      status: "reject",
      explanation:
        "Agency + deep implementation questions — likely competitor research. Proceed only to gather intel, not to invest heavy prep.",
    };
  }

  if (isShopping) {
    return {
      status: "warning",
      explanation:
        "Competitive evaluation detected. Proceed, but qualify decision process and economic buyer early.",
    };
  }

  if (lowIntent) {
    return {
      status: "warning",
      explanation:
        "Weak intent signals in memory. Proceed with a tight qualification agenda.",
    };
  }

  if (memory.urgency === "high") {
    return {
      status: "proceed",
      explanation:
        "Strong urgency and validated pain in memory — worth full prep time.",
    };
  }

  return {
    status: "proceed",
    explanation: "Standard proceed — no major red flags in historical memory.",
  };
}

export function buildStructuredSummaryFromNotes(
  rawNotes: string,
  transcript?: string | null
): StructuredSummary {
  const text = `${rawNotes}\n${transcript ?? ""}`.toLowerCase();
  const sentences = rawNotes
    .split(/[.!?]\s+/)
    .map((s) => s.trim())
    .filter(Boolean);

  const pain_points = sentences.filter((s) =>
    /pain|plateau|overload|stretched| bottleneck|struggle|flat/i.test(s)
  ).slice(0, 4);

  const objections = sentences.filter((s) =>
    /concern|pushback|objection|worry|risk|shopping|comparing/i.test(s)
  ).slice(0, 4);

  const stakeholders = extractMatches(rawNotes, [
    /(?:head of|vp|cmo|director of|lead)\s+[A-Za-z\s]+/gi,
  ]).slice(0, 4);

  let sentiment = "neutral";
  if (/positive|strong|urgency|excited|aligned/i.test(text)) sentiment = "positive";
  if (/reject|negative|cautious|stall|unlikely/i.test(text)) sentiment = "cautious";

  const budget = /(\$[\d,]+k?|\d+k\/mo|budget[^.!?]*)/i.exec(rawNotes)?.[0];
  const timeline = /(q[1-4]|end of quarter|\d+\s days?|\d+\s weeks?|q2)[^.!?]*/i.exec(
    rawNotes
  )?.[0];

  return {
    pain_points: pain_points.length ? pain_points : ["Captured from rep notes — review manually."],
    budget: budget ?? undefined,
    stakeholders: stakeholders.length ? stakeholders : ["Not identified in notes"],
    timeline: timeline ?? undefined,
    sentiment,
    objections,
    next_actions: buildNextActions(rawNotes, sentiment),
  };
}

function extractMatches(text: string, patterns: RegExp[]): string[] {
  const found: string[] = [];
  for (const pattern of patterns) {
    const matches = text.match(pattern);
    if (matches) found.push(...matches.map((m) => m.trim()));
  }
  return [...new Set(found)];
}

function buildNextActions(rawNotes: string, sentiment: string): string[] {
  if (/reject|do not pursue|competitor research/i.test(rawNotes)) {
    return ["Mark deal as reject", "Reallocate time to higher-intent accounts"];
  }
  if (sentiment === "cautious") {
    return ["Send differentiation summary", "Request economic buyer on next call"];
  }
  return ["Schedule follow-up", "Send recap with agreed next steps"];
}

export function mergeMemory(
  existing: ProspectMemory,
  summary: StructuredSummary
): ProspectMemory {
  const unique = (values: string[]) =>
    [...new Set(values.filter(Boolean))];

  const painAndObjections = unique([
    ...(existing.concerns ?? []),
    ...summary.objections,
    ...summary.pain_points,
  ]);

  return {
    concerns: painAndObjections,
    buying_signals: unique([
      ...(existing.buying_signals ?? []),
      ...(summary.sentiment === "positive"
        ? ["Positive sentiment on latest call"]
        : []),
    ]),
    pain_points: unique([
      ...(existing.pain_points ?? []),
      ...summary.pain_points,
    ]),
    stakeholders: unique([
      ...(existing.stakeholders ?? []),
      ...summary.stakeholders,
    ]),
    timeline: summary.timeline ?? existing.timeline,
    objections: unique([
      ...(existing.objections ?? []),
      ...summary.objections,
    ]),
    next_actions:
      summary.next_actions.length > 0
        ? summary.next_actions
        : existing.next_actions,
    sentiment: summary.sentiment ?? existing.sentiment,
    urgency:
      summary.sentiment === "positive" && summary.timeline
        ? "high"
        : summary.sentiment === "cautious"
          ? "medium"
          : existing.urgency,
  };
}

function inferUrgency(
  existing: ProspectMemory,
  summary: StructuredSummary
): string | undefined {
  if (/high urgency|q2|asap|immediate/i.test(summary.timeline ?? "")) return "high";
  if (summary.sentiment === "cautious") return "medium";
  return existing.urgency;
}

function unique(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))];
}

export function buildManagerInsightFromMemory(
  company: string,
  memory: ProspectMemory,
  qualificationScore: number
) {
  const health =
    qualificationScore >= 70
      ? ("green" as const)
      : qualificationScore >= 40
        ? ("yellow" as const)
        : ("red" as const);

  const risk =
    memory.objections?.[0] ??
    (health === "green"
      ? "No major risk flagged."
      : "Deal needs qualification or may stall.");

  const coaching =
    health === "green"
      ? `Advance ${company} with a concrete next step and decision owner on every call.`
      : health === "yellow"
        ? `Push ${company} for economic buyer access and explicit decision timeline.`
        : `Deprioritize ${company} unless new validated pain emerges.`;

  return {
    health,
    risk,
    coaching,
    pipeline_signal:
      memory.sentiment === "positive"
        ? `${company} — momentum building`
        : `${company} — needs manager attention`,
    patterns: memory.objections?.slice(0, 3) ?? [],
  };
}
