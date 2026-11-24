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
