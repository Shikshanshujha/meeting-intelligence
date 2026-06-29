"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Spinner } from "@/components/shared/spinner";
import { toDatetimeLocalValue } from "@/lib/datetime-local";
import { formatMeetingType } from "@/lib/data/formatters";
import type { MeetingType } from "@/types";

interface UpcomingMeetingActionsProps {
  meetingId: string;
  prospectCompany: string;
  meetingType: MeetingType;
  scheduledAt: string;
  meetingLink?: string | null;
  variant?: "default" | "dark";
  onChanged?: () => void;
}

const MEETING_TYPES: MeetingType[] = ["discovery", "demo", "closing"];

export function UpcomingMeetingActions({
  meetingId,
  prospectCompany,
  meetingType,
  scheduledAt,
  meetingLink = "",
  variant = "default",
  onChanged,
}: UpcomingMeetingActionsProps) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [rescheduleOpen, setRescheduleOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nextType, setNextType] = useState(meetingType);
  const [nextScheduledAt, setNextScheduledAt] = useState(() =>
    toDatetimeLocalValue(scheduledAt)
  );
  const [nextMeetingLink, setNextMeetingLink] = useState(meetingLink ?? "");

  const isDark = variant === "dark";
  const secondaryButtonClass = isDark
    ? "inline-flex items-center rounded-lg border border-white/20 bg-white/10 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/20 disabled:opacity-50"
    : "btn-secondary px-4 py-2";
  const dangerButtonClass = isDark
    ? "inline-flex items-center rounded-lg border border-red-300/30 bg-red-500/20 px-4 py-2 text-sm font-medium text-red-100 transition hover:bg-red-500/30 disabled:opacity-50"
    : "inline-flex items-center rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-700 transition hover:bg-red-100 disabled:opacity-50";

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!rescheduleOpen && !deleteOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !loading) {
        setRescheduleOpen(false);
        setDeleteOpen(false);
        setError(null);
      }
    }

    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [deleteOpen, loading, rescheduleOpen]);

  function openRescheduleModal() {
    setNextType(meetingType);
    setNextScheduledAt(toDatetimeLocalValue(scheduledAt));
    setNextMeetingLink(meetingLink ?? "");
    setError(null);
    setRescheduleOpen(true);
  }

  async function handleReschedule(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/meetings/${meetingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scheduled_at: new Date(nextScheduledAt).toISOString(),
          meeting_type: nextType,
          meeting_link: nextMeetingLink || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error ?? "Could not reschedule meeting");
        return;
      }

      setRescheduleOpen(false);
      onChanged?.();
      router.refresh();
    } catch {
      setError("Network error. Try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/meetings/${meetingId}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error ?? "Could not delete meeting");
        return;
      }

      setDeleteOpen(false);
      onChanged?.();
      router.push("/rep");
      router.refresh();
    } catch {
      setError("Network error. Try again.");
    } finally {
      setLoading(false);
    }
  }

  const rescheduleModal =
    rescheduleOpen && mounted
      ? createPortal(
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6"
            role="dialog"
            aria-modal="true"
            aria-labelledby="reschedule-meeting-title"
          >
            <button
              type="button"
              aria-label="Close"
              className="absolute inset-0 bg-zinc-900/50"
              onClick={() => !loading && setRescheduleOpen(false)}
            />
            <section className="relative z-10 flex max-h-[calc(100vh-2rem)] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-xl">
              <div className="shrink-0 border-b border-zinc-100 px-5 py-4">
                <h2
                  id="reschedule-meeting-title"
                  className="text-lg font-semibold text-zinc-900"
                >
                  Reschedule meeting
                </h2>
                <p className="mt-1 text-sm text-zinc-500">
                  Update the time for {prospectCompany}. A fresh brief will be prepared.
                </p>
              </div>
              <form
                onSubmit={handleReschedule}
                className="min-h-0 flex-1 space-y-4 overflow-y-auto p-5"
              >
                <div>
                  <label htmlFor="reschedule_type" className="text-xs font-medium text-zinc-600">
                    Meeting type
                  </label>
                  <select
                    id="reschedule_type"
                    value={nextType}
                    onChange={(event) =>
                      setNextType(event.target.value as MeetingType)
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
                  <label htmlFor="reschedule_at" className="text-xs font-medium text-zinc-600">
                    Date & time
                  </label>
                  <input
                    id="reschedule_at"
                    required
                    type="datetime-local"
                    value={nextScheduledAt}
                    onChange={(event) => setNextScheduledAt(event.target.value)}
                    className="input-field mt-2"
                  />
                </div>
                <div>
                  <label htmlFor="reschedule_link" className="text-xs font-medium text-zinc-600">
                    Meeting link (optional)
                  </label>
                  <input
                    id="reschedule_link"
                    type="text"
                    inputMode="url"
                    value={nextMeetingLink}
                    onChange={(event) => setNextMeetingLink(event.target.value)}
                    placeholder="https://meet.google.com/..."
                    className="input-field mt-2"
                  />
                </div>
                {error && <p className="text-sm text-red-600">{error}</p>}
                <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={() => setRescheduleOpen(false)}
                    disabled={loading}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                  <button type="submit" disabled={loading} className="btn-primary">
                    {loading ? <Spinner label="Saving…" /> : "Save new time"}
                  </button>
                </div>
              </form>
            </section>
          </div>,
          document.body
        )
      : null;

  const deleteModal =
    deleteOpen && mounted
      ? createPortal(
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6"
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-meeting-title"
          >
            <button
              type="button"
              aria-label="Close"
              className="absolute inset-0 bg-zinc-900/50"
              onClick={() => !loading && setDeleteOpen(false)}
            />
            <section className="relative z-10 w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-5 shadow-xl">
              <h2 id="delete-meeting-title" className="text-lg font-semibold text-zinc-900">
                Cancel meeting?
              </h2>
              <p className="mt-2 text-sm text-zinc-600">
                This removes the upcoming {formatMeetingType(meetingType).toLowerCase()} with{" "}
                {prospectCompany}. You can schedule a new meeting later.
              </p>
              {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
              <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => setDeleteOpen(false)}
                  disabled={loading}
                  className="btn-secondary"
                >
                  Keep meeting
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={loading}
                  className="inline-flex items-center justify-center rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700 disabled:opacity-50"
                >
                  {loading ? <Spinner label="Deleting…" /> : "Delete meeting"}
                </button>
              </div>
            </section>
          </div>,
          document.body
        )
      : null;

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" onClick={openRescheduleModal} className={secondaryButtonClass}>
          Reschedule
        </button>
        <button
          type="button"
          onClick={() => {
            setError(null);
            setDeleteOpen(true);
          }}
          className={dangerButtonClass}
        >
          Delete
        </button>
      </div>
      {rescheduleModal}
      {deleteModal}
    </>
  );
}
