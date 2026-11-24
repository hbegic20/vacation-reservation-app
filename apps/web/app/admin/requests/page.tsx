import Link from 'next/link';
import { VacationRequest, VacationStatus } from '@vacation/shared';
import { TopNav } from '@/components/layout/top-nav';
import { ReviewRequestModal } from '@/components/forms/review-request-modal';
import { StatusBadge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { fetchVacations } from '@/lib/api';
import { requireAdmin, requireToken } from '@/lib/auth';
import { formatDateRange } from '@/lib/dates';
import { cn } from '@/lib/utils';

type StatusFilter = VacationStatus | 'ALL';

const statusFilters: { value: StatusFilter; label: string }[] = [
  { value: 'PENDING', label: 'Pending' },
  { value: 'APPROVED', label: 'Approved' },
  { value: 'REJECTED', label: 'Rejected' },
  { value: 'ALL', label: 'All' }
];

const emptyMessages: Record<StatusFilter, string> = {
  PENDING: 'No requests are waiting for approval.',
  APPROVED: 'No approved requests yet.',
  REJECTED: 'No rejected requests.',
  ALL: 'No requests have been submitted yet.'
};

interface AdminRequestsPageProps {
  searchParams: {
    status?: string;
  };
}

function parseStatusFilter(value: string | undefined): StatusFilter {
  return statusFilters.find((filter) => filter.value === value)?.value ?? 'PENDING';
}

function countByFilter(requests: VacationRequest[], filter: StatusFilter): number {
  return filter === 'ALL'
    ? requests.length
    : requests.filter((request) => request.status === filter).length;
}

function selectRequests(requests: VacationRequest[], filter: StatusFilter): VacationRequest[] {
  if (filter === 'PENDING') {
    return requests
      .filter((request) => request.status === 'PENDING')
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  }

  return requests
    .filter((request) => filter === 'ALL' || request.status === filter)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

function requesterName(request: VacationRequest): string {
  return request.user ? `${request.user.firstName} ${request.user.lastName}` : request.userId;
}

export default async function AdminRequestsPage({ searchParams }: AdminRequestsPageProps) {
  const user = await requireAdmin();
  const token = requireToken();
  const requests = await fetchVacations(token);
  const activeFilter = parseStatusFilter(searchParams.status);
  const visibleRequests = selectRequests(requests, activeFilter);

  return (
    <div>
      <TopNav user={user} />
      <main className="mx-auto max-w-6xl space-y-6 p-4 md:p-6">
        <h1 className="text-2xl font-bold">Approval Queue</h1>
        <nav aria-label="Filter requests by status" className="flex flex-wrap gap-2">
          {statusFilters.map((filter) => {
            const isActive = filter.value === activeFilter;
            return (
              <Link
                key={filter.value}
                href={`/admin/requests?status=${filter.value}`}
                aria-current={isActive ? 'page' : undefined}
                className={cn(
                  'rounded-xl border px-4 py-2 text-sm font-semibold transition-colors',
                  isActive
                    ? 'border-primary bg-primary text-white'
                    : 'border-border bg-card hover:bg-muted/70'
                )}
              >
                {filter.label} ({countByFilter(requests, filter.value)})
              </Link>
            );
          })}
        </nav>
        <div className="grid gap-4">
          {visibleRequests.length === 0 ? (
            <Card>
              <p className="text-sm text-muted-foreground">{emptyMessages[activeFilter]}</p>
            </Card>
          ) : null}
          {visibleRequests.map((request) => (
            <Card key={request.id} className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold">{requesterName(request)}</p>
                  {request.user ? (
                    <p className="text-xs text-muted-foreground">
                      {request.user.email}
                      {request.user.department ? ` · ${request.user.department}` : ''}
                    </p>
                  ) : null}
                  <p className="text-sm text-muted-foreground">
                    {formatDateRange(request.startDate, request.endDate)}
                  </p>
                </div>
                <StatusBadge status={request.status} />
              </div>
              <p className="text-sm">
                {request.absenceType} · {request.reason}
              </p>
              {request.status === 'PENDING' ? (
                <ReviewRequestModal
                  requestId={request.id}
                  title={requesterName(request)}
                  subtitle={formatDateRange(request.startDate, request.endDate)}
                />
              ) : (
                <p className="text-sm text-muted-foreground">
                  {request.adminComment || 'No admin comment provided.'}
                </p>
              )}
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
}
