import Link from "next/link";
import { HealthDot } from "@/components/shared/health-dot";
import { formatDate, type PipelineMilestoneRow } from "@/lib/data/queries";
import type { DealHealth } from "@/types";

const toneStyles: Record<string, string> = {
  positive: "border-emerald-200 bg-emerald-50",
  negative: "border-red-200 bg-red-50",
  warning: "border-amber-200 bg-amber-50",
  neutral: "border-zinc-200 bg-white",
};

const healthSections: {
  key: DealHealth | "unknown";
  label: string;
  headerClass: string;
  bodyClass: string;
}[] = [
  {
    key: "green",
    label: "Healthy",
    headerClass: "border-emerald-200 bg-emerald-50 text-emerald-900",
    bodyClass: "border-emerald-100",
  },
  {
    key: "yellow",
    label: "At risk",
    headerClass: "border-amber-200 bg-amber-50 text-amber-900",
    bodyClass: "border-amber-100",
  },
  {
    key: "red",
    label: "Critical",
    headerClass: "border-red-200 bg-red-50 text-red-900",
    bodyClass: "border-red-100",
  },
  {
    key: "unknown",
    label: "Unscored",
    headerClass: "border-zinc-200 bg-zinc-50 text-zinc-700",
    bodyClass: "border-zinc-100",
  },
];

interface CompanyPipelineProps {
  milestones: PipelineMilestoneRow[];
}

function groupByCompany(items: PipelineMilestoneRow[]) {
  return Object.entries(
    items.reduce<Record<string, PipelineMilestoneRow[]>>((acc, milestone) => {
      if (!acc[milestone.company]) acc[milestone.company] = [];
      acc[milestone.company].push(milestone);
      return acc;
    }, {})
  ).sort(([a], [b]) => a.localeCompare(b));
}

export function CompanyPipeline({ milestones }: CompanyPipelineProps) {
  if (milestones.length === 0) {
    return (
      <section className="rounded-2xl border border-zinc-200 bg-white p-6 text-center text-sm text-zinc-500">
        No pipeline movement in this period.
      </section>
    );
  }

  const byHealth = milestones.reduce<Record<string, PipelineMilestoneRow[]>>(
    (acc, milestone) => {
      const key = milestone.health ?? "unknown";
      if (!acc[key]) acc[key] = [];
      acc[key].push(milestone);
      return acc;
    },
    {}
  );

  const sections = healthSections.filter(
    (section) => (byHealth[section.key]?.length ?? 0) > 0
  );

  return (
    <section>
      <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-zinc-500">
        Pipeline movement
      </h2>

      <div className="space-y-6">
        {sections.map((section) => {
          const companies = groupByCompany(byHealth[section.key] ?? []);

          return (
            <div
              key={section.key}
              className={`overflow-hidden rounded-2xl border ${section.bodyClass}`}
            >
              <div
                className={`flex items-center gap-2 border-b px-4 py-3 ${section.headerClass}`}
              >
                {section.key !== "unknown" && (
                  <HealthDot health={section.key as DealHealth} />
                )}
                <h3 className="text-sm font-semibold">{section.label}</h3>
                <span className="ml-auto text-xs font-medium opacity-70">
                  {companies.length}{" "}
                  {companies.length === 1 ? "deal" : "deals"}
                </span>
              </div>

              <div className="divide-y divide-zinc-100 bg-white">
                {companies.map(([company, items]) => (
                  <article key={company} className="p-4">
                    <Link
                      href={`/manager/prospects/${items[0].prospect_id}`}
                      className="group mb-3 inline-flex items-center gap-1.5 font-medium text-zinc-900 transition hover:text-brand-600"
                    >
                      {company}
                      <svg
                        className="h-4 w-4 opacity-40 transition group-hover:translate-x-0.5 group-hover:opacity-100"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>
                    <ol className="space-y-2">
                      {items
                        .sort(
                          (a, b) =>
                            new Date(b.occurred_at).getTime() -
                            new Date(a.occurred_at).getTime()
                        )
                        .map((item) => (
                          <li
                            key={item.id}
                            className={`rounded-lg border px-3 py-2.5 ${
                              toneStyles[item.tone] ?? toneStyles.neutral
                            }`}
                          >
                            <div className="flex flex-wrap items-baseline justify-between gap-2">
                              <p className="text-sm font-medium text-zinc-900">
                                {item.label}
                              </p>
                              <p className="text-xs text-zinc-500">
                                {formatDate(item.occurred_at)}
                              </p>
                            </div>
                            {item.next_step && (
                              <p className="mt-1 text-xs text-zinc-600">
                                Next: {item.next_step}
                              </p>
                            )}
                          </li>
                        ))}
                    </ol>
                  </article>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
