import type { MeetingType, ProspectStage, StructuredSummary } from "@/types";
import type { WorkflowStage } from "@/lib/workflow-stages";

export type WorkflowStageFilter = WorkflowStage | "all";

export const WORKFLOW_STAGE_FILTER_OPTIONS: {
  key: WorkflowStageFilter;
  label: string;
}[] = [
  { key: "all", label: "All stages" },
  { key: "first_call", label: "First call" },
  { key: "follow_up", label: "Follow up" },
  { key: "demo_scheduled", label: "Demo scheduled" },
  { key: "ongoing_pilot", label: "Ongoing pilot" },
  { key: "converted", label: "Converted" },
  { key: "rejected", label: "Rejected" },
];

const VALID_STAGES: ProspectStage[] = [
  "discovery",
  "follow_up",
  "demo_scheduled",
  "closing",
  "won",
  "rejected",
];

export function isProspectStage(value: string): value is ProspectStage {
  return VALID_STAGES.includes(value as ProspectStage);
}

export function mapWorkflowStageToProspectStage(
  workflow: WorkflowStage
): ProspectStage {
  switch (workflow) {
    case "first_call":
      return "discovery";
    case "follow_up":
      return "follow_up";
    case "demo_scheduled":
      return "demo_scheduled";
    case "ongoing_pilot":
      return "closing";
    case "converted":
      return "won";
    case "rejected":
      return "rejected";
    default:
      return "discovery";
  }
}

export function inferProspectStageFromNotes(
  rawNotes: string,
  summary: StructuredSummary,
  currentStage: ProspectStage,
  meetingType: MeetingType,
  aiSuggestedStage?: ProspectStage | null
): ProspectStage {
  if (aiSuggestedStage && isProspectStage(aiSuggestedStage)) {
    return aiSuggestedStage;
  }

  const text = `${rawNotes}\n${summary.next_actions.join(" ")}`.toLowerCase();

  if (
    /reject|not a fit|do not pursue|passed on|disqualified|no budget|competitor research|walked away/i.test(
      text
    )
  ) {
    return "rejected";
  }

  if (
    /signed|closed won|contract signed|deal closed|converted|won the deal|customer signed|closed the deal/i.test(
      text
    )
  ) {
    return "won";
  }

  if (
    /demo scheduled|booked demo|pilot scheduled|scheduled demo|demo booked|demo set/i.test(
      text
    )
  ) {
    return "demo_scheduled";
  }

  if (
    /pilot (started|kicked off|in progress|live|launch|running)|mid-pilot|during pilot|pilot week \d|active pilot/i.test(
      text
    )
  ) {
    return "closing";
  }

  if (
    /proposal sent|pricing review|contract review|verbal commit|ready to sign|closing call/i.test(
      text
    ) ||
    meetingType === "closing"
  ) {
    return "closing";
  }

  if (
    /follow.?up|next call|recap|check.?in|second call|reconnect/i.test(text) ||
    meetingType === "discovery"
  ) {
    if (currentStage === "discovery") return "follow_up";
    if (currentStage === "follow_up") return "follow_up";
  }

  if (meetingType === "demo" && currentStage !== "won" && currentStage !== "rejected") {
    return "demo_scheduled";
  }

  if (currentStage === "discovery") return "follow_up";
  if (currentStage === "follow_up" && summary.sentiment === "positive") {
    return "demo_scheduled";
  }

  return currentStage;
}
