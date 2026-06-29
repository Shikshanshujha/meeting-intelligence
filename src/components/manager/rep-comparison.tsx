import Link from "next/link";
import type { RepComparisonRow } from "@/lib/data/queries";

interface RepComparisonProps {
  reps: RepComparisonRow[];
}

export function RepComparison({ reps }: RepComparisonProps) {
  const sorted = [...reps].sort(
    (a, b) => a.green + a.converted * 2 - (b.green + b.converted * 2)
  );

  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
      <h2 className="text-sm font-semibold text-zinc-900">Rep comparison</h2>
      <p className="mt-1 text-sm text-zinc-500">
        Spot underperforming reps across the team
      </p>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[520px] text-left text-sm">
          <thead>
            <tr className="border-b border-zinc-200 text-xs uppercase tracking-wide text-zinc-500">
              <th className="pb-2 pr-4 font-medium">Rep</th>
              <th className="pb-2 pr-4 font-medium">Prospects</th>
              <th className="pb-2 pr-4 font-medium">Healthy</th>
              <th className="pb-2 pr-4 font-medium">At risk</th>
              <th className="pb-2 font-medium">Converted</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((rep) => {
              const underperforming =
                rep.red > rep.green || (rep.prospect_count > 2 && rep.converted === 0 && rep.yellow >= 2);

              return (
                <tr
                  key={rep.id}
                  className={`border-b border-zinc-100 ${
                    underperforming ? "bg-amber-50/50" : ""
                  }`}
                >
                  <td className="py-3 pr-4 font-medium text-zinc-900">
                    <Link
                      href={`/manager/reps/${rep.id}`}
                      className="group inline-flex items-center gap-1 transition hover:text-brand-600"
                    >
                      {rep.full_name}
                      <svg
                        className="h-3.5 w-3.5 opacity-0 transition group-hover:translate-x-0.5 group-hover:opacity-100"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>
                    {underperforming && (
                      <span className="ml-2 text-xs font-normal text-amber-700">
                        Needs support
                      </span>
                    )}
                  </td>
                  <td className="py-3 pr-4 text-zinc-700">{rep.prospect_count}</td>
                  <td className="py-3 pr-4 text-emerald-700">{rep.green}</td>
                  <td className="py-3 pr-4 text-amber-700">
                    {rep.yellow + rep.red}
                  </td>
                  <td className="py-3 text-zinc-700">{rep.converted}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
