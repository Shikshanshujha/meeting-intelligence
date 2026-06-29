"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Spinner } from "@/components/shared/spinner";
import type { MeetingBrief } from "@/types";
import { BriefCard } from "./brief-card";
import { trackEvent } from "@/lib/analytics/posthog";

interface GenerateBriefSectionProps {
  meetingId: string;
  memoryStamp: string;
  initialBrief?: MeetingBrief | null;
  initialSource?: string;
  initialGeminiConfigured?: boolean;
  staleAfterNotes?: boolean;
}

export function GenerateBriefSection({
  meetingId,
  memoryStamp,
  initialBrief,
  initialSource,
  initialGeminiConfigured,
  staleAfterNotes = false,
}: GenerateBriefSectionProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [brief, setBrief] = useState<MeetingBrief | null>(
    staleAfterNotes ? null : (initialBrief ?? null)
  );
  const [source, setSource] = useState(staleAfterNotes ? undefined : initialSource);
  const [geminiConfigured, setGeminiConfigured] = useState<boolean | undefined>(
    initialGeminiConfigured
  );
  const [aiError, setAiError] = useState<string | undefined>();
  const [stale, setStale] = useState(staleAfterNotes);

  useEffect(() => {
    if (staleAfterNotes) {
      setBrief(null);
      setSource(undefined);
      setStale(true);
      return;
    }
    if (initialBrief) {
      setBrief(initialBrief);
      setSource(initialSource);
      setStale(false);
    }
  }, [memoryStamp, initialBrief, initialSource, staleAfterNotes]);

  async function generateBrief() {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/briefs/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ meetingId }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error ?? "Could not generate brief");
        setLoading(false);
        return;
      }

      setBrief(data.brief);
      setSource(data.source);
      setGeminiConfigured(data.gemini_configured);
      setAiError(data.source === "template" ? data.ai_error : undefined);
      setStale(false);
      trackEvent("brief_generated", { meetingId });
      if (data.triage?.status === "warning" || data.triage?.status === "reject") {
        trackEvent("triage_flagged", { meetingId, status: data.triage.status });
      }
      router.refresh();
    } catch {
      setError("Network error. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      {stale && (
        <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900">
          Memory updated — refresh the brief to include your latest notes.
        </div>
      )}

      {!brief && (
        <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-6 text-center">
          <p className="text-sm font-medium text-zinc-900">
            Prepare for this meeting
          </p>
          <p className="mx-auto mt-2 max-w-sm text-sm text-zinc-600">
            Pulls prospect memory and past notes into a scannable brief.
          </p>
          <button
            type="button"
            onClick={generateBrief}
            disabled={loading}
            className="btn-primary mt-5 w-full sm:w-auto"
          >
            {loading ? (
              <Spinner label="Generating brief…" />
            ) : stale ? (
              "Refresh brief"
            ) : (
              "Generate brief"
            )}
          </button>
          {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
        </div>
      )}

      {brief && (
        <>
          <div className="flex justify-end">
            <button
              type="button"
              onClick={generateBrief}
              disabled={loading}
              className="text-sm text-zinc-500 transition hover:text-zinc-900 disabled:opacity-50"
            >
              {loading ? "Refreshing…" : "Refresh brief"}
            </button>
          </div>
          <BriefCard
            brief={brief}
            source={source}
            geminiConfigured={geminiConfigured}
            aiError={aiError}
          />
        </>
      )}
    </div>
  );
}
