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
