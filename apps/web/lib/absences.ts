import { VacationRequest } from '@vacation/shared';
import { toDateKey } from './dates';

const millisecondsPerDay = 86_400_000;

export function coversDate(request: VacationRequest, dateKey: string): boolean {
  return toDateKey(request.startDate) <= dateKey && dateKey <= toDateKey(request.endDate);
}

export function overlapsRange(request: VacationRequest, startKey: string, endKey: string): boolean {
  return toDateKey(request.startDate) <= endKey && startKey <= toDateKey(request.endDate);
}

export function todayKey(today: Date = new Date()): string {
  return today.toISOString().slice(0, 10);
}

export function workWeekKeys(today: Date = new Date()): string[] {
  const monday = new Date(`${todayKey(today)}T00:00:00Z`);
  const daysSinceMonday = (monday.getUTCDay() + 6) % 7;
  monday.setUTCDate(monday.getUTCDate() - daysSinceMonday);
  return Array.from({ length: 5 }, (_, index) =>
    new Date(monday.getTime() + index * millisecondsPerDay).toISOString().slice(0, 10)
  );
}

export function daysSince(isoDate: string, today: Date = new Date()): number {
  const start = new Date(`${toDateKey(isoDate)}T00:00:00Z`).getTime();
  const end = new Date(`${todayKey(today)}T00:00:00Z`).getTime();
  return Math.max(Math.round((end - start) / millisecondsPerDay), 0);
}

export function overlappingTeammates(request: VacationRequest, requests: VacationRequest[]): string[] {
  const department = request.user?.department;
  if (!department) {
    return [];
  }

  const names = requests
    .filter(
      (other) =>
        other.userId !== request.userId &&
        other.status === 'APPROVED' &&
        other.user?.department === department &&
        overlapsRange(other, toDateKey(request.startDate), toDateKey(request.endDate))
    )
    .map((other) => (other.user ? `${other.user.firstName} ${other.user.lastName}` : other.userId));

  return Array.from(new Set(names));
}
