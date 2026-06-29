"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Spinner } from "@/components/shared/spinner";
import { formatMeetingType } from "@/lib/data/formatters";
import { inferMeetingTypeForStage } from "@/lib/workflows/schedule-meeting";
import { trackEvent } from "@/lib/analytics/posthog";
import type { MeetingType, ProspectStage } from "@/types";

export interface ScheduleMeetingProspect {
  id: string;
  company: string;
  stage?: ProspectStage;
}

interface ScheduleMeetingFormProps {
  prospects?: ScheduleMeetingProspect[];
  prospectId?: string;
  prospectCompany?: string;
  defaultMeetingType?: MeetingType;
  buttonLabel?: string;
  buttonClassName?: string;
}

const MEETING_TYPES: MeetingType[] = ["discovery", "demo", "closing"];

function defaultMeetingTime(): string {
  const date = new Date();
  date.setDate(date.getDate() + 7);
  date.setHours(10, 0, 0, 0);
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60_000);
  return local.toISOString().slice(0, 16);
}

export function ScheduleMeetingForm({
  prospects = [],
  prospectId,
  prospectCompany,
  defaultMeetingType,
  buttonLabel = "Schedule meeting",
  buttonClassName = "btn-secondary px-4 py-2",
}: ScheduleMeetingFormProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedProspectId, setSelectedProspectId] = useState(prospectId ?? "");
  const [meetingType, setMeetingType] = useState<MeetingType>(
    defaultMeetingType ?? "demo"
  );
  const [scheduledAt, setScheduledAt] = useState(defaultMeetingTime);
  const [meetingLink, setMeetingLink] = useState("");

  const lockedProspect = Boolean(prospectId);
  const selectedProspect =
    prospects.find((item) => item.id === selectedProspectId) ??
    (prospectId && prospectCompany
      ? { id: prospectId, company: prospectCompany }
      : null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (prospectId) {
      setSelectedProspectId(prospectId);
    }
  }, [prospectId]);

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !loading) {
        setOpen(false);
        setError(null);
      }
    }

    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, loading]);

  useEffect(() => {
    if (!selectedProspectId || defaultMeetingType) return;
    const prospect = prospects.find((item) => item.id === selectedProspectId);
    if (prospect?.stage) {
      setMeetingType(inferMeetingTypeForStage(prospect.stage));
    }
  }, [selectedProspectId, prospects, defaultMeetingType]);

  function openModal() {
    setScheduledAt(defaultMeetingTime());
    setMeetingLink("");
    setError(null);
    if (!prospectId && prospects.length === 1) {
      setSelectedProspectId(prospects[0].id);
    }
    setOpen(true);
  }

  function closeModal() {
    if (loading) return;
    setOpen(false);
    setError(null);
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    if (!selectedProspectId) {
      setError("Choose a prospect to schedule.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/meetings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prospect_id: selectedProspectId,
          scheduled_at: new Date(scheduledAt).toISOString(),
          meeting_type: meetingType,
          meeting_link: meetingLink || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error ?? "Could not schedule meeting");
        return;
      }

      trackEvent("meeting_scheduled", {
        prospectId: selectedProspectId,
        meetingType,
      });

      setOpen(false);
      router.refresh();
      router.push(`/rep/meetings/${data.meeting_id}`);
    } catch {
      setError("Network error. Try again.");
    } finally {
      setLoading(false);
    }
  }

  const modal =
    open && mounted
      ? createPortal(
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6"
            role="dialog"
            aria-modal="true"
            aria-labelledby="schedule-meeting-title"
          >
            <button
              type="button"
              aria-label="Close"
              className="absolute inset-0 bg-zinc-900/50"
              onClick={() => closeModal()}
            />

            <section className="relative z-10 flex max-h-[calc(100vh-2rem)] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-xl">
              <div className="shrink-0 border-b border-zinc-100 px-5 py-4">
                <h2 id="schedule-meeting-title" className="text-lg font-semibold text-zinc-900">
                  Schedule meeting
                </h2>
                <p className="mt-1 text-sm text-zinc-500">
                  {lockedProspect
                    ? `Book a follow-up for ${prospectCompany ?? "this prospect"}.`
                    : "Pick a prospect and schedule the next call."}
                </p>
              </div>

              <form
                onSubmit={handleSubmit}
                className="min-h-0 flex-1 space-y-4 overflow-y-auto p-5"
              >
                {!lockedProspect && (
                  <div>
                    <label
                      htmlFor="schedule_prospect"
                      className="text-xs font-medium text-zinc-600"
                    >
                      Prospect
                    </label>
                    <select
                      id="schedule_prospect"
                      required
                      value={selectedProspectId}
                      onChange={(event) => setSelectedProspectId(event.target.value)}
                      className="input-field mt-2"
                    >
                      <option value="">Select prospect…</option>
                      {prospects.map((prospect) => (
                        <option key={prospect.id} value={prospect.id}>
                          {prospect.company}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {lockedProspect && selectedProspect && (
                  <div className="rounded-xl bg-zinc-50 px-3 py-2 text-sm text-zinc-700">
                    {selectedProspect.company}
                  </div>
                )}

                <div>
                  <label htmlFor="schedule_type" className="text-xs font-medium text-zinc-600">
                    Meeting type
                  </label>
                  <select
                    id="schedule_type"
                    value={meetingType}
                    onChange={(event) =>
                      setMeetingType(event.target.value as MeetingType)
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
                    htmlFor="schedule_at"
                    className="text-xs font-medium text-zinc-600"
                  >
                    Date & time
                  </label>
                  <input
                    id="schedule_at"
                    required
                    type="datetime-local"
                    value={scheduledAt}
                    onChange={(event) => setScheduledAt(event.target.value)}
                    className="input-field mt-2"
                  />
                </div>

                <div>
                  <label
                    htmlFor="schedule_link"
                    className="text-xs font-medium text-zinc-600"
                  >
                    Meeting link (optional)
                  </label>
                  <input
                    id="schedule_link"
                    type="text"
                    inputMode="url"
                    value={meetingLink}
                    onChange={(event) => setMeetingLink(event.target.value)}
                    placeholder="https://meet.google.com/..."
                    className="input-field mt-2"
                  />
                </div>

                {error && <p className="text-sm text-red-600">{error}</p>}

                <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={() => closeModal()}
                    disabled={loading}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading || !selectedProspectId}
                    className="btn-primary"
                  >
                    {loading ? (
                      <Spinner label="Scheduling & preparing brief…" />
                    ) : (
                      "Schedule meeting"
                    )}
                  </button>
                </div>
              </form>
            </section>
          </div>,
          document.body
        )
      : null;

  const disabled = !lockedProspect && prospects.length === 0;

  return (
    <>
      <button
        type="button"
        onClick={openModal}
        disabled={disabled}
        className={`${buttonClassName} disabled:cursor-not-allowed disabled:opacity-50`}
        title={disabled ? "Add a prospect first" : undefined}
      >
        {buttonLabel}
      </button>
      {modal}
    </>
  );
}
