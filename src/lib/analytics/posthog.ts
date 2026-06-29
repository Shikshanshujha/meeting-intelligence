type AnalyticsEvent =
  | "brief_generated"
  | "meeting_completed"
  | "memory_updated"
  | "manager_opened"
  | "prospect_created"
  | "triage_flagged";

export function trackEvent(_event: AnalyticsEvent, _properties?: Record<string, unknown>) {
  if (typeof window === "undefined") return;
  if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) return;

  // Phase 7: wire PostHog client
  void _event;
  void _properties;
}
