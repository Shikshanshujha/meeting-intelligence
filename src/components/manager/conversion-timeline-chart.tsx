import { Suspense } from "react";
import type { ConversionTimelineData } from "@/lib/data/manager-conversion-timeline";
import { ConversionTimelineFilter } from "./conversion-timeline-filter";

interface ConversionTimelineChartProps {
  data: ConversionTimelineData;
}

export function ConversionTimelineChart({ data }: ConversionTimelineChartProps) {
  const maxValue = Math.max(
    1,
    ...data.buckets.flatMap((bucket) => [bucket.converted, bucket.lost])
  );

  return (
    <div className="flex h-full flex-col rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-zinc-900">
            Converted vs lost
          </h2>
          <p className="mt-1 text-xs text-zinc-500">
            {data.totalConverted} converted · {data.totalLost} lost in view
          </p>
        </div>
        <Suspense fallback={null}>
          <ConversionTimelineFilter />
        </Suspense>
      </div>

      <div className="mt-4 flex items-center gap-4 text-xs text-zinc-500">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-emerald-500" />
          Converted
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-red-400" />
          Lost
        </span>
      </div>

      <div className="mt-5 flex min-h-[220px] flex-1 items-end gap-1.5 overflow-x-auto pb-1 sm:gap-2">
        {data.buckets.map((bucket) => {
          const convertedHeight = (bucket.converted / maxValue) * 100;
          const lostHeight = (bucket.lost / maxValue) * 100;

          return (
            <div
              key={bucket.start}
              className="flex min-w-[42px] flex-1 flex-col items-center sm:min-w-[48px]"
            >
              <div className="flex h-40 w-full items-end justify-center gap-1">
                <div className="flex w-3 flex-col items-center justify-end sm:w-3.5">
                  <span className="mb-1 text-[10px] font-medium text-emerald-700">
                    {bucket.converted > 0 ? bucket.converted : ""}
                  </span>
                  <div
                    className="w-full rounded-t bg-emerald-500 transition-all"
                    style={{
                      height: `${Math.max(convertedHeight, bucket.converted > 0 ? 8 : 0)}%`,
                      minHeight: bucket.converted > 0 ? "0.5rem" : 0,
                    }}
                    title={`${bucket.converted} converted`}
                  />
                </div>
                <div className="flex w-3 flex-col items-center justify-end sm:w-3.5">
                  <span className="mb-1 text-[10px] font-medium text-red-600">
                    {bucket.lost > 0 ? bucket.lost : ""}
                  </span>
                  <div
                    className="w-full rounded-t bg-red-400 transition-all"
                    style={{
                      height: `${Math.max(lostHeight, bucket.lost > 0 ? 8 : 0)}%`,
                      minHeight: bucket.lost > 0 ? "0.5rem" : 0,
                    }}
                    title={`${bucket.lost} lost`}
                  />
                </div>
              </div>
              <p className="mt-2 text-center text-[10px] leading-tight text-zinc-500 sm:text-xs">
                {bucket.label}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
