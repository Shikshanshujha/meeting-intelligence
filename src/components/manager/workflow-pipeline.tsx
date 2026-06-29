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
    <section className="grid gap-6 lg:grid-cols-2">
      <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-zinc-900">Pipeline workflow</h2>
        <p className="mt-1 text-sm text-zinc-500">Prospects by stage</p>

        <div className="mt-6 overflow-x-auto pb-2">
          <div className="flex min-w-max items-start gap-2">
            {WORKFLOW_STAGES.map((stage, index) => (
              <div key={stage.key} className="flex items-start">
                <div className="flex w-28 flex-col items-center text-center sm:w-32">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-zinc-900 bg-white text-lg font-semibold text-zinc-900">
                    {counts[stage.key]}
                  </div>
                  <p className="mt-2 text-xs font-medium leading-tight text-zinc-700">
                    {stage.label}
                  </p>
                </div>
                {index < WORKFLOW_STAGES.length - 1 && (
                  <span className="mt-5 px-1 text-zinc-300">→</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <ConversionTimelineChart data={timeline} />
    </section>
  );
}
