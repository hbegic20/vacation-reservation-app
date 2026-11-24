import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { VacationRequestForm } from '@/components/forms/vacation-request-form';
import { PageHeader } from '@/components/layout/page-header';
import { PageShell } from '@/components/layout/page-shell';
import { requireUser } from '@/lib/auth';

export const metadata: Metadata = { title: 'Request time off' };

export default async function RequestVacationPage() {
  const user = await requireUser();
  if (user.role !== 'EMPLOYEE') {
    redirect('/dashboard');
  }

  return (
    <PageShell user={user} width="medium">
      <PageHeader
        title="Request time off"
        description="Admins get a notification as soon as you send this."
        back={{ href: '/dashboard', label: 'Back to dashboard' }}
      />
      <VacationRequestForm availableDays={user.vacationDaysTotal - user.vacationDaysUsed} />
    </PageShell>
  );
}
