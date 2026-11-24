import { VacationRequest } from '@vacation/shared';
import { coversDate, isActiveAbsence, overlapsRange, todayKey, workWeekKeys } from '@/lib/absences';
import { requesterName } from '@/lib/people';

const weekdayFormatter = new Intl.DateTimeFormat('en-GB', {
  weekday: 'short',
  day: 'numeric',
  timeZone: 'UTC'
});

type DayKind = 'sick' | 'vacation' | 'pending';

interface WeekSegment {
  kind: DayKind | null;
  span: number;
}

interface PersonRow {
  userId: string;
  name: string;
  segments: WeekSegment[];
}

const kindPriority: DayKind[] = ['sick', 'vacation', 'pending'];

const kindStyles: Record<DayKind, { label: string; className: string }> = {
  sick: { label: 'Sick leave', className: 'bg-sick-soft text-sick' },
  vacation: { label: 'Vacation', className: 'bg-primary text-white' },
  pending: { label: 'Pending', className: 'border-2 border-dashed border-warning bg-warning-soft text-warning' }
};

function kindOf(request: VacationRequest): DayKind {
  if (request.absenceType === 'SICK') {
    return 'sick';
  }
  return request.status === 'PENDING' ? 'pending' : 'vacation';
}

function dayKind(requests: VacationRequest[], dateKey: string): DayKind | null {
  const kinds = new Set(requests.filter((request) => coversDate(request, dateKey)).map(kindOf));
  return kindPriority.find((kind) => kinds.has(kind)) ?? null;
}

function toSegments(requests: VacationRequest[], weekKeys: string[]): WeekSegment[] {
  return weekKeys.reduce<WeekSegment[]>((segments, key) => {
    const kind = dayKind(requests, key);
    const last = segments[segments.length - 1];
    if (last && last.kind === kind) {
      last.span += 1;
      return segments;
    }
    return [...segments, { kind, span: 1 }];
  }, []);
}

function toPersonRows(requests: VacationRequest[], weekKeys: string[]): PersonRow[] {
  const firstKey = weekKeys[0];
  const lastKey = weekKeys[weekKeys.length - 1];
  const byPerson = new Map<string, VacationRequest[]>();
  requests
    .filter((request) => isActiveAbsence(request.status) && overlapsRange(request, firstKey, lastKey))
    .forEach((request) => {
      byPerson.set(request.userId, [...(byPerson.get(request.userId) ?? []), request]);
    });

  return Array.from(byPerson, ([userId, personRequests]) => ({
    userId,
    name: requesterName(personRequests[0]),
    firstDay: personRequests.map((request) => request.startDate).sort()[0],
    segments: toSegments(personRequests, weekKeys)
  }))
    .sort((a, b) => a.firstDay.localeCompare(b.firstDay) || a.name.localeCompare(b.name))
    .map(({ userId, name, segments }) => ({ userId, name, segments }));
}

function LegendSwatch({ className, label }: { className: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span aria-hidden="true" className={`h-3 w-3 rounded-[3px] ${className}`} />
      {label}
    </span>
  );
}

export function WeekAbsences({ requests }: { requests: VacationRequest[] }) {
  const weekKeys = workWeekKeys();
  const today = todayKey();
  const rows = toPersonRows(requests, weekKeys);

  return (
    <section aria-labelledby="week-title" className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="week-title" className="font-display text-[17px] font-semibold">
          Who&apos;s out this week
        </h2>
        <div className="flex flex-wrap gap-4 text-[13px]">
          <LegendSwatch className="bg-primary" label="Vacation" />
          <LegendSwatch className="bg-sick-soft ring-1 ring-sick" label="Sick leave" />
          <LegendSwatch className="border-2 border-dashed border-warning" label="Pending" />
        </div>
      </div>
      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">Everyone is in this week.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] border-separate border-spacing-y-1.5 text-sm">
            <thead>
              <tr className="text-left text-[13px] text-muted-foreground">
                <th scope="col" className="w-48 pb-1 pr-2 font-semibold">
                  Person
                </th>
                {weekKeys.map((key) => (
                  <th
                    key={key}
                    scope="col"
                    className={`px-1 pb-1 font-semibold ${key === today ? 'text-primary-text' : ''}`}
                  >
                    {weekdayFormatter.format(new Date(`${key}T00:00:00Z`))}
                    {key === today ? ' · today' : ''}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.userId}>
                  <th scope="row" className="pr-2 text-left font-semibold">
                    {row.name}
                  </th>
                  {row.segments.map((segment, index) => (
                    <td key={index} colSpan={segment.span} className="px-1">
                      {segment.kind ? (
                        <div
                          className={`flex h-[34px] items-center rounded-[9px] px-3 text-[13px] font-semibold ${kindStyles[segment.kind].className}`}
                        >
                          {kindStyles[segment.kind].label}
                        </div>
                      ) : null}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
