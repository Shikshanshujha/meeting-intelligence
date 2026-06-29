"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Spinner } from "@/components/shared/spinner";
import {
  clearCachedBrief,
  getCachedBrief,
  setCachedBrief,
} from "@/lib/rep/brief-client-cache";
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
  onBriefGenerated?: () => void;
}

function resolveInitialState(
  meetingId: string,
  staleAfterNotes: boolean,
  initialBrief?: MeetingBrief | null,
  initialSource?: string,
  initialGeminiConfigured?: boolean
) {
  const cached = getCachedBrief(meetingId);

  if (cached) {
    return {
      brief: cached.brief,
      source: cached.source,
      geminiConfigured: cached.geminiConfigured ?? initialGeminiConfigured,
      aiError: cached.aiError,
      stale: false,
    };
  }

  if (staleAfterNotes) {
    return {
      brief: null as MeetingBrief | null,
      source: undefined as string | undefined,
      geminiConfigured: initialGeminiConfigured,
      aiError: undefined as string | undefined,
      stale: true,
    };
  }

  if (initialBrief) {
    const skipTemplateForAi =
      initialSource === "template" && initialGeminiConfigured !== false;

    if (!skipTemplateForAi) {
      return {
        brief: initialBrief,
        source: initialSource,
        geminiConfigured: initialGeminiConfigured,
        aiError: undefined,
        stale: false,
      };
    }
  }

  return {
    brief: null as MeetingBrief | null,
    source: undefined as string | undefined,
    geminiConfigured: initialGeminiConfigured,
    aiError: undefined as string | undefined,
    stale: false,
  };
}

function shouldAutoGenerateBrief(
  staleAfterNotes: boolean,
  initialGeminiConfigured: boolean | undefined,
  initialBrief?: MeetingBrief | null,
  initialSource?: string
) {
  if (staleAfterNotes || initialGeminiConfigured === false) {
    return false;
  }

  if (!initialBrief) {
    return true;
  }

  return initialSource === "template";
}

const BRIEF_GENERATION_TIMEOUT_MS = 45_000;

