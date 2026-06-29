export type DateRangeKey =
  | "current_week"
  | "last_week"
  | "current_month"
  | "last_month"
  | "current_quarter"
  | "last_quarter"
  | "current_year"
  | "last_year";

export const DATE_RANGE_OPTIONS: { key: DateRangeKey; label: string }[] = [
  { key: "current_week", label: "Current week" },
  { key: "last_week", label: "Last week" },
  { key: "current_month", label: "Current month" },
  { key: "last_month", label: "Last month" },
  { key: "current_quarter", label: "Current quarter" },
  { key: "last_quarter", label: "Last quarter" },
  { key: "current_year", label: "Current year" },
  { key: "last_year", label: "Last year" },
];

export interface DateRange {
  start: Date;
  end: Date;
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

export function getDateRange(key: DateRangeKey, now = new Date()): DateRange {
  switch (key) {
    case "current_week":
      return { start: startOfWeek(now), end: endOfDay(now) };
    case "last_week": {
      const start = startOfWeek(now);
      start.setDate(start.getDate() - 7);
      const end = new Date(start);
      end.setDate(end.getDate() + 6);
      return { start, end: endOfDay(end) };
    }
    case "current_month":
      return { start: startOfMonth(now), end: endOfDay(now) };
    case "last_month": {
      const start = startOfMonth(new Date(now.getFullYear(), now.getMonth() - 1, 1));
      const end = endOfDay(new Date(now.getFullYear(), now.getMonth(), 0));
      return { start, end };
    }
    case "current_quarter":
      return { start: startOfQuarter(now), end: endOfDay(now) };
    case "last_quarter": {
      const start = startOfQuarter(now);
      start.setMonth(start.getMonth() - 3);
      const end = endOfDay(new Date(start.getFullYear(), start.getMonth() + 3, 0));
      return { start, end };
    }
    case "current_year":
      return { start: startOfYear(now), end: endOfDay(now) };
    case "last_year": {
      const start = startOfYear(new Date(now.getFullYear() - 1, 0, 1));
      const end = endOfDay(new Date(now.getFullYear() - 1, 11, 31));
      return { start, end };
    }
    default:
      return { start: startOfMonth(now), end: endOfDay(now) };
  }
}

export function isWithinRange(iso: string, range: DateRange) {
  const date = new Date(iso);
  return date >= range.start && date <= range.end;
}
