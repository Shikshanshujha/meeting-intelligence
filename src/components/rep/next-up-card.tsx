import Link from "next/link";
import {
  formatDate,
  formatMeetingType,
  type RepMeetingRow,
} from "@/lib/data/queries";
import { TriageBadge } from "@/components/shared/triage-badge";

interface NextUpCardProps {
  meeting: RepMeetingRow;
}

export function NextUpCard({ meeting }: NextUpCardProps) {
  return (
    <Link
      href={`/rep/meetings/${meeting.id}`}
      className="block rounded-2xl border border-zinc-900 bg-zinc-900 p-5 text-white shadow-sm transition hover:bg-zinc-800"
    >
      <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">
        Next up
      </p>
      <div className="mt-2 flex items-start justify-between gap-3">
        <div>
          <p className="text-lg font-semibold">{meeting.prospect.company}</p>
          <p className="mt-1 text-sm text-zinc-300">
            {formatMeetingType(meeting.type)} · {formatDate(meeting.scheduled_at)}
          </p>
        </div>
        <span className="rounded-full bg-white/10 p-0.5">
          <TriageBadge status={meeting.triage_status} />
        </span>
      </div>
      <p className="mt-4 text-sm font-medium text-white">
        Open meeting →
      </p>
    </Link>
  );
}
