import { VacationRequest } from '@vacation/shared';
import { StatusBadge } from '@/components/ui/badge';
import { countWorkingDays, formatDateRange } from '@/lib/dates';
import { absenceTypeLabels } from '@/lib/labels';

function workingDaysLabel(request: VacationRequest): string {
  const days = countWorkingDays(request.startDate, request.endDate);
  return days === 1 ? '1 working day' : `${days} working days`;
}

export function RequestList({ requests }: { requests: VacationRequest[] }) {
  return (
    <ul>
      {requests.map((request) => (
        <li
          key={request.id}
          className="flex flex-wrap items-center gap-x-6 gap-y-3 border-b border-border px-6 py-4 last:border-b-0"
        >
          <div className="min-w-0 flex-[1_1_260px]">
            <p className="font-semibold">{formatDateRange(request.startDate, request.endDate)}</p>
            <p className="text-sm text-muted-foreground">
              {absenceTypeLabels[request.absenceType]} · {request.reason} · {workingDaysLabel(request)}
            </p>
            {request.adminComment ? (
              <p className="mt-1.5 text-sm">Admin: “{request.adminComment}”</p>
            ) : null}
          </div>
          <StatusBadge status={request.status} />
        </li>
      ))}
    </ul>
  );
}
