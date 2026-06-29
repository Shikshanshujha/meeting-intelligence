function startOfDay(date: Date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function isWorkingDay(date: Date) {
  const day = date.getDay();
  return day !== 0 && day !== 6;
}

/** Whole working days elapsed after the meeting day (meeting day excluded). */
export function workingDaysSince(date: Date, now = new Date()): number {
  const cursor = startOfDay(date);
  const end = startOfDay(now);

  if (cursor >= end) {
    return 0;
  }

  cursor.setDate(cursor.getDate() + 1);
  let count = 0;

  while (cursor <= end) {
    if (isWorkingDay(cursor)) {
      count += 1;
    }
    cursor.setDate(cursor.getDate() + 1);
  }

  return count;
}

export function hasExceededWorkingDaysSince(
  date: Date,
  threshold: number,
  now = new Date()
): boolean {
  return workingDaysSince(date, now) > threshold;
}
