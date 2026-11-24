import Link from 'next/link';
import { AuthUser, EmployeeSummaryResponse, TeamAbsence } from '@vacation/shared';
import { buttonStyles } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { AllowanceCard } from './allowance-card';
import { NextTimeOffCard } from './next-time-off-card';
import { RequestList } from './request-list';
import { TeamAbsencesCard } from './team-absences-card';

interface EmployeeDashboardProps {
  user: AuthUser;
  summary: EmployeeSummaryResponse;
  teamAbsences: TeamAbsence[];
}

function pendingWorkingDays(summary: EmployeeSummaryResponse): number {
  return summary.requestHistory
    .filter((request) => request.status === 'PENDING')
    .reduce((total, request) => total + request.workingDays, 0);
}

export function EmployeeDashboard({ user, summary, teamAbsences }: EmployeeDashboardProps) {
  return (
    <div className="flex flex-col gap-7">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          {user.department ? (
            <p className="text-sm font-medium text-muted-foreground">{user.department}</p>
          ) : null}
          <h1 className="mt-1 font-display text-[34px] font-bold leading-tight tracking-tight">
            Welcome back, {user.firstName}
          </h1>
        </div>
        <Link href="/vacations/request" className={buttonStyles('primary', 'min-h-12 px-5 text-[15px]')}>
          <Icon name="plus" size={18} />
          Request time off
        </Link>
      </div>

      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        <AllowanceCard
          totalDays={user.vacationDaysTotal}
          usedDays={user.vacationDaysUsed}
          remainingDays={summary.remainingVacationDays}
          pendingDays={pendingWorkingDays(summary)}
        />
        <NextTimeOffCard vacation={summary.upcomingVacations[0]} />
        <TeamAbsencesCard department={user.department} absences={teamAbsences} />
      </div>

      <section aria-labelledby="recent-requests-title" className="overflow-hidden rounded-2xl border border-border bg-card">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-6 py-5">
          <h2 id="recent-requests-title" className="font-display text-[17px] font-semibold">
            Recent requests
          </h2>
          <Link href="/vacations" className="text-sm font-semibold text-primary-text">
            View all
          </Link>
        </div>
        {summary.requestHistory.length === 0 ? (
          <p className="px-6 py-5 text-sm text-muted-foreground">You have not made any requests yet.</p>
        ) : (
          <RequestList requests={summary.requestHistory} />
        )}
      </section>
    </div>
  );
}
