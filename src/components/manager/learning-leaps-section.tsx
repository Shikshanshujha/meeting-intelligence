import type { LearningLeaps } from "@/lib/data/queries";

interface LearningLeapsSectionProps {
  learning: LearningLeaps;
}

export function LearningLeapsSection({ learning }: LearningLeapsSectionProps) {
  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
      <h2 className="text-sm font-semibold text-zinc-900">Learning leaps</h2>
      <p className="mt-1 text-sm text-zinc-500">
        Recurring signals from calls across the team
      </p>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-800">
            What worked well
          </p>
          <ul className="mt-3 space-y-2">
            {learning.worked_well.map((item) => (
              <li key={item} className="text-sm text-emerald-950">
                · {item}
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-xl border border-red-200 bg-red-50/50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-red-800">
            What didn&apos;t work well
          </p>
          <ul className="mt-3 space-y-2">
            {learning.didnt_work.map((item) => (
              <li key={item} className="text-sm text-red-950">
                · {item}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
