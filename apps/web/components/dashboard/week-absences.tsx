import { VacationRequest } from '@vacation/shared';
import { isActiveAbsence, overlapsRange, todayKey, workWeekKeys } from '@/lib/absences';
import { toDateKey } from '@/lib/dates';
import { absenceTypeLabels } from '@/lib/labels';
import { requesterName } from '@/lib/people';

const weekdayFormatter = new Intl.DateTimeFormat('en-GB', {
  weekday: 'short',
  day: 'numeric',
  timeZone: 'UTC'
});

interface WeekRow {
  request: VacationRequest;
  startIndex: number;
  endIndex: number;
}

function toWeekRows(requests: VacationRequest[], weekKeys: string[]): WeekRow[] {
  const firstKey = weekKeys[0];
  const lastKey = weekKeys[weekKeys.length - 1];
  return requests
    .filter((request) => isActiveAbsence(request.status) && overlapsRange(request, firstKey, lastKey))
    .sort((a, b) => a.startDate.localeCompare(b.startDate))
    .map((request) => {
      const startKey = toDateKey(request.startDate);
      const endKey = toDateKey(request.endDate);
      const startIndex = weekKeys.findIndex((key) => key >= startKey);
      const endIndex = weekKeys.reduce((last, key, index) => (key <= endKey ? index : last), 0);
      return { request, startIndex, endIndex };
    });
}

function barClassName(request: VacationRequest): string {
  if (request.status === 'PENDING') {
    return 'border-2 border-dashed border-warning bg-warning-soft text-warning';
  }
  return request.absenceType === 'SICK' ? 'bg-sick-soft text-sick' : 'bg-primary text-white';
}

function barLabel(request: VacationRequest): string {
  return request.status === 'PENDING' ? 'Pending' : absenceTypeLabels[request.absenceType];
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
  const rows = toWeekRows(requests, weekKeys);

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
              {rows.map(({ request, startIndex, endIndex }) => (
                <tr key={request.id}>
                  <th scope="row" className="pr-2 text-left font-semibold">
                    {requesterName(request)}
                  </th>
                  {startIndex > 0 ? <td colSpan={startIndex} /> : null}
                  <td colSpan={endIndex - startIndex + 1} className="px-1">
                    <div
                      className={`flex h-[34px] items-center rounded-[9px] px-3 text-[13px] font-semibold ${barClassName(request)}`}
                    >
                      {barLabel(request)}
                    </div>
                  </td>
                  {endIndex < weekKeys.length - 1 ? <td colSpan={weekKeys.length - 1 - endIndex} /> : null}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
