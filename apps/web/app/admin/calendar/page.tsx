import type { Metadata } from 'next';
import Link from 'next/link';
import { EmployeeListItem, VacationCalendarDay } from '@vacation/shared';
import { activeRequests, kindOf } from '@/components/calendar/calendar-day';
import { CalendarView, CompanyCalendar } from '@/components/calendar/company-calendar';
import { CreateSickLeaveForm } from '@/components/forms/create-sick-leave-form';
import { PageHeader } from '@/components/layout/page-header';
import { PageShell } from '@/components/layout/page-shell';
import { buttonStyles } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { todayKey } from '@/lib/absences';
import { fetchEmployees, fetchHolidays, fetchVacationCalendar } from '@/lib/api';
import { requireAdmin, requireToken } from '@/lib/auth';
import {
  MonthRef,
  addMonths,
  monthCells,
  monthOf,
  monthQuery,
  monthYearLabel,
  parseMonthQuery
} from '@/lib/calendar';
import { isWorkingDayKey, toDateKey } from '@/lib/dates';
import { cn } from '@/lib/utils';

export const metadata: Metadata = { title: 'Calendar' };

const minYear = 2000;
const maxYear = 2100;

interface AdminCalendarPageProps {
  searchParams: {
    view?: string;
    month?: string;
    year?: string;
    department?: string;
  };
}

interface CalendarQuery {
  view: CalendarView;
  month: MonthRef;
  department: string | null;
}

interface PeriodStats {
  offToday: number;
  vacationDays: number;
  sickDays: number;
  pendingRequests: number;
}

function parseView(value: string | undefined): CalendarView {
  return value === 'year' ? 'year' : 'month';
}

function parsePeriod(searchParams: AdminCalendarPageProps['searchParams'], today: string): MonthRef {
  const fromMonth = parseMonthQuery(searchParams.month);
  const fromYear = Number(searchParams.year);
  const fallback = searchParams.year && Number.isInteger(fromYear) ? { year: fromYear, monthIndex: 0 } : monthOf(today);
  const period = fromMonth ?? fallback;
  return period.year >= minYear && period.year <= maxYear ? period : monthOf(today);
}

function calendarHref({ view, month, department }: CalendarQuery): string {
  const params = new URLSearchParams({ view, month: monthQuery(month) });
  if (department) {
    params.set('department', department);
  }
  return `/admin/calendar?${params.toString()}`;
}

function departmentsOf(employees: EmployeeListItem[]): string[] {
  const names = employees.flatMap((employee) => (employee.department ? [employee.department] : []));
  return Array.from(new Set(names)).sort();
}

function filterByDepartment(days: VacationCalendarDay[], department: string | null): VacationCalendarDay[] {
  if (!department) {
    return days;
  }
  return days
    .map((day) => ({ ...day, requests: day.requests.filter((request) => request.user.department === department) }))
    .filter((day) => day.requests.length > 0);
}

function periodKeysOf(view: CalendarView, month: MonthRef): Set<string> {
  const months = view === 'month' ? [month] : Array.from({ length: 12 }, (_, monthIndex) => ({ year: month.year, monthIndex }));
  return new Set(months.flatMap((period) => monthCells(period).flatMap((cell) => (cell ? [cell.key] : []))));
}

function periodStats(
  days: VacationCalendarDay[],
  periodKeys: ReadonlySet<string>,
  holidayKeys: ReadonlySet<string>,
  today: string
): PeriodStats {
  const pending = new Set<string>();
  const stats = { offToday: 0, vacationDays: 0, sickDays: 0 };

  for (const day of days) {
    const people = activeRequests(day.requests);
    if (day.date === today) {
      stats.offToday = new Set(people.map((request) => request.userId)).size;
    }
    if (!periodKeys.has(day.date)) {
      continue;
    }
    const countsAsWorkingDay = isWorkingDayKey(day.date, holidayKeys);
    for (const request of people) {
      const kind = kindOf(request);
      if (kind === 'pending') {
        pending.add(request.id);
      } else if (countsAsWorkingDay) {
        stats[kind === 'sick' ? 'sickDays' : 'vacationDays'] += 1;
      }
    }
  }

  return { ...stats, pendingRequests: pending.size };
}

function StatTile({ label, value, detail }: { label: string; value: number; detail: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card px-5 py-4">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 font-display text-[28px] font-bold leading-none">{value}</p>
      <p className="mt-1.5 text-xs text-muted-foreground">{detail}</p>
    </div>
  );
}

function SegmentLink({ href, active, children }: { href: string; active: boolean; children: string }) {
  return (
    <Link
      href={href}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'inline-flex min-h-10 items-center rounded-lg px-4 text-sm font-semibold transition-colors',
        active ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
      )}
    >
      {children}
    </Link>
  );
}

function LegendItem({ swatchClassName, label }: { swatchClassName: string; label: string }) {
  return (
    <li className="inline-flex items-center gap-2">
      <span aria-hidden="true" className={`h-3.5 w-3.5 rounded ${swatchClassName}`} />
      {label}
    </li>
  );
}

