import type { ProspectStage } from "@/types";

export type WorkflowStage =
  | "first_call"
  | "follow_up"
  | "demo_scheduled"
  | "ongoing_pilot"
  | "converted"
  | "rejected";

export const WORKFLOW_STAGES: { key: WorkflowStage; label: string }[] = [
  { key: "first_call", label: "First call" },
  { key: "follow_up", label: "Follow up" },
  { key: "demo_scheduled", label: "Demo scheduled" },
  { key: "ongoing_pilot", label: "Ongoing pilot" },
  { key: "converted", label: "Converted" },
  { key: "rejected", label: "Rejected" },
];

export function mapProspectStageToWorkflow(stage: ProspectStage): WorkflowStage {
  switch (stage) {
    case "discovery":
      return "first_call";
    case "follow_up":
      return "follow_up";
    case "demo_scheduled":
      return "demo_scheduled";
    case "closing":
      return "ongoing_pilot";
    case "won":
      return "converted";
    case "rejected":
      return "rejected";
    default:
      return "first_call";
  }
}

/** @deprecated Use mapProspectStageToWorkflow for rep board bucketing */
export type PastMeetingBucket = "rejected" | "follow_up" | "demo_scheduled" | "ongoing_pilot";

export function mapStageToPastBucket(stage: ProspectStage): PastMeetingBucket {
  if (stage === "rejected") return "rejected";
  if (stage === "follow_up") return "follow_up";
  if (stage === "closing") return "ongoing_pilot";
  return "demo_scheduled";
}

export const PAST_BUCKET_LABELS: Record<PastMeetingBucket, string> = {
  rejected: "Rejected",
  follow_up: "Follow up",
  demo_scheduled: "Demo scheduled",
  ongoing_pilot: "Ongoing pilot",
};
