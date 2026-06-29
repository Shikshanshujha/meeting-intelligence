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
  const hasData = data.totalConverted + data.totalLost > 0;
  const bucketCount = Math.max(data.buckets.length, 1);

  return (
    <div className="flex h-full min-h-0 flex-col rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-zinc-900">Timeframe analysis</h2>
          <p className="mt-1 text-xs text-zinc-500">
            {data.totalConverted} converted · {data.totalLost} lost
          </p>
        </div>
        <Suspense fallback={null}>
          <ConversionTimelineFilter />
        </Suspense>
      </div>

      <div className="mt-3 flex items-center gap-4 text-xs text-zinc-500">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-emerald-500" />
          Converted
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-red-400" />
          Lost
        </span>
      </div>

      {!hasData ? (
        <div className="mt-6 flex flex-1 items-center justify-center rounded-xl bg-zinc-50 px-4 py-10 text-center text-sm text-zinc-500">
          No converted or lost deals yet in this view.
        </div>
      ) : (
        <div
          className="mt-4 grid w-full items-end gap-1"
          style={{
            gridTemplateColumns: `repeat(${bucketCount}, minmax(0, 1fr))`,
          }}
        >
          {data.buckets.map((bucket) => {
            const convertedHeight = (bucket.converted / maxValue) * 100;
            const lostHeight = (bucket.lost / maxValue) * 100;

            return (
              <div
                key={bucket.start}
                className="flex min-w-0 flex-col items-center"
              >
                <div className="flex h-36 w-full items-end justify-center gap-0.5 sm:gap-1">
                  <div className="flex min-w-0 flex-1 flex-col items-center justify-end">
                    {bucket.converted > 0 && (
                      <span className="mb-0.5 text-[10px] font-medium leading-none text-emerald-700">
                        {bucket.converted}
                      </span>
                    )}
                    <div
                      className="w-full max-w-[14px] rounded-t bg-emerald-500 transition-all"
                      style={{
                        height: `${Math.max(convertedHeight, bucket.converted > 0 ? 10 : 0)}%`,
                        minHeight: bucket.converted > 0 ? "0.375rem" : 0,
                      }}
                      title={`${bucket.converted} converted`}
                    />
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col items-center justify-end">
                    {bucket.lost > 0 && (
                      <span className="mb-0.5 text-[10px] font-medium leading-none text-red-600">
                        {bucket.lost}
                      </span>
                    )}
                    <div
                      className="w-full max-w-[14px] rounded-t bg-red-400 transition-all"
                      style={{
                        height: `${Math.max(lostHeight, bucket.lost > 0 ? 10 : 0)}%`,
                        minHeight: bucket.lost > 0 ? "0.375rem" : 0,
                      }}
                      title={`${bucket.lost} lost`}
                    />
                  </div>
                </div>
                <p className="mt-1.5 w-full truncate text-center text-[10px] leading-tight text-zinc-500">
                  {bucket.label}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
