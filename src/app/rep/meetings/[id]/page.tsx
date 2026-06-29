import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { MeetingDetailPanel } from "@/components/rep/meeting-detail-panel";
import { isGeminiConfigured } from "@/lib/ai/gemini";
import { getSessionProfile } from "@/lib/auth/session";
import {
  formatDate,
  formatMeetingType,
  formatStage,
  getRepMeetingDetail,
  isMeetingPast,
} from "@/lib/data/queries";
import { TriageBadge } from "@/components/shared/triage-badge";

interface MeetingDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function MeetingDetailPage({ params }: MeetingDetailPageProps) {
  const profile = await getSessionProfile();

  if (!profile) {
    redirect("/");
  }

  const { id } = await params;
  const meeting = await getRepMeetingDetail(id, profile.id);

  if (!meeting) {
    notFound();
  }

  const isPast = isMeetingPast(meeting.scheduled_at, meeting.completed_at);

  return (
    <main className="mx-auto min-h-screen max-w-3xl px-4 py-8 sm:px-6">
      <header className="mb-6 space-y-4 border-b border-zinc-200 pb-6">
        <Link
          href="/rep"
          className="inline-flex text-sm text-zinc-500 transition hover:text-zinc-900"
        >
          ← All meetings
        </Link>

        <div>
          <p className="text-sm font-medium text-zinc-500">
            {formatMeetingType(meeting.type)} · {formatDate(meeting.scheduled_at)}
          </p>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
              {meeting.prospect.company}
            </h1>
            {meeting.completed_at && (
              <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-800">
                Done
              </span>
            )}
            {isPast && !meeting.completed_at && (
              <span className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-600">
                Past
              </span>
            )}
          </div>
          <p className="mt-2 text-sm text-zinc-600">
            {formatStage(meeting.prospect.stage)} · {meeting.prospect.industry}
          </p>
        </div>

        {meeting.meeting_link && !isPast && (
          <a
            href={meeting.meeting_link}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-lg bg-blue-50 px-4 py-2.5 text-sm font-medium text-blue-800 transition hover:bg-blue-100"
          >
            Join meeting →
          </a>
        )}

        {meeting.last_meeting_line && (
          <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3">
            <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
              From last meeting
            </p>
            <p className="mt-1 text-sm leading-relaxed text-zinc-800">
              {meeting.last_meeting_line}
            </p>
          </div>
        )}

        {meeting.open_points.length > 0 && (
          <div className="rounded-xl border border-amber-200 bg-amber-50/60 px-4 py-3">
            <p className="text-xs font-medium uppercase tracking-wide text-amber-800">
              Open points
            </p>
            <ul className="mt-2 space-y-1">
              {meeting.open_points.map((point) => (
                <li key={point} className="text-sm text-amber-950">
                  · {point}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2">
          <TriageBadge status={meeting.triage_status} />
          {meeting.triage_explanation && (
            <p className="text-sm text-zinc-600">{meeting.triage_explanation}</p>
          )}
        </div>
      </header>

      <MeetingDetailPanel
        meetingId={meeting.id}
        memoryStamp={meeting.memory_stamp}
        initialBrief={meeting.brief?.brief}
        initialSource={meeting.brief?.source}
        initialGeminiConfigured={isGeminiConfigured()}
        submittedNotes={meeting.completed_at ? meeting.notes?.raw_notes : undefined}
        submittedTranscript={
          meeting.completed_at ? meeting.notes?.transcript : undefined
        }
        submittedStage={
          meeting.completed_at ? meeting.prospect.stage : undefined
        }
        isCompleted={Boolean(meeting.completed_at)}
      />
    </main>
  );
}
