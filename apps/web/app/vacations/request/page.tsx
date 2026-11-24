import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { VacationRequestForm } from '@/components/forms/vacation-request-form';
import { PageHeader } from '@/components/layout/page-header';
import { PageShell } from '@/components/layout/page-shell';
import { isActiveAbsence, todayKey } from '@/lib/absences';
import { fetchHolidays, fetchVacations } from '@/lib/api';
import { requireToken, requireUser } from '@/lib/auth';

export const metadata: Metadata = { title: 'Request time off' };

export default async function RequestVacationPage() {
  const user = await requireUser();
  if (user.role !== 'EMPLOYEE') {
    redirect('/dashboard');
  }

  const token = requireToken();
  const currentYear = Number(todayKey().slice(0, 4));
  const [holidaysThisYear, holidaysNextYear, ownRequests] = await Promise.all([
    fetchHolidays(token, currentYear),
    fetchHolidays(token, currentYear + 1),
    fetchVacations(token)
  ]);
  const holidays = [...holidaysThisYear, ...holidaysNextYear];
  const activeRequests = ownRequests.filter((request) => isActiveAbsence(request.status));

  return (
    <PageShell user={user} width="medium">
      <PageHeader
        title="Request time off"
        description="Admins get a notification as soon as you send this."
        back={{ href: '/dashboard', label: 'Back to dashboard' }}
      />
      <VacationRequestForm
        availableDays={user.vacationDaysTotal - user.vacationDaysUsed}
        holidays={holidays}
        existingRequests={activeRequests}
      />
    </PageShell>
  );
}
