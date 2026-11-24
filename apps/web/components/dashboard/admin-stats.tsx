import { EmployeeListItem, VacationRequest } from '@vacation/shared';
import { coversDate, todayKey } from '@/lib/absences';
import { plural } from '@/lib/people';

const lowBalanceThreshold = 5;

interface AdminStatsProps {
  approved: VacationRequest[];
  employees: EmployeeListItem[];
}

function distinctPeople(requests: VacationRequest[]): number {
  return new Set(requests.map((request) => request.userId)).size;
}

function StatTile({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1.5 font-display text-[34px] font-bold leading-none">{value}</p>
      <p className="mt-2 text-[13px] text-muted-foreground">{detail}</p>
    </div>
  );
}

export function AdminStats({ approved, employees }: AdminStatsProps) {
  const today = todayKey();
  const outToday = approved.filter((request) => coversDate(request, today));
  const sickToday = outToday.filter((request) => request.absenceType === 'SICK');
  const activeEmployees = employees.filter((employee) => employee.isActive);
  const totalAllowance = activeEmployees.reduce((sum, employee) => sum + employee.vacationDaysTotal, 0);
  const usedAllowance = activeEmployees.reduce((sum, employee) => sum + employee.vacationDaysUsed, 0);
  const usedShare = totalAllowance > 0 ? Math.round((usedAllowance / totalAllowance) * 100) : 0;
  const lowBalance = activeEmployees.filter(
    (employee) => employee.vacationDaysTotal - employee.vacationDaysUsed <= lowBalanceThreshold
  ).length;

  return (
    <div className="grid grid-cols-2 content-start gap-5">
      <StatTile
        label="Out today"
        value={String(distinctPeople(outToday))}
        detail={`of ${plural(activeEmployees.length, 'person', 'people')}`}
      />
      <StatTile label="Sick today" value={String(distinctPeople(sickToday))} detail="Recorded by admins" />
      <div className="col-span-2 rounded-2xl border border-border bg-card p-5">
        <p className="text-sm text-muted-foreground">Allowance used this year</p>
        <p className="mt-1.5 font-display text-[34px] font-bold leading-none">{usedShare}%</p>
        <div
          role="img"
          aria-label={`${usedShare} percent of the company allowance used`}
          className="mt-3 h-2.5 overflow-hidden rounded-full bg-muted"
        >
          <div className="h-full bg-primary" style={{ width: `${usedShare}%` }} />
        </div>
        <p className="mt-2 text-[13px] text-muted-foreground">
          {plural(lowBalance, 'person', 'people')} with {lowBalanceThreshold} or fewer days left
        </p>
      </div>
    </div>
  );
}
