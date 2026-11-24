import type { Metadata } from 'next';
import { AdminDashboard } from '@/components/dashboard/admin-dashboard';
import { EmployeeDashboard } from '@/components/dashboard/employee-dashboard';
import { PageShell } from '@/components/layout/page-shell';
import {
  fetchAdminNotifications,
  fetchAdminUnreadNotificationCount,
  fetchEmployees,
  fetchSummary,
  fetchTeamAbsences,
  fetchVacations
} from '@/lib/api';
import { workWeekKeys } from '@/lib/absences';
import { requireToken, requireUser } from '@/lib/auth';
import { AuthUser, EmployeeSummaryResponse } from '@vacation/shared';

export const metadata: Metadata = { title: 'Dashboard' };

export default async function DashboardPage() {
  const user = await requireUser();
  const token = requireToken();

  return (
    <PageShell user={user}>
      {user.role === 'ADMIN' ? (
        <AdminDashboardSection token={token} />
      ) : (
        <EmployeeDashboardSection user={user} token={token} />
      )}
    </PageShell>
  );
}

async function AdminDashboardSection({ token }: { token: string }) {
  const [requests, employees, notifications, unread] = await Promise.all([
    fetchVacations(token),
    fetchEmployees(token),
    fetchAdminNotifications(token),
    fetchAdminUnreadNotificationCount(token)
  ]);

  return (
    <AdminDashboard
      requests={requests}
      employees={employees}
      notifications={notifications}
      unreadCount={unread.unread}
    />
  );
}

async function EmployeeDashboardSection({ user, token }: { user: AuthUser; token: string }) {
  const week = workWeekKeys();
  const [summary, teamAbsences] = await Promise.all([
    fetchSummary(token) as Promise<EmployeeSummaryResponse>,
    fetchTeamAbsences(token, week[0], week[week.length - 1])
  ]);

  return <EmployeeDashboard user={user} summary={summary} teamAbsences={teamAbsences} />;
}
