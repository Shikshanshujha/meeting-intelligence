"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Spinner } from "@/components/shared/spinner";
import { formatMeetingType, formatStage } from "@/lib/data/formatters";
import { inferMeetingTypeForStage } from "@/lib/workflows/schedule-meeting";
import { trackEvent } from "@/lib/analytics/posthog";
import type { MeetingType, ProspectMemory, ProspectStage } from "@/types";

interface MeetingNotesFormProps {
  meetingId: string;
  prospectStage?: ProspectStage;
  submittedNotes?: string | null;
  submittedTranscript?: string | null;
  submittedStage?: ProspectStage;
  isCompleted?: boolean;
  onNotesSaved?: (payload: {
    memory_stamp: string;
    memory: ProspectMemory;
    completed: boolean;
  }) => void;
}

const MEETING_TYPES: MeetingType[] = ["discovery", "demo", "closing"];

function defaultNextMeetingTime(): string {
  const date = new Date();
  date.setDate(date.getDate() + 7);
  date.setHours(10, 0, 0, 0);
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60_000);
  return local.toISOString().slice(0, 16);
}

export function MeetingNotesForm({
  meetingId,
  prospectStage = "discovery",
  submittedNotes,
  submittedTranscript,
  submittedStage,
  isCompleted = false,
  onNotesSaved,
}: MeetingNotesFormProps) {
  const router = useRouter();
  const [rawNotes, setRawNotes] = useState("");
  const [transcript, setTranscript] = useState("");
  const [scheduleNext, setScheduleNext] = useState(false);
  const [nextMeetingAt, setNextMeetingAt] = useState(defaultNextMeetingTime);
  const [nextMeetingType, setNextMeetingType] = useState<MeetingType>(
    inferMeetingTypeForStage(prospectStage)
  );
  const [nextMeetingLink, setNextMeetingLink] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [completed, setCompleted] = useState(isCompleted);
  const [savedNotes, setSavedNotes] = useState(submittedNotes ?? "");
  const [savedTranscript, setSavedTranscript] = useState(submittedTranscript ?? "");
  const [savedStage, setSavedStage] = useState(submittedStage);
  const [nextMeetingId, setNextMeetingId] = useState<string | null>(null);
  const [memoryPreview, setMemoryPreview] = useState<string[]>([]);

  async function completeMeeting(event: React.FormEvent) {
    event.preventDefault();

    if (!rawNotes.trim()) {
      setError("Add notes from this meeting before marking it complete.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const payload: Record<string, unknown> = {
        raw_notes: rawNotes,
        transcript: transcript || null,
      };

      if (scheduleNext && nextMeetingAt) {
        payload.next_meeting = {
          scheduled_at: new Date(nextMeetingAt).toISOString(),
          type: nextMeetingType,
          meeting_link: nextMeetingLink || null,
        };
      }

      const response = await fetch(`/api/meetings/${meetingId}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error ?? "Could not complete meeting");
        setLoading(false);
        return;
      }

      setCompleted(true);
      setSavedNotes(rawNotes);
      setSavedTranscript(transcript);
      setSavedStage(data.stage);
      setNextMeetingId(data.next_meeting_id ?? null);
      setMemoryPreview([
        ...(data.memory?.next_actions ?? []).slice(0, 2),
        ...(data.memory?.objections ?? []).slice(0, 1),
      ].filter(Boolean));

      trackEvent("meeting_completed", { meetingId, completed: true });
      trackEvent("memory_updated", { meetingId });
      if (data.next_meeting_id) {
        trackEvent("meeting_scheduled", { meetingId: data.next_meeting_id });
      }

      onNotesSaved?.({
        memory_stamp: data.memory_stamp,
        memory: data.memory,
        completed: true,
      });

      router.refresh();
    } catch {
      setError("Network error. Try again.");
    } finally {
      setLoading(false);
    }
  }

  if (completed) {
    return (
      <section className="rounded-2xl border border-zinc-200 bg-white shadow-sm">
        <div className="border-b border-zinc-100 px-4 py-3 sm:px-5">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-sm font-semibold text-zinc-900">Meeting notes</h2>
            <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-800">
              Completed
            </span>
          </div>
          {savedStage && (
            <p className="mt-1 text-sm text-zinc-500">
              Pipeline stage updated to {formatStage(savedStage)}.
            </p>
          )}
        </div>

        <div className="space-y-4 p-4 sm:p-5">
          <div>
            <p className="text-xs font-medium text-zinc-600">Rep notes</p>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-zinc-800">
              {savedNotes}
            </p>
          </div>

          {savedTranscript && (
            <div>
              <p className="text-xs font-medium text-zinc-600">Transcript</p>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-zinc-700">
                {savedTranscript}
              </p>
            </div>
          )}

          {nextMeetingId && (
            <div className="rounded-lg border border-brand-100 bg-brand-50 px-3 py-2 text-sm text-brand-900">
              Next meeting scheduled.{" "}
              <Link
                href={`/rep/meetings/${nextMeetingId}`}
                className="font-medium underline"
              >
                Open meeting →
              </Link>
            </div>
          )}

          {memoryPreview.length > 0 && (
            <div className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
              Captured in prospect memory: {memoryPreview.join(" · ")}
            </div>
          )}
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-zinc-200 bg-white shadow-sm">
      <div className="border-b border-zinc-100 px-4 py-3 sm:px-5">
        <h2 className="text-sm font-semibold text-zinc-900">Complete this meeting</h2>
        <p className="mt-1 text-sm text-zinc-500">
          Add notes from this call. They update prospect memory and move the deal
          to the right pipeline stage.
        </p>
      </div>

      <form onSubmit={completeMeeting} className="space-y-4 p-4 sm:p-5">
        <div>
          <label htmlFor="raw_notes" className="text-xs font-medium text-zinc-600">
            Notes from this meeting
          </label>
          <textarea
            id="raw_notes"
            required
            rows={5}
            value={rawNotes}
            onChange={(event) => setRawNotes(event.target.value)}
            placeholder="What happened on the call? Pain, objections, next steps, demo booked, rejection…"
            className="input-field mt-2"
          />
        </div>

        <div>
          <label htmlFor="transcript" className="text-xs font-medium text-zinc-600">
            Transcript (optional)
          </label>
          <textarea
            id="transcript"
            rows={3}
            value={transcript}
            onChange={(event) => setTranscript(event.target.value)}
            placeholder="Paste transcript excerpt if available"
            className="input-field mt-2"
          />
        </div>

        <div className="rounded-xl border border-zinc-100 bg-zinc-50/80 p-4">
          <label className="flex cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              checked={scheduleNext}
              onChange={(event) => setScheduleNext(event.target.checked)}
              className="mt-1 h-4 w-4 rounded border-zinc-300"
            />
            <span>
              <span className="text-sm font-medium text-zinc-900">
                Schedule next meeting (optional)
              </span>
              <span className="mt-0.5 block text-xs text-zinc-500">
                Book the follow-up while notes are fresh.
              </span>
            </span>
          </label>

          {scheduleNext && (
            <div className="mt-4 space-y-3 border-t border-zinc-200/80 pt-4">
              <div>
                <label
                  htmlFor="next_meeting_at"
                  className="text-xs font-medium text-zinc-600"
                >
                  Next meeting date
                </label>
                <input
                  id="next_meeting_at"
                  required={scheduleNext}
                  type="datetime-local"
                  value={nextMeetingAt}
                  onChange={(event) => setNextMeetingAt(event.target.value)}
                  className="input-field mt-2"
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="next_meeting_type"
                    className="text-xs font-medium text-zinc-600"
                  >
                    Meeting type
                  </label>
                  <select
                    id="next_meeting_type"
                    value={nextMeetingType}
                    onChange={(event) =>
                      setNextMeetingType(event.target.value as MeetingType)
                    }
                    className="input-field mt-2"
                  >
                    {MEETING_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {formatMeetingType(type)}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label
                    htmlFor="next_meeting_link"
                    className="text-xs font-medium text-zinc-600"
                  >
                    Meeting link (optional)
                  </label>
                  <input
                    id="next_meeting_link"
                    type="text"
                    inputMode="url"
                    value={nextMeetingLink}
                    onChange={(event) => setNextMeetingLink(event.target.value)}
                    placeholder="https://meet.google.com/..."
                    className="input-field mt-2"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={loading || !rawNotes.trim()}
          className="btn-primary w-full sm:w-auto"
        >
          {loading ? (
            <Spinner label="Processing notes…" />
          ) : (
            "Mark meeting as completed"
          )}
        </button>
        <p className="text-xs text-zinc-500">
          Notes are required. This moves the meeting to past and updates the
          prospect pipeline stage.
        </p>
      </form>
    </section>
  );
}
