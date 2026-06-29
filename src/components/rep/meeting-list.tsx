import Link from "next/link";
import {
  formatDate,
  formatMeetingType,
  formatStage,
  isUpcoming,
  type RepMeetingRow,
} from "@/lib/data/queries";
import { TriageBadge } from "@/components/shared/triage-badge";

interface RepMeetingListProps {
  meetings: RepMeetingRow[];
  excludeId?: string;
}

export function RepMeetingList({ meetings, excludeId }: RepMeetingListProps) {
  const filtered = excludeId
    ? meetings.filter((meeting) => meeting.id !== excludeId)
    : meetings;
  const upcoming = filtered.filter((meeting) =>
    isUpcoming(meeting.scheduled_at, meeting.completed_at)
  );
  const past = filtered.filter(
    (meeting) => !isUpcoming(meeting.scheduled_at, meeting.completed_at)
  );

  if (filtered.length === 0) {
    return (
      <section className="rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 px-6 py-12 text-center">
        <p className="text-sm font-medium text-zinc-900">No other meetings</p>
      </section>
    );
  }

  return (
    <div className="space-y-8">
      {upcoming.length > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-zinc-500">
            Upcoming
          </h2>
          <div className="space-y-3">
            {upcoming.map((meeting) => (
              <MeetingCard key={meeting.id} meeting={meeting} highlight />
            ))}
          </div>
        </section>
      )}

      {past.length > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-zinc-500">
            Past
          </h2>
          <div className="space-y-3">
            {past
              .slice()
              .reverse()
              .map((meeting) => (
                <MeetingCard key={meeting.id} meeting={meeting} />
              ))}
          </div>
        </section>
      )}
    </div>
  );
}

function MeetingCard({
  meeting,
  highlight = false,
}: {
  meeting: RepMeetingRow;
  highlight?: boolean;
}) {
  return (
    <Link
      href={`/rep/meetings/${meeting.id}`}
      className={`block rounded-xl border bg-white p-4 shadow-sm transition hover:border-zinc-300 ${
        highlight ? "border-zinc-900 ring-1 ring-zinc-900/5" : "border-zinc-200"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-medium text-zinc-900">{meeting.prospect.company}</p>
          <p className="mt-1 text-sm text-zinc-500">
            {formatMeetingType(meeting.type)} · {formatDate(meeting.scheduled_at)}
          </p>
        </div>
        <TriageBadge status={meeting.triage_status} />
      </div>

      <div className="mt-3 flex flex-wrap gap-2 text-xs text-zinc-600">
        <span className="rounded-md bg-zinc-100 px-2 py-1">
          {formatStage(meeting.prospect.stage)}
        </span>
        {meeting.has_brief && (
          <span className="rounded-md bg-blue-50 px-2 py-1 text-blue-700">
            Brief ready
          </span>
        )}
        {meeting.has_notes && (
          <span className="rounded-md bg-zinc-100 px-2 py-1">Notes captured</span>
        )}
        {!meeting.has_notes &&
          isUpcoming(meeting.scheduled_at, meeting.completed_at) && (
          <span className="rounded-md bg-amber-50 px-2 py-1 text-amber-800">
            Needs notes after call
          </span>
        )}
      </div>
    </Link>
  );
}
