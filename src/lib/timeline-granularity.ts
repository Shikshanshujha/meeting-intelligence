export type TimelineGranularity = "week" | "month" | "quarter" | "year";

export const TIMELINE_GRANULARITY_OPTIONS: {
  key: TimelineGranularity;
  label: string;
}[] = [
  { key: "week", label: "Week on week" },
  { key: "month", label: "Month on month" },
  { key: "quarter", label: "Quarter on quarter" },
  { key: "year", label: "Year on year" },
];

export function parseTimelineGranularity(
  value: string | undefined
): TimelineGranularity {
  if (value === "week" || value === "month" || value === "quarter" || value === "year") {
    return value;
  }
  return "month";
}