export default async function AdminCalendarPage({ searchParams }: AdminCalendarPageProps) {
  const user = await requireAdmin();
  const token = requireToken();
  const today = todayKey();
  const view = parseView(searchParams.view);
  const month = parsePeriod(searchParams, today);
  const [allDays, employees, holidays] = await Promise.all([
    fetchVacationCalendar(token, month.year),
    fetchEmployees(token),
    fetchHolidays(token, month.year)
  ]);
  const departments = departmentsOf(employees);
  const requestedDepartment = searchParams.department ?? '';
  const department = departments.includes(requestedDepartment) ? requestedDepartment : null;
  const query: CalendarQuery = { view, month, department };
  const days = filterByDepartment(allDays, department);
  const holidayKeys = new Set(holidays.map((holiday) => toDateKey(holiday.date)));
  const stats = periodStats(days, periodKeysOf(view, month), holidayKeys, today);

  const step = view === 'month' ? 1 : 12;
  const previous = addMonths(month, -step);
  const next = addMonths(month, step);
  const periodLabel = view === 'month' ? monthYearLabel(month) : String(month.year);
  const currentPeriod = monthOf(today);
  const isCurrentPeriod =
    month.year === currentPeriod.year && (view === 'year' || month.monthIndex === currentPeriod.monthIndex);
  const periodNoun = view === 'month' ? 'month' : 'year';

  return (
    <PageShell user={user} width="full">
      <PageHeader
        title="Company calendar"
        description="See who is off, spot busy weeks and record sick leave."
        actions={
          <Link href={`/admin/holidays?year=${month.year}`} className={buttonStyles('secondary')}>
            Public holidays
          </Link>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile label="Off today" value={stats.offToday} detail={department ?? 'All departments'} />
        <StatTile label="Vacation days" value={stats.vacationDays} detail={`Working days, ${periodLabel}`} />
        <StatTile label="Sick days" value={stats.sickDays} detail={`Working days, ${periodLabel}`} />
        <StatTile label="Pending requests" value={stats.pendingRequests} detail={`Touching ${periodLabel}`} />
      </div>

      <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <nav aria-label={`Change ${periodNoun}`} className="flex items-center gap-1">
            {previous.year >= minYear ? (
              <Link
                href={calendarHref({ ...query, month: previous })}
                aria-label={`Previous ${periodNoun}`}
                className="grid h-11 w-11 place-items-center rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <Icon name="chevronLeft" size={20} />
              </Link>
            ) : null}
            <h2 className="min-w-44 text-center font-display text-xl font-bold" aria-live="polite">
              {periodLabel}
            </h2>
            {next.year <= maxYear ? (
              <Link
                href={calendarHref({ ...query, month: next })}
                aria-label={`Next ${periodNoun}`}
                className="grid h-11 w-11 place-items-center rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <Icon name="chevronRight" size={20} />
              </Link>
            ) : null}
            {isCurrentPeriod ? null : (
              <Link href={calendarHref({ ...query, month: currentPeriod })} className={buttonStyles('secondary', 'ml-2')}>
                Today
              </Link>
            )}
          </nav>
          <nav aria-label="Calendar view" className="inline-flex rounded-xl bg-muted p-1">
            <SegmentLink href={calendarHref({ ...query, view: 'month' })} active={view === 'month'}>
              Month
            </SegmentLink>
            <SegmentLink href={calendarHref({ ...query, view: 'year' })} active={view === 'year'}>
              Year
            </SegmentLink>
          </nav>
        </div>
        {departments.length > 0 ? (
          <nav aria-label="Filter by department" className="flex flex-wrap gap-2 border-t border-border pt-4">
            {[null, ...departments].map((name) => (
              <Link
                key={name ?? 'all'}
                href={calendarHref({ ...query, department: name })}
                aria-current={name === department ? 'page' : undefined}
                className={cn(
                  'inline-flex min-h-10 items-center rounded-full border px-4 text-sm font-semibold transition-colors',
                  name === department
                    ? 'border-primary bg-primary-soft text-primary-text'
                    : 'border-border text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                {name ?? 'All departments'}
              </Link>
            ))}
          </nav>
        ) : null}
        <ul aria-label="Legend" className="flex flex-wrap gap-x-5 gap-y-2 border-t border-border pt-4 text-[13px] text-muted-foreground">
          <LegendItem swatchClassName="bg-primary" label="Vacation" />
          <LegendItem swatchClassName="bg-sick-soft ring-1 ring-inset ring-sick" label="Sick leave" />
          <LegendItem swatchClassName="border-2 border-dashed border-warning bg-warning-soft" label="Pending" />
          <LegendItem swatchClassName="ring-1 ring-inset ring-sick/50" label="Public holiday" />
          {view === 'year' ? <li>A number means several people are off. Choose a month name to open it.</li> : null}
        </ul>
      </div>

      <CompanyCalendar
        key={calendarHref(query)}
        view={view}
        month={month}
        today={today}
        days={days}
        holidays={holidays}
        department={department}
        sidePanelFooter={
          <details className="group rounded-2xl border border-border bg-card">
            <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-3 px-5 font-display text-[17px] font-semibold [&::-webkit-details-marker]:hidden">
              Record sick leave
              <span aria-hidden="true" className="text-muted-foreground transition-transform group-open:rotate-180">
                ▾
              </span>
            </summary>
            <div className="border-t border-border p-5">
              <CreateSickLeaveForm employees={employees} />
            </div>
          </details>
        }
      />
    </PageShell>
  );
}
