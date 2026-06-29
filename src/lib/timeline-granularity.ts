export type TimelineGranularity = "week" | "month" | "quarter" | "year";

export const TIMELINE_GRANULARITY_OPTIONS: {
  key: TimelineGranularity;
  label: string;
}[] = [
  { key: "week", label: "Weekly" },
  { key: "month", label: "Monthly" },
  { key: "quarter", label: "Quarterly" },
  { key: "year", label: "Yearly" },
];

export function parseTimelineGranularity(
  value: string | undefined
): TimelineGranularity {
  if (value === "week" || value === "month" || value === "quarter" || value === "year") {
    return value;
  }
  return "month";
}
