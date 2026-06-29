"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { DATE_RANGE_OPTIONS, type DateRangeKey } from "@/lib/date-ranges";
import {
  WORKFLOW_STAGE_FILTER_OPTIONS,
  type WorkflowStageFilter,
} from "@/lib/infer-pipeline-stage";

export function RepWorkspaceFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentRange =
    (searchParams.get("range") as DateRangeKey) ?? "current_quarter";
  const currentStage =
    (searchParams.get("stage") as WorkflowStageFilter) ?? "all";

  function updateParam(key: "range" | "stage", value: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set(key, value);
    router.push(`/rep?${params.toString()}`);
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <select
        value={currentRange}
        onChange={(event) => updateParam("range", event.target.value)}
        className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-800 shadow-sm outline-none ring-zinc-900/10 focus:ring-2"
      >
        {DATE_RANGE_OPTIONS.map((option) => (
          <option key={option.key} value={option.key}>
            {option.label}
          </option>
        ))}
      </select>

      <select
        value={currentStage}
        onChange={(event) => updateParam("stage", event.target.value)}
        className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-800 shadow-sm outline-none ring-zinc-900/10 focus:ring-2"
      >
        {WORKFLOW_STAGE_FILTER_OPTIONS.map((option) => (
          <option key={option.key} value={option.key}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
