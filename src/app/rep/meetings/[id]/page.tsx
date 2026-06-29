import { notFound, redirect } from "next/navigation";
import { LogOutButton } from "@/components/auth/log-out-button";
import { MeetingDetailPanel } from "@/components/rep/meeting-detail-panel";
import { ScheduleMeetingForm } from "@/components/rep/schedule-meeting-form";
import { AppShell } from "@/components/shared/app-shell";
import { TriageBadge } from "@/components/shared/triage-badge";
import { isGeminiConfigured } from "@/lib/ai/gemini";
import { getSessionProfile } from "@/lib/auth/session";
import {
  formatDate,
  formatMeetingType,
  formatStage,
  getRepMeetingDetail,
  isMeetingPast,
} from "@/lib/data/queries";

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
    <AppShell
      role="rep"
      title={meeting.prospect.company}
      subtitle={`${formatMeetingType(meeting.type)} · ${formatDate(meeting.scheduled_at)} · ${formatStage(meeting.prospect.stage)}`}
      backHref="/rep"
      backLabel="All meetings"
      actions={
        <>
          <ScheduleMeetingForm
            prospectId={meeting.prospect_id}
            prospectCompany={meeting.prospect.company}
            defaultMeetingType={
              meeting.completed_at
                ? meeting.type === "discovery"
                  ? "demo"
                  : meeting.type
                : undefined
            }
          />
          <LogOutButton />
        </>
      }
    >
      <div className="mb-6 space-y-4">
        <div className="flex flex-wrap items-center gap-2">
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
          <TriageBadge status={meeting.triage_status} />
        </div>

        {meeting.meeting_link && !isPast && (
          <a
            href={meeting.meeting_link}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-xl bg-brand-50 px-4 py-2.5 text-sm font-medium text-brand-700 transition hover:bg-brand-100"
          >
            Join meeting →
          </a>
        )}

        {meeting.last_meeting_line && (
          <div className="rounded-xl border border-zinc-200 bg-white px-4 py-3 shadow-card">
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

        {meeting.triage_explanation && (
          <p className="text-sm text-zinc-600">{meeting.triage_explanation}</p>
        )}
      </div>

      <MeetingDetailPanel
        meetingId={meeting.id}
        memoryStamp={meeting.memory_stamp}
        prospectStage={meeting.prospect.stage}
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
    </AppShell>
  );
}
