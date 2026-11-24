import {
  AdminNotificationItem,
  EmployeeListItem,
  VacationRequest
} from '@vacation/shared';
import { formatLongDate } from '@/lib/dates';
import { todayKey } from '@/lib/absences';
import { AdminNotifications } from './admin-notifications';
import { AdminStats } from './admin-stats';
import { PendingApprovalsCard } from './pending-approvals-card';
import { WeekAbsences } from './week-absences';

interface AdminDashboardProps {
  requests: VacationRequest[];
  employees: EmployeeListItem[];
  notifications: AdminNotificationItem[];
  unreadCount: number;
}

export function AdminDashboard({ requests, employees, notifications, unreadCount }: AdminDashboardProps) {
  const pending = requests
    .filter((request) => request.status === 'PENDING')
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  const approved = requests.filter((request) => request.status === 'APPROVED');

  return (
    <div className="flex flex-col gap-7">
      <div>
        <p className="text-sm font-medium text-muted-foreground">{formatLongDate(todayKey())}</p>
        <h1 className="mt-1 font-display text-[34px] font-bold leading-tight tracking-tight">Company overview</h1>
      </div>

      <div className="flex flex-wrap gap-5">
        <div className="min-w-0 flex-[999_1_560px]">
          <PendingApprovalsCard pending={pending} allRequests={requests} />
        </div>
        <div className="flex-[1_1_300px]">
          <AdminStats approved={approved} employees={employees} />
        </div>
      </div>

      <WeekAbsences requests={requests} />

      <AdminNotifications notifications={notifications} unreadCount={unreadCount} />
    </div>
  );
}
