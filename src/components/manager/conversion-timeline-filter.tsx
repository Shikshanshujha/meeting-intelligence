"use client";

import { useRouter, useSearchParams } from "next/navigation";
import {
  TIMELINE_GRANULARITY_OPTIONS,
  type TimelineGranularity,
} from "@/lib/timeline-granularity";

export function ConversionTimelineFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const current =
    (searchParams.get("granularity") as TimelineGranularity) ?? "month";

  function onChange(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("granularity", value);
    router.push(`/manager?${params.toString()}`);
  }

  return (
    <select
      value={current}
      onChange={(event) => onChange(event.target.value)}
      aria-label="Timeline granularity"
      className="rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-xs font-medium text-zinc-700 shadow-sm outline-none ring-brand-600/20 focus:border-brand-500 focus:ring-2"
    >
      {TIMELINE_GRANULARITY_OPTIONS.map((option) => (
        <option key={option.key} value={option.key}>
          {option.label}
        </option>
      ))}
    </select>
  );
}