export function GenerateBriefSection({
  meetingId,
  memoryStamp,
  initialBrief,
  initialSource,
  initialGeminiConfigured,
  staleAfterNotes = false,
  onBriefGenerated,
}: GenerateBriefSectionProps) {
  const prevStaleAfterNotes = useRef(staleAfterNotes);
  const autoGenerateStarted = useRef(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [brief, setBrief] = useState<MeetingBrief | null>(() =>
    resolveInitialState(
      meetingId,
      staleAfterNotes,
      initialBrief,
      initialSource,
      initialGeminiConfigured
    ).brief
  );
  const [source, setSource] = useState<string | undefined>(() =>
    resolveInitialState(
      meetingId,
      staleAfterNotes,
      initialBrief,
      initialSource,
      initialGeminiConfigured
    ).source
  );
  const [geminiConfigured, setGeminiConfigured] = useState<boolean | undefined>(
    () =>
      resolveInitialState(
        meetingId,
        staleAfterNotes,
        initialBrief,
        initialSource,
        initialGeminiConfigured
      ).geminiConfigured
  );
  const [aiError, setAiError] = useState<string | undefined>(() =>
    resolveInitialState(
      meetingId,
      staleAfterNotes,
      initialBrief,
      initialSource,
      initialGeminiConfigured
    ).aiError
  );
  const [stale, setStale] = useState(
    () =>
      resolveInitialState(
        meetingId,
        staleAfterNotes,
        initialBrief,
        initialSource,
        initialGeminiConfigured
      ).stale
  );

  useEffect(() => {
    const becameStale = staleAfterNotes && !prevStaleAfterNotes.current;
    prevStaleAfterNotes.current = staleAfterNotes;

    if (becameStale) {
      clearCachedBrief(meetingId);
      autoGenerateStarted.current = false;
      setBrief(null);
      setSource(undefined);
      setAiError(undefined);
      setStale(true);
      return;
    }

    if (staleAfterNotes) {
      const cached = getCachedBrief(meetingId);
      if (cached) {
        setBrief(cached.brief);
        setSource(cached.source);
        setGeminiConfigured(cached.geminiConfigured ?? initialGeminiConfigured);
        setAiError(cached.aiError);
        setStale(false);
        onBriefGenerated?.();
      }
      return;
    }

    const cached = getCachedBrief(meetingId);
    if (cached) {
      setBrief(cached.brief);
      setSource(cached.source);
      setGeminiConfigured(cached.geminiConfigured ?? initialGeminiConfigured);
      setAiError(cached.aiError);
      setStale(false);
      return;
    }

    if (initialBrief) {
      const skipTemplateForAi =
        initialSource === "template" && initialGeminiConfigured !== false;

      if (skipTemplateForAi) {
        return;
      }

      setCachedBrief(meetingId, {
        brief: initialBrief,
        source: initialSource,
        geminiConfigured: initialGeminiConfigured,
      });
      setBrief(initialBrief);
      setSource(initialSource);
      setGeminiConfigured(initialGeminiConfigured);
      setAiError(undefined);
      setStale(false);
      return;
    }
  }, [
    meetingId,
    memoryStamp,
    initialBrief,
    initialSource,
    initialGeminiConfigured,
    staleAfterNotes,
  ]);

  const generateBrief = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(
        () => controller.abort(),
        BRIEF_GENERATION_TIMEOUT_MS
      );

      const response = await fetch("/api/briefs/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ meetingId }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const data = await response.json();

      if (!response.ok) {
        autoGenerateStarted.current = false;
        setError(data.error ?? "Could not generate brief");
        return;
      }

      const nextAiError =
        data.source === "template" ? (data.ai_error as string | undefined) : undefined;

      setCachedBrief(meetingId, {
        brief: data.brief,
        source: data.source,
        geminiConfigured: data.gemini_configured,
        aiError: nextAiError,
      });

      setBrief(data.brief);
      setSource(data.source);
      setGeminiConfigured(data.gemini_configured);
      setAiError(nextAiError);
      setStale(false);
      onBriefGenerated?.();

      trackEvent("brief_generated", { meetingId });
      if (data.triage?.status === "warning" || data.triage?.status === "reject") {
        trackEvent("triage_flagged", { meetingId, status: data.triage.status });
      }
    } catch (error) {
      autoGenerateStarted.current = false;
      if (error instanceof DOMException && error.name === "AbortError") {
        setError("Brief generation timed out. Try again.");
      } else {
        setError("Network error. Try again.");
      }
    } finally {
      setLoading(false);
    }
  }, [meetingId, onBriefGenerated]);

  useEffect(() => {
    if (autoGenerateStarted.current || brief) {
      return;
    }

    if (
      !shouldAutoGenerateBrief(
        staleAfterNotes,
        initialGeminiConfigured,
        initialBrief,
        initialSource
      )
    ) {
      return;
    }

    autoGenerateStarted.current = true;
    void generateBrief();
  }, [
    brief,
    generateBrief,
    initialBrief,
    initialGeminiConfigured,
    initialSource,
    staleAfterNotes,
  ]);

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
            {loading && !stale ? "Generating your brief" : "Prepare for this meeting"}
          </p>
          <p className="mx-auto mt-2 max-w-sm text-sm text-zinc-600">
            {loading && !stale
              ? "Pulling prospect memory and past notes into a scannable brief."
              : "Pulls prospect memory and past notes into a scannable brief."}
          </p>
          {!loading && (
            <button
              type="button"
              onClick={generateBrief}
              disabled={loading}
              className="btn-primary mt-5 w-full sm:w-auto"
            >
              {stale ? "Refresh brief" : "Generate brief"}
            </button>
          )}
          {loading && (
            <div className="mt-5 flex justify-center">
              <Spinner label="Generating brief…" />
            </div>
          )}
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
