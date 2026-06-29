import { getWorkflowCounts, type ManagerProspectRow } from "@/lib/data/queries";
import type { ConversionTimelineData } from "@/lib/data/manager-conversion-timeline";
import { WORKFLOW_STAGES } from "@/lib/workflow-stages";
import { ConversionTimelineChart } from "./conversion-timeline-chart";

interface WorkflowPipelineProps {
  prospects: ManagerProspectRow[];
  timeline: ConversionTimelineData;
}

export function WorkflowPipeline({ prospects, timeline }: WorkflowPipelineProps) {
  const counts = getWorkflowCounts(prospects);

  return (
    <section className="grid items-stretch gap-6 lg:grid-cols-2">
      <div className="flex min-h-0 flex-col rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-zinc-900">Pipeline workflow</h2>
        <p className="mt-1 text-sm text-zinc-500">Prospects by stage</p>

        <div className="mt-6 flex flex-1 items-center">
          <div className="grid w-full grid-cols-5 items-start gap-1">
            {WORKFLOW_STAGES.map((stage, index) => (
              <div key={stage.key} className="relative flex min-w-0 flex-col items-center text-center">
                {index > 0 && (
                  <span
                    aria-hidden
                    className="pointer-events-none absolute -left-1 top-5 hidden text-[10px] text-zinc-300 sm:block"
                  >
                    →
                  </span>
                )}
                <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-zinc-900 bg-white text-base font-semibold text-zinc-900 sm:h-11 sm:w-11 sm:text-lg">
                  {counts[stage.key]}
                </div>
                <p className="mt-2 line-clamp-2 text-[10px] font-medium leading-tight text-zinc-700 sm:text-xs">
                  {stage.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <ConversionTimelineChart data={timeline} />
    </section>
  );
}
