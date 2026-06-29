"use client";

import { useEffect } from "react";
import { trackEvent } from "@/lib/analytics/posthog";

export function ManagerAnalytics() {
  useEffect(() => {
    trackEvent("manager_opened");
  }, []);

  return null;
}
