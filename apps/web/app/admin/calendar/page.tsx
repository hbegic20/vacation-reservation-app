import type { Metadata } from 'next';
import Link from 'next/link';
import { YearVacationCalendar } from '@/components/calendar/year-vacation-calendar';
import { CreateSickLeaveForm } from '@/components/forms/create-sick-leave-form';
import { PageHeader } from '@/components/layout/page-header';
import { PageShell } from '@/components/layout/page-shell';
import { buttonStyles } from '@/components/ui/button';
import { todayKey } from '@/lib/absences';
import { fetchEmployees, fetchHolidays, fetchVacationCalendar } from '@/lib/api';
import { requireAdmin, requireToken } from '@/lib/auth';

export const metadata: Metadata = { title: 'Calendar' };

const minYear = 2000;
const maxYear = 2100;

interface AdminCalendarPageProps {
  searchParams: {
    year?: string;
  };
}

function parseYear(value: string | undefined, currentYear: number): number {
  const requestedYear = Number(value ?? currentYear);
  return Number.isInteger(requestedYear) && requestedYear >= minYear && requestedYear <= maxYear
    ? requestedYear
    : currentYear;
}

function LegendItem({ swatchClassName, label }: { swatchClassName: string; label: string }) {
  return (
    <li className="inline-flex items-center gap-2">
      <span aria-hidden="true" className={`h-4 w-4 rounded ${swatchClassName}`} />
      {label}
    </li>
  );
}

export default async function AdminCalendarPage({ searchParams }: AdminCalendarPageProps) {
  const user = await requireAdmin();
  const token = requireToken();
  const today = todayKey();
  const currentYear = Number(today.slice(0, 4));
  const year = parseYear(searchParams.year, currentYear);
  const [days, employees, holidays] = await Promise.all([
    fetchVacationCalendar(token, year),
    fetchEmployees(token),
    fetchHolidays(token, year)
  ]);

  return (
    <PageShell user={user} width="full">
      <PageHeader
        title={`Company calendar ${year}`}
        description="Choose a highlighted day to see who is off or which holiday it is."
        actions={
          <>
            <Link href={`/admin/holidays?year=${year}`} className={buttonStyles('secondary')}>
              Public holidays
            </Link>
            <nav aria-label="Change year" className="flex flex-wrap gap-2">
              {year > minYear ? (
                <Link href={`/admin/calendar?year=${year - 1}`} className={buttonStyles('secondary')}>
                  ← {year - 1}
                </Link>
              ) : null}
              {year !== currentYear ? (
                <Link href="/admin/calendar" className={buttonStyles('secondary')}>
                  This year
                </Link>
              ) : null}
              {year < maxYear ? (
                <Link href={`/admin/calendar?year=${year + 1}`} className={buttonStyles('secondary')}>
                  {year + 1} →
                </Link>
              ) : null}
            </nav>
          </>
        }
      />

      <ul aria-label="Legend" className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
        <LegendItem swatchClassName="bg-primary" label="Approved vacation" />
        <LegendItem swatchClassName="border-2 border-dashed border-warning bg-warning-soft" label="Pending" />
        <LegendItem swatchClassName="bg-sick-soft ring-1 ring-inset ring-sick" label="Sick leave" />
        <LegendItem swatchClassName="bg-muted ring-1 ring-inset ring-input" label="Public holiday" />
        <LegendItem swatchClassName="ring-2 ring-inset ring-primary" label="Today" />
        <li className="text-muted-foreground">A number on a day means several people are off.</li>
      </ul>

      <YearVacationCalendar
        year={year}
        today={today}
        days={days}
        holidays={holidays}
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
