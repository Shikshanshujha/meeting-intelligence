"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { DATE_RANGE_OPTIONS, type DateRangeKey } from "@/lib/date-ranges";

export function DateRangeFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const current =
    (searchParams.get("range") as DateRangeKey) ?? "current_quarter";

  function onChange(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("range", value);
    router.push(`/manager?${params.toString()}`);
  }

  return (
    <select
      value={current}
      onChange={(event) => onChange(event.target.value)}
      className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-800 shadow-sm outline-none ring-zinc-900/10 focus:ring-2"
    >
      {DATE_RANGE_OPTIONS.map((option) => (
        <option key={option.key} value={option.key}>
          {option.label}
        </option>
      ))}
    </select>
  );
}
