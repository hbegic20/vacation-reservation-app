export function toDateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function startOfUtcDay(date: Date): Date {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
}

export function eachDateKey(startDate: Date, endDate: Date): string[] {
  const keys: string[] = [];
  const endKey = toDateKey(endDate);
  for (let key = toDateKey(startDate); key <= endKey; key = addDays(key, 1)) {
    keys.push(key);
  }
  return keys;
}

export function countWorkingDays(
  startDate: Date,
  endDate: Date,
  holidayKeys: ReadonlySet<string> = new Set(),
): number {
  return eachDateKey(startDate, endDate).filter(
    (key) => !isWeekendKey(key) && !holidayKeys.has(key),
  ).length;
}

const dateFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

export function formatDateRange(startDate: Date, endDate: Date): string {
  const start = dateFormatter.format(startDate);
  const end = dateFormatter.format(endDate);
  return start === end ? start : `${start} – ${end}`;
}

export function addDays(dateKey: string, count: number): string {
  const date = new Date(`${dateKey}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + count);
  return toDateKey(date);
}

export function isWeekendKey(dateKey: string): boolean {
  const weekday = new Date(`${dateKey}T00:00:00.000Z`).getUTCDay();
  return weekday === 0 || weekday === 6;
}

export function daysBetweenInclusive(startKey: string, endKey: string): number {
  const millisecondsPerDay = 86_400_000;
  const start = new Date(`${startKey}T00:00:00.000Z`).getTime();
  const end = new Date(`${endKey}T00:00:00.000Z`).getTime();
  return Math.round((end - start) / millisecondsPerDay) + 1;
}
