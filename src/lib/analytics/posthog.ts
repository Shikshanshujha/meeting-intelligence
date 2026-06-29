import posthog from "posthog-js";

type AnalyticsEvent =
  | "brief_generated"
  | "meeting_completed"
  | "memory_updated"
  | "manager_opened"
  | "prospect_created"
  | "triage_flagged";

export function trackEvent(
  event: AnalyticsEvent,
  properties?: Record<string, unknown>
) {
  if (typeof window === "undefined") return;
  if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) return;

  try {
    posthog.capture(event, properties);
  } catch {
    // Analytics must never break the app
  }
}
