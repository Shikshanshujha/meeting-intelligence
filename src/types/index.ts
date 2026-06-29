export type UserRole = "rep" | "manager";

export type MeetingType = "discovery" | "demo" | "closing";

export type DealHealth = "green" | "yellow" | "red";

export type TriageStatus = "proceed" | "warning" | "reject";

export type ProspectStage =
  | "discovery"
  | "demo_scheduled"
  | "follow_up"
  | "closing"
  | "won"
  | "rejected";

export interface ProspectMemory {
  concerns?: string[];
  buying_signals?: string[];
  pain_points?: string[];
  stakeholders?: string[];
  timeline?: string;
  objections?: string[];
  next_actions?: string[];
  sentiment?: string;
  urgency?: string;
}

export interface MeetingBrief {
  prospect_summary: string;
  previous_concerns: string[];
  buying_signals: string[];
  deal_risks: string[];
  questions_to_ask: string[];
  recommended_outcome: string;
}

export interface StructuredSummary {
  pain_points: string[];
  budget?: string;
  stakeholders: string[];
  timeline?: string;
  sentiment?: string;
  objections: string[];
  next_actions: string[];
  pipeline_stage?: ProspectStage;
}
