import type { Metadata } from 'next';
import Link from 'next/link';
import { EmployeeListItem, VacationRequest, VacationStatus } from '@vacation/shared';
import { PageHeader } from '@/components/layout/page-header';
import { PageShell } from '@/components/layout/page-shell';
import { RequestReviewCard } from '@/components/requests/request-review-card';
import { overlappingTeammates } from '@/lib/absences';
import { fetchEmployees, fetchVacations } from '@/lib/api';
import { requireAdmin, requireToken } from '@/lib/auth';
import { cn } from '@/lib/utils';

type StatusFilter = VacationStatus | 'ALL';

const statusFilters: { value: StatusFilter; label: string }[] = [
  { value: 'PENDING', label: 'Pending' },
  { value: 'APPROVED', label: 'Approved' },
  { value: 'REJECTED', label: 'Rejected' },
  { value: 'ALL', label: 'All' }
];

const emptyMessages: Record<StatusFilter, { title: string; text: string }> = {
  PENDING: { title: 'All caught up', text: 'No requests are waiting for approval.' },
  APPROVED: { title: 'Nothing approved yet', text: 'Approved requests will show up here.' },
  REJECTED: { title: 'No rejections', text: 'Rejected requests will show up here.' },
  ALL: { title: 'No requests yet', text: 'Requests appear here as soon as employees submit them.' }
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

function remainingDaysByEmployee(employees: EmployeeListItem[]): Map<string, number> {
  return new Map(
    employees.map((employee) => [employee.id, employee.vacationDaysTotal - employee.vacationDaysUsed])
  );
}

export const metadata: Metadata = { title: 'Approvals' };

export default async function AdminRequestsPage({ searchParams }: AdminRequestsPageProps) {
  const user = await requireAdmin();
  const token = requireToken();
  const [requests, employees] = await Promise.all([fetchVacations(token), fetchEmployees(token)]);
  const activeFilter = parseStatusFilter(searchParams.status);
  const visibleRequests = selectRequests(requests, activeFilter);
  const remainingDays = remainingDaysByEmployee(employees);

  return (
    <PageShell user={user}>
      <PageHeader title="Approval queue" description="Oldest requests first. Open one to approve or reject it." />
      <nav aria-label="Filter requests by status" className="flex flex-wrap gap-2">
        {statusFilters.map((filter) => {
          const isActive = filter.value === activeFilter;
          return (
            <Link
              key={filter.value}
              href={`/admin/requests?status=${filter.value}`}
              aria-current={isActive ? 'page' : undefined}
              className={cn(
                'inline-flex min-h-11 items-center gap-1 rounded-xl border px-4 text-sm font-semibold transition-colors',
                isActive
                  ? 'border-primary bg-primary text-white'
                  : 'border-border bg-card hover:bg-muted'
              )}
            >
              {filter.label}
              <span className="opacity-80">({countByFilter(requests, filter.value)})</span>
            </Link>
          );
        })}
      </nav>
      {visibleRequests.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-input bg-card px-6 py-12 text-center">
          <p className="font-display text-xl font-semibold">{emptyMessages[activeFilter].title}</p>
          <p className="mt-1 text-muted-foreground">{emptyMessages[activeFilter].text}</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3.5">
          {visibleRequests.map((request) => (
            <RequestReviewCard
              key={request.id}
              request={request}
              remainingDays={remainingDays.get(request.userId) ?? null}
              overlappingTeammates={
                request.status === 'PENDING' ? overlappingTeammates(request, requests) : []
              }
            />
          ))}
        </div>
      )}
    </PageShell>
  );
}
