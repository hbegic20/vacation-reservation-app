import { VacationCalendarRequestItem } from '@vacation/shared';
import { isActiveAbsence } from '@/lib/absences';
import { formatLongDate } from '@/lib/dates';

export type DayRequests = VacationCalendarRequestItem[];

export type AbsenceKind = 'sick' | 'vacation' | 'pending';

const kindPriority: AbsenceKind[] = ['sick', 'vacation', 'pending'];

export const kindStyles: Record<AbsenceKind, { label: string; pill: string; dot: string }> = {
  vacation: { label: 'vacation', pill: 'bg-primary text-white', dot: 'bg-primary' },
  sick: { label: 'sick leave', pill: 'bg-sick-soft text-sick ring-1 ring-inset ring-sick/60', dot: 'bg-sick' },
  pending: {
    label: 'pending',
    pill: 'border border-dashed border-warning bg-warning-soft text-warning',
    dot: 'bg-warning'
  }
};

export function activeRequests(requests: DayRequests): DayRequests {
  return requests.filter((request) => isActiveAbsence(request.status));
}

export function kindOf(request: VacationCalendarRequestItem): AbsenceKind {
  if (request.absenceType === 'SICK') {
    return 'sick';
  }
  return request.status === 'PENDING' ? 'pending' : 'vacation';
}

export function dominantKind(requests: DayRequests): AbsenceKind | null {
  const kinds = new Set(activeRequests(requests).map(kindOf));
  return kindPriority.find((kind) => kinds.has(kind)) ?? null;
}

export function shortName(request: VacationCalendarRequestItem): string {
  return `${request.user.firstName} ${request.user.lastName.charAt(0)}.`;
}

export function describeDay(key: string, requests: DayRequests, holidayName: string | undefined): string {
  const parts: string[] = [];
  if (holidayName) {
    parts.push(`public holiday, ${holidayName}`);
  }
  const people = activeRequests(requests).map(
    (request) => `${request.user.firstName} ${request.user.lastName} (${kindStyles[kindOf(request)].label})`
  );
  parts.push(people.length === 0 ? 'nobody off' : people.join(', '));
  return `${formatLongDate(key)}: ${parts.join('; ')}`;
}
