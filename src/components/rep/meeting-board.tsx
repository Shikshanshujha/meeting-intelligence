import Link from "next/link";
import {
  formatDate,
  formatMeetingType,
  formatStage,
  isUpcoming,
  type RepMeetingRow,
} from "@/lib/data/queries";
import { bucketPastMeetingsByWorkflow } from "@/lib/data/rep-meeting-buckets";
import {
  mapProspectStageToWorkflow,
  WORKFLOW_STAGES,
  type WorkflowStage,
} from "@/lib/workflow-stages";

interface RepMeetingBoardProps {
  meetings: RepMeetingRow[];
}

export function RepMeetingBoard({ meetings }: RepMeetingBoardProps) {
  const upcoming = meetings.filter((m) =>
    isUpcoming(m.scheduled_at, m.completed_at)
  );
  const past = meetings.filter(
    (m) => !isUpcoming(m.scheduled_at, m.completed_at)
  );

  const buckets = bucketPastMeetingsByWorkflow(past);

  if (meetings.length === 0) {
    return (
      <section className="rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 px-6 py-12 text-center">
        <p className="text-sm font-medium text-zinc-900">No meetings in this view</p>
        <p className="mx-auto mt-2 max-w-sm text-sm text-zinc-600">
          Try a wider date range or clear the stage filter.
        </p>
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

      <section>
        <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-zinc-500">
          Past meetings
        </h2>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          {buckets.map(({ stage, label, meetings: items }) => (
            <div
              key={stage}
              className="rounded-xl border border-zinc-200 bg-zinc-50/80 p-3"
            >
              <div className="mb-3 flex items-center justify-between px-1">
                <p className="text-xs font-semibold uppercase tracking-wide text-zinc-600">
                  {label}
                </p>
                <span className="rounded-full bg-white px-2 py-0.5 text-xs font-medium text-zinc-700 ring-1 ring-zinc-200">
                  {items.length}
                </span>
              </div>
              <div className="space-y-2">
                {items.length === 0 ? (
                  <p className="px-1 py-6 text-center text-xs text-zinc-400">
                    None
                  </p>
                ) : (
                  items.map((meeting) => (
                    <MeetingCard key={meeting.id} meeting={meeting} compact />
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function workflowLabel(stage: WorkflowStage): string {
  return WORKFLOW_STAGES.find((item) => item.key === stage)?.label ?? stage;
}

function MeetingCard({
  meeting,
  highlight = false,
  compact = false,
}: {
  meeting: RepMeetingRow;
  highlight?: boolean;
  compact?: boolean;
}) {
  const workflow = mapProspectStageToWorkflow(meeting.prospect.stage);

  return (
    <Link
      href={`/rep/meetings/${meeting.id}`}
      className={`block rounded-xl border bg-white shadow-sm transition hover:border-zinc-300 ${
        highlight
          ? "border-zinc-900 p-4 ring-1 ring-zinc-900/5"
          : compact
            ? "border-zinc-200 p-3"
            : "border-zinc-200 p-4"
      }`}
    >
      <p className={`font-medium text-zinc-900 ${compact ? "text-sm" : ""}`}>
        {meeting.prospect.company}
      </p>
      <p className="mt-1 text-xs text-zinc-500">
        {formatMeetingType(meeting.type)} · {formatDate(meeting.scheduled_at)}
      </p>
      <p className="mt-1 text-xs text-zinc-600">
        {formatStage(meeting.prospect.stage)} · {workflowLabel(workflow)}
      </p>
      {meeting.completed_at && (
        <p className="mt-1 text-xs font-medium text-emerald-700">Completed</p>
      )}
      {!compact && meeting.has_brief && (
        <p className="mt-2 text-xs text-blue-700">Brief ready</p>
      )}
    </Link>
  );
}
