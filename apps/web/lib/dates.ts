const calendarDateFormatter = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  timeZone: 'UTC'
});

const longCalendarDateFormatter = new Intl.DateTimeFormat('en-GB', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC'
});

export function toDateKey(isoDate: string): string {
  return isoDate.slice(0, 10);
}

export function localDateKey(day: Date): string {
  const year = day.getFullYear();
  const month = String(day.getMonth() + 1).padStart(2, '0');
  const date = String(day.getDate()).padStart(2, '0');
  return `${year}-${month}-${date}`;
}

export function formatDate(isoDate: string): string {
  return calendarDateFormatter.format(new Date(isoDate));
}

export function formatLongDate(isoDate: string): string {
  return longCalendarDateFormatter.format(new Date(isoDate));
}

export function formatDateRange(startDate: string, endDate: string): string {
  return `${formatDate(startDate)} – ${formatDate(endDate)}`;
}

const monthShortFormatter = new Intl.DateTimeFormat('en-GB', { month: 'short', timeZone: 'UTC' });

function utcMidnight(isoDate: string): Date {
  return new Date(`${toDateKey(isoDate)}T00:00:00Z`);
}

export function countWorkingDays(startDate: string, endDate: string): number {
  const end = utcMidnight(endDate);
  let workingDays = 0;
  for (let day = utcMidnight(startDate); day <= end; day.setUTCDate(day.getUTCDate() + 1)) {
    const weekday = day.getUTCDay();
    if (weekday !== 0 && weekday !== 6) {
      workingDays += 1;
    }
  }
  return workingDays;
}

export function daysUntil(isoDate: string, today: Date = new Date()): number {
  const millisecondsPerDay = 86_400_000;
  const todayKey = today.toISOString().slice(0, 10);
  return Math.round((utcMidnight(isoDate).getTime() - utcMidnight(todayKey).getTime()) / millisecondsPerDay);
}

export function monthShort(isoDate: string): string {
  return monthShortFormatter.format(new Date(isoDate));
}

export function dayOfMonth(isoDate: string): number {
  return new Date(isoDate).getUTCDate();
}

const timestampFormatter = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
  timeZone: 'UTC',
  timeZoneName: 'short'
});

export function formatTimestamp(isoDateTime: string): string {
  return timestampFormatter.format(new Date(isoDateTime));
}
