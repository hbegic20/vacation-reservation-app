import { AbsenceType, VacationCalendarRequestItem, VacationStatus } from '@vacation/shared';
import { isActiveAbsence } from '@/lib/absences';
import { formatLongDate } from '@/lib/dates';
import { fullName } from '@/lib/people';

export type DayRequests = VacationCalendarRequestItem[];

export type AbsenceKind = 'sick' | 'vacation' | 'pending';

type EntryKind = AbsenceKind | 'away';

export interface CalendarEntry {
  id: string;
  label: string;
  description: string;
  kind: EntryKind;
}

const kindPriority: AbsenceKind[] = ['sick', 'vacation', 'pending'];

export const kindStyles: Record<EntryKind, { label: string; pill: string; dot: string }> = {
  away: { label: 'away', pill: 'bg-muted text-foreground ring-1 ring-inset ring-input', dot: 'bg-muted-foreground' },
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

export function kindOf(request: { absenceType: AbsenceType; status: VacationStatus }): AbsenceKind {
  if (request.absenceType === 'SICK') {
    return 'sick';
  }
  return request.status === 'PENDING' ? 'pending' : 'vacation';
}

export function dominantKind(requests: DayRequests): AbsenceKind | null {
  const kinds = new Set(activeRequests(requests).map(kindOf));
  return kindPriority.find((kind) => kinds.has(kind)) ?? null;
}

function shortName(request: VacationCalendarRequestItem): string {
  return `${request.user.firstName} ${request.user.lastName.charAt(0)}.`;
}

export function entriesFromRequests(requests: DayRequests): CalendarEntry[] {
  return activeRequests(requests).map((request) => {
    const kind = kindOf(request);
    return {
      id: request.id,
      label: shortName(request),
      description: `${fullName(request.user)} (${kindStyles[kind].label})`,
      kind
    };
  });
}

export function describeEntries(key: string, entries: CalendarEntry[], holidayName: string | undefined): string {
  const parts: string[] = [];
  if (holidayName) {
    parts.push(`public holiday, ${holidayName}`);
  }
  parts.push(entries.length === 0 ? 'nobody off' : entries.map((entry) => entry.description).join(', '));
  return `${formatLongDate(key)}: ${parts.join('; ')}`;
}

export function describeDay(key: string, requests: DayRequests, holidayName: string | undefined): string {
  return describeEntries(key, entriesFromRequests(requests), holidayName);
}
