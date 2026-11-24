import Link from 'next/link';
import { VacationRequest } from '@vacation/shared';
import { Avatar } from '@/components/ui/avatar';
import { buttonStyles } from '@/components/ui/button';
import { daysSince, overlappingTeammates } from '@/lib/absences';
import { formatDateRange } from '@/lib/dates';
import { plural, requesterName } from '@/lib/people';

const previewLimit = 3;

function sentLabel(request: VacationRequest): string {
  const days = daysSince(request.createdAt);
  if (days === 0) {
    return 'Sent today';
  }
  return days === 1 ? 'Sent yesterday' : `Sent ${days} days ago`;
}

interface PendingApprovalsCardProps {
  pending: VacationRequest[];
  allRequests: VacationRequest[];
}

export function PendingApprovalsCard({ pending, allRequests }: PendingApprovalsCardProps) {
  if (pending.length === 0) {
    return (
      <section aria-labelledby="pending-title" className="rounded-2xl border border-border bg-card p-6">
        <h2 id="pending-title" className="font-display text-[22px] font-semibold">
          All caught up
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">No requests are waiting for approval.</p>
      </section>
    );
  }

  const oldestWait = daysSince(pending[0].createdAt);

  return (
    <section aria-labelledby="pending-title" className="overflow-hidden rounded-2xl border border-border bg-card">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-warning-soft px-6 py-5">
        <div>
          <h2 id="pending-title" className="font-display text-[22px] font-semibold">
            {plural(pending.length, 'request')} waiting for you
          </h2>
          <p className="text-sm text-foreground">
            {oldestWait === 0
              ? 'The oldest one arrived today.'
              : `The oldest one has been waiting ${plural(oldestWait, 'day')}.`}
          </p>
        </div>
        <Link href="/admin/requests" className={buttonStyles()}>
          Review queue
        </Link>
      </div>
      <ul>
        {pending.slice(0, previewLimit).map((request) => {
          const teammates = overlappingTeammates(request, allRequests);
          return (
            <li
              key={request.id}
              className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-border px-6 py-3.5 last:border-b-0"
            >
              <Avatar
                firstName={request.user?.firstName ?? '?'}
                lastName={request.user?.lastName ?? ''}
                seed={request.userId}
              />
              <div className="min-w-0 flex-[1_1_220px]">
                <p className="font-semibold">
                  {requesterName(request)}
                  {request.user?.department ? (
                    <span className="font-normal text-muted-foreground"> · {request.user.department}</span>
                  ) : null}
                </p>
                <p className="text-sm text-muted-foreground">
                  {formatDateRange(request.startDate, request.endDate)} ·{' '}
                  {plural(request.workingDays, 'working day')}
                </p>
              </div>
              {teammates.length > 0 ? (
                <span className="text-[13px] font-semibold text-danger">
                  Overlaps with {plural(teammates.length, 'teammate')}
                </span>
              ) : (
                <span className="text-[13px] text-muted-foreground">{sentLabel(request)}</span>
              )}
            </li>
          );
        })}
      </ul>
      {pending.length > previewLimit ? (
        <p className="border-t border-border px-6 py-3 text-sm text-muted-foreground">
          And {plural(pending.length - previewLimit, 'more request')} in the queue.
        </p>
      ) : null}
    </section>
  );
}
