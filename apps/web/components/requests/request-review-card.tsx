import { VacationRequest, VacationStatus } from '@vacation/shared';
import { ModerateRequestForm } from '@/components/forms/moderate-request-form';
import { Avatar } from '@/components/ui/avatar';
import { StatusBadge } from '@/components/ui/badge';
import { daysSince } from '@/lib/absences';
import { formatDate, formatDateRange } from '@/lib/dates';
import { absenceTypeLabels } from '@/lib/labels';
import { fullName, plural, requesterName } from '@/lib/people';

interface RequestReviewCardProps {
  request: VacationRequest;
  remainingDays: number | null;
  overlappingTeammates: string[];
}

const headerClassName = 'flex flex-wrap items-center gap-x-5 gap-y-3 px-6 py-5';

function sentLabel(request: VacationRequest): string {
  const days = daysSince(request.createdAt);
  if (days === 0) {
    return 'Sent today';
  }
  return days === 1 ? 'Sent yesterday' : `Sent ${days} days ago`;
}

const decisionVerbs: Record<Exclude<VacationStatus, 'PENDING'>, string> = {
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  CANCELLED: 'Cancelled by employee'
};

function statusDetail(request: VacationRequest): string {
  if (request.status === 'PENDING') {
    return sentLabel(request);
  }
  return `${decisionVerbs[request.status]} ${formatDate(request.updatedAt)}`;
}

function RequestSummary({ request }: { request: VacationRequest }) {
  const isPending = request.status === 'PENDING';

  return (
    <>
      <Avatar
        firstName={request.user?.firstName ?? '?'}
        lastName={request.user?.lastName ?? ''}
        seed={request.userId}
        size="lg"
      />
      <div className="min-w-0 flex-[1_1_240px]">
        <h2 className="text-base font-semibold">
          {requesterName(request)}
          {request.user?.department ? (
            <span className="font-normal text-muted-foreground"> · {request.user.department}</span>
          ) : null}
        </h2>
        <p className="text-sm">
          {formatDateRange(request.startDate, request.endDate)} ·{' '}
          <strong className="font-semibold">
            {plural(request.workingDays, 'working day')}
          </strong>{' '}
          · {absenceTypeLabels[request.absenceType]}
        </p>
        <p className="text-sm text-muted-foreground">“{request.reason}”</p>
        {request.coverUser ? (
          <p className="text-sm">
            Cover: <span className="font-semibold">{fullName(request.coverUser)}</span>
          </p>
        ) : null}
        {!isPending && request.adminComment ? (
          <p className="mt-1 text-sm">Admin: “{request.adminComment}”</p>
        ) : null}
      </div>
      <div className="flex flex-col items-end gap-1.5">
        <StatusBadge status={request.status} />
        <span className="text-[13px] text-muted-foreground">
          {statusDetail(request)}
        </span>
      </div>
    </>
  );
}

function ReviewPanel({ request, remainingDays, overlappingTeammates }: RequestReviewCardProps) {
  const workingDays = request.workingDays;

  return (
    <div className="flex flex-col gap-3 border-t border-border bg-muted/50 px-6 py-5">
      <dl className="flex flex-wrap gap-x-6 gap-y-1 text-sm">
        {remainingDays === null ? null : (
          <div className="flex gap-1">
            <dt className="text-muted-foreground">Balance after approval:</dt>
            <dd className="font-semibold">{plural(remainingDays - workingDays, 'day')}</dd>
          </div>
        )}
        <div className="flex gap-1">
          <dt className="text-muted-foreground">Team out on these dates:</dt>
          <dd className="font-semibold">
            {overlappingTeammates.length === 0 ? 'nobody' : overlappingTeammates.join(', ')}
          </dd>
        </div>
      </dl>
      <ModerateRequestForm
        requestId={request.id}
        employeeFirstName={request.user?.firstName ?? 'the employee'}
      />
    </div>
  );
}

export function RequestReviewCard({ request, remainingDays, overlappingTeammates }: RequestReviewCardProps) {
  if (request.status !== 'PENDING') {
    return (
      <article className="overflow-hidden rounded-2xl border border-border bg-card">
        <div className={headerClassName}>
          <RequestSummary request={request} />
        </div>
      </article>
    );
  }

  return (
    <article className="overflow-hidden rounded-2xl border border-border bg-card">
      <details className="group">
        <summary className={`${headerClassName} cursor-pointer list-none [&::-webkit-details-marker]:hidden`}>
          <RequestSummary request={request} />
          <span className="inline-flex min-h-11 items-center rounded-xl border border-input px-4 text-sm font-semibold group-hover:bg-muted">
            <span className="group-open:hidden">Review</span>
            <span className="hidden group-open:inline">Close</span>
          </span>
        </summary>
        <ReviewPanel
          request={request}
          remainingDays={remainingDays}
          overlappingTeammates={overlappingTeammates}
        />
      </details>
      {overlappingTeammates.length > 0 ? (
        <p className="border-t border-border bg-danger-soft px-6 py-2.5 text-sm text-danger">
          Overlaps with {overlappingTeammates.join(' and ')} from the same department.
        </p>
      ) : null}
    </article>
  );
}
