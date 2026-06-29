import { createServiceClient } from "@/lib/auth/demo-users";
import { getSessionProfile } from "@/lib/auth/session";
import type { TimelineGranularity } from "@/lib/timeline-granularity";

export interface TimelineBucket {
  label: string;
  start: string;
  end: string;
  converted: number;
  lost: number;
}

export interface ConversionTimelineData {
  granularity: TimelineGranularity;
  buckets: TimelineBucket[];
  totalConverted: number;
  totalLost: number;
}

interface ConversionEvent {
  occurredAt: string;
  outcome: "converted" | "lost";
}

function startOfDay(date: Date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function endOfDay(date: Date) {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

function startOfWeek(date: Date) {
  const d = startOfDay(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d;
}

function startOfMonth(date: Date) {
  return startOfDay(new Date(date.getFullYear(), date.getMonth(), 1));
}

function startOfQuarter(date: Date) {
  const quarter = Math.floor(date.getMonth() / 3);
  return startOfDay(new Date(date.getFullYear(), quarter * 3, 1));
}

function startOfYear(date: Date) {
  return startOfDay(new Date(date.getFullYear(), 0, 1));
}

function getBucketStart(date: Date, granularity: TimelineGranularity) {
  switch (granularity) {
    case "week":
      return startOfWeek(date);
    case "month":
      return startOfMonth(date);
    case "quarter":
      return startOfQuarter(date);
    case "year":
      return startOfYear(date);
  }
}

function getBucketEnd(start: Date, granularity: TimelineGranularity) {
  switch (granularity) {
    case "week": {
      const end = new Date(start);
      end.setDate(end.getDate() + 6);
      return endOfDay(end);
    }
    case "month":
      return endOfDay(new Date(start.getFullYear(), start.getMonth() + 1, 0));
    case "quarter":
      return endOfDay(new Date(start.getFullYear(), start.getMonth() + 3, 0));
    case "year":
      return endOfDay(new Date(start.getFullYear(), 11, 31));
  }
}

function shiftBucketStart(start: Date, granularity: TimelineGranularity, delta: number) {
  const d = new Date(start);
  switch (granularity) {
    case "week":
      d.setDate(d.getDate() + delta * 7);
      break;
    case "month":
      d.setMonth(d.getMonth() + delta);
      break;
    case "quarter":
      d.setMonth(d.getMonth() + delta * 3);
      break;
    case "year":
      d.setFullYear(d.getFullYear() + delta);
      break;
  }
  return getBucketStart(d, granularity);
}

function formatBucketLabel(start: Date, granularity: TimelineGranularity) {
  switch (granularity) {
    case "week":
      return new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
      }).format(start);
    case "month":
      return new Intl.DateTimeFormat("en-US", {
        month: "short",
        year: "2-digit",
      }).format(start);
    case "quarter": {
      const quarter = Math.floor(start.getMonth() / 3) + 1;
      return `Q${quarter} '${String(start.getFullYear()).slice(-2)}`;
    }
    case "year":
      return String(start.getFullYear());
  }
}

function generateBucketsFromRange(
  granularity: TimelineGranularity,
  firstEventDate: Date,
  now: Date
): TimelineBucket[] {
  let cursor = getBucketStart(firstEventDate, granularity);
  const lastStart = getBucketStart(now, granularity);
  const buckets: TimelineBucket[] = [];

  while (cursor.getTime() <= lastStart.getTime()) {
    const end = getBucketEnd(cursor, granularity);
    buckets.push({
      label: formatBucketLabel(cursor, granularity),
      start: cursor.toISOString(),
      end: end.toISOString(),
      converted: 0,
      lost: 0,
    });
    cursor = shiftBucketStart(cursor, granularity, 1);
  }

  return buckets;
}

function currentPeriodBucket(
  granularity: TimelineGranularity,
  now = new Date()
): TimelineBucket {
  const start = getBucketStart(now, granularity);
  return {
    label: formatBucketLabel(start, granularity),
    start: start.toISOString(),
    end: getBucketEnd(start, granularity).toISOString(),
    converted: 0,
    lost: 0,
  };
}

function assignToBucket(
  buckets: TimelineBucket[],
  occurredAt: string,
  outcome: "converted" | "lost"
) {
  const date = new Date(occurredAt);

  for (const bucket of buckets) {
    if (date >= new Date(bucket.start) && date <= new Date(bucket.end)) {
      if (outcome === "converted") {
        bucket.converted += 1;
      } else {
        bucket.lost += 1;
      }
      return;
    }
  }
}

export async function getConversionTimeline(
  granularity: TimelineGranularity
): Promise<ConversionTimelineData | null> {
  const profile = await getSessionProfile();

  if (!profile || profile.role !== "manager") {
    return null;
  }

  const supabase = createServiceClient();
  const now = new Date();

  const { data: prospects, error: prospectError } = await supabase
    .from("prospects")
    .select("id, company, stage, updated_at")
    .in("stage", ["won", "rejected"]);

  if (prospectError) {
    console.error("getConversionTimeline prospects:", prospectError.message);
    return {
      granularity,
      buckets: [currentPeriodBucket(granularity, now)],
      totalConverted: 0,
      totalLost: 0,
    };
  }

  const terminalProspects = prospects ?? [];
  if (terminalProspects.length === 0) {
    return {
      granularity,
      buckets: [currentPeriodBucket(granularity, now)],
      totalConverted: 0,
      totalLost: 0,
    };
  }

  const prospectIds = terminalProspects.map((p) => p.id);
  const { data: milestones, error: milestoneError } = await supabase
    .from("pipeline_milestones")
    .select("prospect_id, occurred_at, tone")
    .in("prospect_id", prospectIds)
    .order("occurred_at", { ascending: false });

  if (milestoneError) {
    console.error("getConversionTimeline milestones:", milestoneError.message);
  }

  const milestonesByProspect = new Map<string, NonNullable<typeof milestones>>();
  for (const milestone of milestones ?? []) {
    const list = milestonesByProspect.get(milestone.prospect_id) ?? [];
    list.push(milestone);
    milestonesByProspect.set(milestone.prospect_id, list);
  }

  const events: ConversionEvent[] = [];
  let totalConverted = 0;
  let totalLost = 0;

  for (const prospect of terminalProspects) {
    const outcome = prospect.stage === "won" ? "converted" : "lost";
    const tone = outcome === "converted" ? "positive" : "negative";
    const prospectMilestones = milestonesByProspect.get(prospect.id) ?? [];
    const terminalMilestone = prospectMilestones
      .filter((m) => m.tone === tone)
      .sort(
        (a, b) =>
          new Date(b.occurred_at).getTime() - new Date(a.occurred_at).getTime()
      )[0];
    const occurredAt = terminalMilestone?.occurred_at ?? prospect.updated_at;

    events.push({ occurredAt, outcome });

    if (outcome === "converted") {
      totalConverted += 1;
    } else {
      totalLost += 1;
    }
  }

  const firstEventDate = new Date(
    Math.min(...events.map((event) => new Date(event.occurredAt).getTime()))
  );

  const buckets =
    events.length > 0
      ? generateBucketsFromRange(granularity, firstEventDate, now)
      : [currentPeriodBucket(granularity, now)];

  for (const event of events) {
    assignToBucket(buckets, event.occurredAt, event.outcome);
  }

  return {
    granularity,
    buckets,
    totalConverted,
    totalLost,
  };
}
