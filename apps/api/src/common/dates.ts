export function toDateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function startOfUtcDay(date: Date): Date {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
}

export function countWorkingDays(
  startDate: Date,
  endDate: Date,
  holidayKeys: ReadonlySet<string> = new Set(),
): number {
  const end = startOfUtcDay(endDate);
  let workingDays = 0;
  for (
    let day = startOfUtcDay(startDate);
    day <= end;
    day.setUTCDate(day.getUTCDate() + 1)
  ) {
    const weekday = day.getUTCDay();
    const isWeekend = weekday === 0 || weekday === 6;
    if (!isWeekend && !holidayKeys.has(toDateKey(day))) {
      workingDays += 1;
    }
  }
  return workingDays;
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
