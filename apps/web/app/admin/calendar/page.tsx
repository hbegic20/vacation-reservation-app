import Link from 'next/link';
import { TopNav } from '@/components/layout/top-nav';
import { YearVacationCalendar } from '@/components/calendar/year-vacation-calendar';
import { CreateSickLeaveForm } from '@/components/forms/create-sick-leave-form';
import { Button } from '@/components/ui/button';
import { fetchEmployees, fetchVacationCalendar } from '@/lib/api';
import { getToken, requireAdmin } from '@/lib/auth';

interface AdminCalendarPageProps {
  searchParams: {
    year?: string;
  };
}

export default async function AdminCalendarPage({ searchParams }: AdminCalendarPageProps) {
  const user = await requireAdmin();
  const token = getToken();
  const currentYear = new Date().getFullYear();
  const requestedYear = Number(searchParams.year || currentYear);
  const year =
    Number.isInteger(requestedYear) && requestedYear >= 2000 && requestedYear <= 2100
      ? requestedYear
      : currentYear;
  const [data, employees] = await Promise.all([
    fetchVacationCalendar(token!, year),
    fetchEmployees(token!)
  ]);

  return (
    <div>
      <TopNav user={user} />
      <main className="mx-auto max-w-7xl space-y-4 p-4 md:p-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h1 className="text-2xl font-bold">Company Calendar ({year})</h1>
          <div className="flex gap-2">
            <Link href={`/admin/calendar?year=${year - 1}`}>
              <Button variant="secondary">Previous Year</Button>
            </Link>
            <Link href={`/admin/calendar?year=${year + 1}`}>
              <Button variant="secondary">Next Year</Button>
            </Link>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 text-xs">
          <span className="rounded-md bg-sky-200 px-2 py-1 dark:bg-sky-900/60">Sick</span>
          <span className="rounded-md bg-emerald-200 px-2 py-1 dark:bg-emerald-900/60">Approved</span>
          <span className="rounded-md bg-amber-200 px-2 py-1 dark:bg-amber-900/60">Pending</span>
          <span className="rounded-md bg-rose-200 px-2 py-1 dark:bg-rose-900/60">Rejected</span>
        </div>

        <CreateSickLeaveForm employees={employees} />

        <YearVacationCalendar year={year} days={data} />
      </main>
    </div>
  );
}
