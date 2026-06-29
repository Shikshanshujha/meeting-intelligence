"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { trackEvent } from "@/lib/analytics/posthog";

function defaultMeetingTime(): string {
  const date = new Date();
  date.setDate(date.getDate() + 2);
  date.setHours(10, 0, 0, 0);
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60_000);
  return local.toISOString().slice(0, 16);
}

export function AddProspectForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [company, setCompany] = useState("");
  const [website, setWebsite] = useState("");
  const [industry, setIndustry] = useState("");
  const [employeeRange, setEmployeeRange] = useState("");
  const [buyingIntent, setBuyingIntent] = useState("");
  const [scheduledAt, setScheduledAt] = useState(defaultMeetingTime);
  const [meetingLink, setMeetingLink] = useState("");

  useEffect(() => {
    setMounted(true);
  }, []);

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

  function resetForm() {
    setCompany("");
    setWebsite("");
    setIndustry("");
    setEmployeeRange("");
    setBuyingIntent("");
    setScheduledAt(defaultMeetingTime());
    setMeetingLink("");
    setError(null);
  }

  function closeModal(options?: { force?: boolean }) {
    if (loading && !options?.force) return;
    setOpen(false);
    setError(null);
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/prospects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          company,
          website,
          industry: industry || null,
          employee_range: employeeRange || null,
          buying_intent: buyingIntent || null,
          scheduled_at: new Date(scheduledAt).toISOString(),
          meeting_link: meetingLink || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error ?? "Could not add prospect");
        return;
      }

      trackEvent("prospect_created", { company: data.company });
      setOpen(false);
      resetForm();
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
            aria-labelledby="add-prospect-title"
          >
            <button
              type="button"
              aria-label="Close"
              className="absolute inset-0 bg-zinc-900/50"
              onClick={() => closeModal()}
            />

            <section className="relative z-10 flex max-h-[calc(100vh-2rem)] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-xl">
              <div className="shrink-0 border-b border-zinc-100 px-5 py-4">
                <h2 id="add-prospect-title" className="text-lg font-semibold text-zinc-900">
                  Add prospect
                </h2>
                <p className="mt-1 text-sm text-zinc-500">
                  Creates the company in your pipeline and schedules a first discovery
                  meeting.
                </p>
              </div>

              <form
                onSubmit={handleSubmit}
                className="min-h-0 flex-1 space-y-4 overflow-y-auto p-5"
              >
                <div>
                  <label htmlFor="company" className="text-xs font-medium text-zinc-600">
                    Company name
                  </label>
                  <input
                    id="company"
                    required
                    value={company}
                    onChange={(event) => setCompany(event.target.value)}
                    placeholder="Acme Corp"
                    className="input-field mt-2"
                  />
                </div>

                <div>
                  <label htmlFor="website" className="text-xs font-medium text-zinc-600">
                    Website
                  </label>
                  <input
                    id="website"
                    required
                    type="text"
                    value={website}
                    onChange={(event) => setWebsite(event.target.value)}
                    placeholder="acme.com"
                    className="input-field mt-2"
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="industry" className="text-xs font-medium text-zinc-600">
                      Industry
                    </label>
                    <input
                      id="industry"
                      value={industry}
                      onChange={(event) => setIndustry(event.target.value)}
                      placeholder="B2B SaaS"
                      className="input-field mt-2"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="employee_range"
                      className="text-xs font-medium text-zinc-600"
                    >
                      Employees
                    </label>
                    <input
                      id="employee_range"
                      value={employeeRange}
                      onChange={(event) => setEmployeeRange(event.target.value)}
                      placeholder="50–200"
                      className="input-field mt-2"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="buying_intent"
                    className="text-xs font-medium text-zinc-600"
                  >
                    Buying intent (optional)
                  </label>
                  <textarea
                    id="buying_intent"
                    rows={2}
                    value={buyingIntent}
                    onChange={(event) => setBuyingIntent(event.target.value)}
                    placeholder="Why they might buy — inbound source, pain heard, etc."
                    className="input-field mt-2"
                  />
                </div>

                <div>
                  <label
                    htmlFor="scheduled_at"
                    className="text-xs font-medium text-zinc-600"
                  >
                    First meeting
                  </label>
                  <input
                    id="scheduled_at"
                    required
                    type="datetime-local"
                    value={scheduledAt}
                    onChange={(event) => setScheduledAt(event.target.value)}
                    className="input-field mt-2"
                  />
                </div>

                <div>
                  <label
                    htmlFor="meeting_link"
                    className="text-xs font-medium text-zinc-600"
                  >
                    Meeting link (optional)
                  </label>
                  <input
                    id="meeting_link"
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
                    disabled={loading || !company.trim() || !website.trim()}
                    className="btn-primary"
                  >
                    {loading ? "Adding…" : "Add prospect & schedule meeting"}
                  </button>
                </div>
              </form>
            </section>
          </div>,
          document.body
        )
      : null;

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="btn-primary px-4 py-2">
        Add prospect
      </button>
      {modal}
    </>
  );
}
