import { StatusBadge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import { formatDateRange, formatLongDate } from '@/lib/dates';
import { absenceTypeLabels } from '@/lib/labels';
import { plural } from '@/lib/people';
import { DayRequests } from './calendar-day';

interface DayDetailsProps {
  selectedDate: string;
  requests: DayRequests;
  holidayName: string | undefined;
}

export function DayDetails({ selectedDate, requests, holidayName }: DayDetailsProps) {
  return (
    <>
      <p className="font-display text-base font-semibold">{formatLongDate(selectedDate)}</p>
      {holidayName ? (
        <p className="rounded-xl bg-sick-soft px-3.5 py-2.5 text-sm text-sick">
          Public holiday: <span className="font-semibold">{holidayName}</span>
        </p>
      ) : null}
      {requests.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nobody is off on this day.</p>
      ) : (
        <ul className="flex flex-col gap-2.5">
          {requests.map((request) => (
            <li key={request.id} className="flex flex-col gap-2 rounded-xl bg-muted p-3.5 text-sm">
              <div className="flex items-start gap-3">
                <Avatar firstName={request.user.firstName} lastName={request.user.lastName} seed={request.userId} />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">
                    {request.user.firstName} {request.user.lastName}
                  </p>
                  <p className="text-[13px] text-muted-foreground">
                    {request.user.department ?? 'No department'}
                  </p>
                </div>
                <StatusBadge status={request.status} />
              </div>
              <p>
                {absenceTypeLabels[request.absenceType]} · {formatDateRange(request.startDate, request.endDate)} ·{' '}
                {plural(request.workingDays, 'working day')}
              </p>
              <p className="text-muted-foreground">“{request.reason}”</p>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
