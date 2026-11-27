import { isWeekendKey } from './dates';

export const weekdayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const monthFormatter = new Intl.DateTimeFormat('en-GB', { month: 'long', timeZone: 'UTC' });
const monthYearFormatter = new Intl.DateTimeFormat('en-GB', { month: 'long', year: 'numeric', timeZone: 'UTC' });

export interface CalendarCell {
  key: string;
  day: number;
  isWeekend: boolean;
}

export interface MonthRef {
  year: number;
  monthIndex: number;
}

export function monthCells({ year, monthIndex }: MonthRef): (CalendarCell | null)[] {
  const first = new Date(Date.UTC(year, monthIndex, 1));
  const daysInMonth = new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();
  const leadingBlanks = (first.getUTCDay() + 6) % 7;
  const cells: (CalendarCell | null)[] = Array.from({ length: leadingBlanks }, () => null);
  for (let day = 1; day <= daysInMonth; day += 1) {
    const key = new Date(Date.UTC(year, monthIndex, day)).toISOString().slice(0, 10);
    cells.push({ key, day, isWeekend: isWeekendKey(key) });
  }
  return cells;
}

export function monthName({ year, monthIndex }: MonthRef): string {
  return monthFormatter.format(new Date(Date.UTC(year, monthIndex, 1)));
}

export function monthYearLabel({ year, monthIndex }: MonthRef): string {
  return monthYearFormatter.format(new Date(Date.UTC(year, monthIndex, 1)));
}

export function addMonths({ year, monthIndex }: MonthRef, count: number): MonthRef {
  const date = new Date(Date.UTC(year, monthIndex + count, 1));
  return { year: date.getUTCFullYear(), monthIndex: date.getUTCMonth() };
}

export function monthOf(dateKey: string): MonthRef {
  return { year: Number(dateKey.slice(0, 4)), monthIndex: Number(dateKey.slice(5, 7)) - 1 };
}

export function addDays(dateKey: string, count: number): string {
  const date = new Date(`${dateKey}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + count);
  return date.toISOString().slice(0, 10);
}

export function compareMonths(a: MonthRef, b: MonthRef): number {
  return a.year * 12 + a.monthIndex - (b.year * 12 + b.monthIndex);
}

export function monthQuery({ year, monthIndex }: MonthRef): string {
  return `${year}-${String(monthIndex + 1).padStart(2, '0')}`;
}

export function parseMonthQuery(value: string | undefined): MonthRef | null {
  const match = /^(\d{4})-(\d{2})$/.exec(value ?? '');
  if (!match) {
    return null;
  }
  const monthIndex = Number(match[2]) - 1;
  return monthIndex >= 0 && monthIndex <= 11 ? { year: Number(match[1]), monthIndex } : null;
}
