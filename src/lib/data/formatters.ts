import type { MeetingType, ProspectStage } from "@/types";

export function formatMeetingType(type: MeetingType): string {
  return type.charAt(0).toUpperCase() + type.slice(1);
}

export function formatStage(stage: ProspectStage): string {
  return stage
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(iso));
}

export function isUpcoming(
  scheduledAt: string,
  completedAt?: string | null
): boolean {
  if (completedAt) return false;
  return new Date(scheduledAt) >= new Date();
}

export function isMeetingPast(
  scheduledAt: string,
  completedAt?: string | null
): boolean {
  if (completedAt) return true;
  return new Date(scheduledAt) < new Date();
}
