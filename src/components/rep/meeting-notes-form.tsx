"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { trackEvent } from "@/lib/analytics/posthog";
import { formatStage } from "@/lib/data/formatters";
import type { ProspectMemory, ProspectStage } from "@/types";

interface MeetingNotesFormProps {
  meetingId: string;
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

export function MeetingNotesForm({
  meetingId,
  submittedNotes,
  submittedTranscript,
  submittedStage,
  isCompleted = false,
  onNotesSaved,
}: MeetingNotesFormProps) {
  const router = useRouter();
  const [rawNotes, setRawNotes] = useState("");
  const [transcript, setTranscript] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [completed, setCompleted] = useState(isCompleted);
  const [savedNotes, setSavedNotes] = useState(submittedNotes ?? "");
  const [savedTranscript, setSavedTranscript] = useState(submittedTranscript ?? "");
  const [savedStage, setSavedStage] = useState(submittedStage);
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
      const response = await fetch(`/api/meetings/${meetingId}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          raw_notes: rawNotes,
          transcript: transcript || null,
        }),
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
      setMemoryPreview([
        ...(data.memory?.next_actions ?? []).slice(0, 2),
        ...(data.memory?.objections ?? []).slice(0, 1),
      ].filter(Boolean));

      trackEvent("meeting_completed", { meetingId, completed: true });
      trackEvent("memory_updated", { meetingId });

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
            className="mt-2 w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm text-zinc-900 outline-none ring-zinc-900/10 focus:ring-2"
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
            className="mt-2 w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm text-zinc-900 outline-none ring-zinc-900/10 focus:ring-2"
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={loading || !rawNotes.trim()}
          className="inline-flex w-full items-center justify-center rounded-xl bg-zinc-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:opacity-60 sm:w-auto"
        >
          {loading ? "Saving…" : "Mark meeting as completed"}
        </button>
        <p className="text-xs text-zinc-500">
          Notes are required. This moves the meeting to past and updates the
          prospect pipeline stage.
        </p>
      </form>
    </section>
  );
}
