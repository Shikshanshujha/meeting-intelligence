import Link from "next/link";
import {
  formatDate,
  formatMeetingType,
  isUpcoming,
  type RepMeetingRow,
} from "@/lib/data/queries";
import { UpcomingMeetingActions } from "@/components/rep/upcoming-meeting-actions";
import { TriageBadge } from "@/components/shared/triage-badge";

interface NextUpCardProps {
  meeting: RepMeetingRow;
}

export function NextUpCard({ meeting }: NextUpCardProps) {
  return (
    <section className="rounded-2xl border border-zinc-900 bg-zinc-900 p-5 text-white shadow-sm">
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

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Link
          href={`/rep/meetings/${meeting.id}`}
          className="inline-flex items-center rounded-lg bg-white px-4 py-2 text-sm font-medium text-zinc-900 transition hover:bg-zinc-100"
        >
          Open meeting →
        </Link>
        {isUpcoming(meeting.scheduled_at, meeting.completed_at) && (
          <UpcomingMeetingActions
            meetingId={meeting.id}
            prospectCompany={meeting.prospect.company}
            meetingType={meeting.type}
            scheduledAt={meeting.scheduled_at}
            meetingLink={meeting.meeting_link}
            variant="dark"
          />
        )}
      </div>
    </section>
  );
}
