import { VacationRequest } from '@vacation/shared';
import { CancelRequestForm } from '@/components/requests/cancel-request-form';
import { StatusBadge } from '@/components/ui/badge';
import { canCancel, todayKey } from '@/lib/absences';
import { formatDateRange } from '@/lib/dates';
import { absenceTypeLabels } from '@/lib/labels';
import { plural } from '@/lib/people';

export function RequestList({ requests }: { requests: VacationRequest[] }) {
  const today = todayKey();

  return (
    <ul>
      {requests.map((request) => (
        <li
          key={request.id}
          className="flex flex-wrap items-start gap-x-6 gap-y-3 border-b border-border px-6 py-4 last:border-b-0"
        >
          <div className="min-w-0 flex-[1_1_260px]">
            <p className="font-semibold">{formatDateRange(request.startDate, request.endDate)}</p>
            <p className="text-sm text-muted-foreground">
              {absenceTypeLabels[request.absenceType]} · {request.reason} ·{' '}
              {plural(request.workingDays, 'working day')}
            </p>
            {request.adminComment ? (
              <p className="mt-1.5 text-sm">Admin: “{request.adminComment}”</p>
            ) : null}
            {canCancel(request, today) ? (
              <div className="mt-1.5">
                <CancelRequestForm
                  requestId={request.id}
                  refundsDays={request.status === 'APPROVED' && request.absenceType === 'VACATION'}
                />
              </div>
            ) : null}
          </div>
          <StatusBadge status={request.status} />
        </li>
      ))}
    </ul>
  );
}
