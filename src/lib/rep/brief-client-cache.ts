import type { MeetingBrief } from "@/types";

interface CachedBrief {
  brief: MeetingBrief;
  source?: string;
  geminiConfigured?: boolean;
  aiError?: string;
}

const briefClientCache = new Map<string, CachedBrief>();

export function getCachedBrief(meetingId: string): CachedBrief | undefined {
  return briefClientCache.get(meetingId);
}

export function setCachedBrief(meetingId: string, value: CachedBrief) {
  briefClientCache.set(meetingId, value);
}

export function clearCachedBrief(meetingId: string) {
  briefClientCache.delete(meetingId);
}
