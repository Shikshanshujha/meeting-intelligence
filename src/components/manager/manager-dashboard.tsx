import type { ConversionTimelineData } from "@/lib/data/manager-conversion-timeline";
import type { ManagerDashboardData } from "@/lib/data/queries";
import { CompanyPipeline } from "./company-pipeline";
import { DevelopmentAreas } from "./development-areas";
import { LearningLeapsSection } from "./learning-leaps-section";
import { RepComparison } from "./rep-comparison";
import { WorkflowPipeline } from "./workflow-pipeline";

interface ManagerDashboardProps {
  data: ManagerDashboardData;
  timeline: ConversionTimelineData;
}

export function ManagerDashboard({ data, timeline }: ManagerDashboardProps) {
  const { prospects, milestones, reps, learning } = data;

  if (prospects.length === 0 && milestones.length === 0) {
    return (
      <section className="rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 px-6 py-12 text-center">
        <p className="text-sm font-medium text-zinc-900">No data in this period</p>
        <p className="mx-auto mt-2 max-w-sm text-sm text-zinc-600">
          Try a wider date range or run <code className="text-zinc-800">npm run seed</code>.
        </p>
      </section>
    );
  }

  return (
    <div className="space-y-8">
      <WorkflowPipeline prospects={prospects} timeline={timeline} />
      <RepComparison reps={reps} />
      <DevelopmentAreas reps={reps} />
      <LearningLeapsSection learning={learning} />
      <CompanyPipeline milestones={milestones} />
    </div>
  );
}
