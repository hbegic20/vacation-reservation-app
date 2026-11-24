import { AnimatedReveal } from '@/components/layout/animated-reveal';
import { AdminNotifications } from '@/components/dashboard/admin-notifications';
import { TopNav } from '@/components/layout/top-nav';
import { VacationCalendar } from '@/components/calendar/vacation-calendar';
import { Card } from '@/components/ui/card';
import { StatusBadge } from '@/components/ui/badge';
import {
  fetchAdminNotifications,
  fetchAdminUnreadNotificationCount,
  fetchApprovedVacations,
  fetchSummary
} from '@/lib/api';
import { requireToken, requireUser } from '@/lib/auth';
import { AdminSummaryResponse, EmployeeSummaryResponse } from '@vacation/shared';
import { formatDateRange } from '@/lib/dates';

export default async function DashboardPage() {
  const user = await requireUser();
  const token = requireToken();
  const summary = await fetchSummary(token);

  return (
    <div>
      <TopNav user={user} />
      <main className="mx-auto grid max-w-6xl gap-6 p-4 md:p-6">
        <AnimatedReveal>
          <h1 className="text-2xl font-bold">Dashboard</h1>
        </AnimatedReveal>

        {user.role === 'ADMIN' ? (
          <AdminDashboard summary={summary as AdminSummaryResponse} token={token} />
        ) : (
          <EmployeeDashboard summary={summary as EmployeeSummaryResponse} />
        )}
      </main>
    </div>
  );
}

async function AdminDashboard({
  summary,
  token
}: {
  summary: AdminSummaryResponse;
  token: string;
}) {
  const [approved, notifications, unread] = await Promise.all([
    fetchApprovedVacations(token),
    fetchAdminNotifications(token),
    fetchAdminUnreadNotificationCount(token)
  ]);

  return (
    <div className="grid gap-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <p className="text-sm text-muted-foreground">Pending approvals</p>
          <p className="mt-2 text-3xl font-bold">{summary.pendingApprovals}</p>
        </Card>
        <Card>
          <p className="text-sm text-muted-foreground">Approved requests</p>
          <p className="mt-2 text-3xl font-bold">{summary.approvedRequests}</p>
        </Card>
        <Card>
          <p className="text-sm text-muted-foreground">Employees</p>
          <p className="mt-2 text-3xl font-bold">{summary.employees}</p>
        </Card>
      </div>
      <AdminNotifications notifications={notifications} unreadCount={unread.unread} />
      <VacationCalendar vacations={approved} />
    </div>
  );
}

function EmployeeDashboard({ summary }: { summary: EmployeeSummaryResponse }) {
  return (
    <div className="grid gap-6">
      <Card>
        <p className="text-sm text-muted-foreground">Remaining vacation days</p>
        <p className="mt-2 text-3xl font-bold">{summary.remainingVacationDays}</p>
      </Card>

      <Card>
        <h2 className="mb-3 text-lg font-semibold">Upcoming vacations</h2>
        <div className="space-y-3">
          {summary.upcomingVacations.length === 0 ? (
            <p className="text-sm text-muted-foreground">No upcoming vacations yet.</p>
          ) : (
            summary.upcomingVacations.map((vacation) => (
              <div key={vacation.id} className="flex items-center justify-between rounded-xl bg-muted/60 p-3">
                <p className="text-sm">
                  {formatDateRange(vacation.startDate, vacation.endDate)}
                </p>
                <StatusBadge status={vacation.status} />
              </div>
            ))
          )}
        </div>
      </Card>

      <Card>
        <h2 className="mb-3 text-lg font-semibold">Recent requests</h2>
        <div className="space-y-3">
          {summary.requestHistory.length === 0 ? (
            <p className="text-sm text-muted-foreground">You have not made any requests yet.</p>
          ) : null}
          {summary.requestHistory.map((request) => (
            <div key={request.id} className="flex items-center justify-between rounded-xl bg-muted/60 p-3">
              <p className="text-sm">
                {formatDateRange(request.startDate, request.endDate)}
              </p>
              <StatusBadge status={request.status} />
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
