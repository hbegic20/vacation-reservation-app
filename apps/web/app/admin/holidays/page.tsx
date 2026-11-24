import type { Metadata } from 'next';
import Link from 'next/link';
import { CreateHolidayForm } from '@/components/holidays/create-holiday-form';
import { DeleteHolidayForm } from '@/components/holidays/delete-holiday-form';
import { PageHeader } from '@/components/layout/page-header';
import { PageShell } from '@/components/layout/page-shell';
import { buttonStyles } from '@/components/ui/button';
import { todayKey } from '@/lib/absences';
import { fetchHolidays } from '@/lib/api';
import { requireAdmin, requireToken } from '@/lib/auth';
import { formatLongDate } from '@/lib/dates';
import { plural } from '@/lib/people';

export const metadata: Metadata = { title: 'Public holidays' };

const minYear = 2000;
const maxYear = 2100;

interface HolidaysPageProps {
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

export default async function HolidaysPage({ searchParams }: HolidaysPageProps) {
  const user = await requireAdmin();
  const token = requireToken();
  const currentYear = Number(todayKey().slice(0, 4));
  const year = parseYear(searchParams.year, currentYear);
  const holidays = await fetchHolidays(token, year);

  return (
    <PageShell user={user}>
      <PageHeader
        title={`Public holidays ${year}`}
        description="Holidays don’t count as working days in requests, approvals or the calendar."
        back={{ href: '/admin/calendar', label: 'Back to calendar' }}
        actions={
          <nav aria-label="Change year" className="flex flex-wrap gap-2">
            {year > minYear ? (
              <Link href={`/admin/holidays?year=${year - 1}`} className={buttonStyles('secondary')}>
                ← {year - 1}
              </Link>
            ) : null}
            {year < maxYear ? (
              <Link href={`/admin/holidays?year=${year + 1}`} className={buttonStyles('secondary')}>
                {year + 1} →
              </Link>
            ) : null}
          </nav>
        }
      />
      <div className="flex flex-wrap items-start gap-5">
        <section
          aria-labelledby="holiday-list-title"
          className="min-w-0 flex-[999_1_480px] overflow-hidden rounded-2xl border border-border bg-card"
        >
          <h2 id="holiday-list-title" className="border-b border-border px-6 py-5 font-display text-[17px] font-semibold">
            {plural(holidays.length, 'holiday')}
          </h2>
          {holidays.length === 0 ? (
            <p className="px-6 py-5 text-sm text-muted-foreground">No holidays added for {year} yet.</p>
          ) : (
            <ul>
              {holidays.map((holiday) => (
                <li
                  key={holiday.id}
                  className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-6 py-3 last:border-b-0"
                >
                  <div>
                    <p className="font-semibold">{holiday.name}</p>
                    <p className="text-[13px] text-muted-foreground">{formatLongDate(holiday.date)}</p>
                  </div>
                  <DeleteHolidayForm holidayId={holiday.id} name={holiday.name} />
                </li>
              ))}
            </ul>
          )}
        </section>
        <section
          aria-labelledby="add-holiday-title"
          className="flex flex-[1_1_320px] flex-col gap-4 rounded-2xl border border-border bg-card p-6"
        >
          <h2 id="add-holiday-title" className="font-display text-[17px] font-semibold">
            Add a holiday
          </h2>
          <CreateHolidayForm year={year} />
          <p className="text-[13px] text-muted-foreground">
            Changes apply to new requests. Requests already sent keep the working days they were created with.
          </p>
        </section>
      </div>
    </PageShell>
  );
}
