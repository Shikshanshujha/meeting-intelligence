import Link from "next/link";
import { HealthDot } from "@/components/shared/health-dot";
import { Panel } from "@/components/shared/panel";
import { formatDate } from "@/lib/data/formatters";
import type { ManagerRepDetail } from "@/lib/data/manager-rep";

interface RepDetailProps {
  rep: ManagerRepDetail;
}

export function RepDetail({ rep }: RepDetailProps) {
  return (
    <div className="space-y-6">
      <Panel>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Stat label="Active deals" value={rep.stats.active} />
          <Stat label="Healthy" value={rep.stats.green} tone="text-emerald-700" />
          <Stat
            label="At risk"
            value={rep.stats.yellow + rep.stats.red}
            tone="text-amber-700"
          />
          <Stat label="Converted" value={rep.stats.converted} tone="text-brand-700" />
        </div>
      </Panel>

      {rep.development_areas.length > 0 && (
        <Panel title="Coaching focus">
          <ul className="space-y-2">
            {rep.development_areas.map((area) => (
              <li key={area} className="text-sm text-zinc-700">
                · {area}
              </li>
            ))}
          </ul>
        </Panel>
      )}

      <section>
        <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-zinc-500">
          Portfolio ({rep.prospects.length})
        </h2>
        <Panel>
          {rep.prospects.length === 0 ? (
            <p className="text-sm text-zinc-500">No prospects assigned yet.</p>
          ) : (
            <div className="divide-y divide-zinc-100">
              {rep.prospects.map((prospect) => (
                <Link
                  key={prospect.id}
                  href={`/manager/prospects/${prospect.id}`}
                  className="group flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0 last:pb-0 transition hover:bg-zinc-50/80"
                >
                  <div className="flex items-center gap-2">
                    {prospect.health && <HealthDot health={prospect.health} />}
                    <span className="font-medium text-zinc-900 group-hover:text-brand-600">
                      {prospect.company}
                    </span>
                    {prospect.industry && (
                      <span className="text-xs text-zinc-500">{prospect.industry}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-zinc-500">
                    <span>{prospect.workflow_stage}</span>
                    <span>Score {prospect.qualification_score}</span>
                    <svg
                      className="h-4 w-4 opacity-40 transition group-hover:translate-x-0.5 group-hover:opacity-100"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </Panel>
      </section>

      {rep.recent_milestones.length > 0 && (
        <Panel title="Recent pipeline movement">
          <ol className="space-y-2">
            {rep.recent_milestones.map((milestone) => (
              <li
                key={milestone.id}
                className="flex flex-wrap items-baseline justify-between gap-2 rounded-lg border border-zinc-100 px-3 py-2.5"
              >
                <div>
                  <Link
                    href={`/manager/prospects/${milestone.prospect_id}`}
                    className="text-sm font-medium text-zinc-900 hover:text-brand-600"
                  >
                    {milestone.company}
                  </Link>
                  <p className="mt-0.5 text-sm text-zinc-600">{milestone.label}</p>
                </div>
                <span className="text-xs text-zinc-500">
                  {formatDate(milestone.occurred_at)}
                </span>
              </li>
            ))}
          </ol>
        </Panel>
      )}
    </div>
  );
}

function Stat({
  label,
  value,
  tone = "text-zinc-900",
}: {
  label: string;
  value: number;
  tone?: string;
}) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
        {label}
      </p>
      <p className={`mt-1 text-2xl font-semibold ${tone}`}>{value}</p>
    </div>
  );
}
