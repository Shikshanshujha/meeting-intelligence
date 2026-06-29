import Link from "next/link";
import type { RepComparisonRow } from "@/lib/data/queries";

interface DevelopmentAreasProps {
  reps: RepComparisonRow[];
}

export function DevelopmentAreas({ reps }: DevelopmentAreasProps) {
  const withAreas = reps.filter((rep) => rep.development_areas.length > 0);

  return (
    <section>
      <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-zinc-500">
        Areas of development
      </h2>
      <div className="grid gap-4 lg:grid-cols-3">
        {withAreas.map((rep) => (
          <Link
            key={rep.id}
            href={`/manager/reps/${rep.id}`}
            className="group rounded-xl border border-zinc-200 bg-white p-4 shadow-sm transition hover:border-brand-200 hover:shadow-md"
          >
            <p className="font-medium text-zinc-900 group-hover:text-brand-600">
              {rep.full_name}
            </p>
            <ul className="mt-3 space-y-2">
              {rep.development_areas.map((area) => (
                <li
                  key={area}
                  className="text-sm leading-snug text-zinc-700 before:mr-2 before:text-zinc-300 before:content-['•']"
                >
                  {area}
                </li>
              ))}
            </ul>
          </Link>
        ))}
      </div>
    </section>
  );
}
