import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { VacationRequestForm } from '@/components/forms/vacation-request-form';
import { TopNav } from '@/components/layout/top-nav';
import { requireUser } from '@/lib/auth';

export const metadata: Metadata = { title: 'Request time off' };

export default async function RequestVacationPage() {
  const user = await requireUser();
  if (user.role !== 'EMPLOYEE') {
    redirect('/dashboard');
  }

  return (
    <div>
      <TopNav user={user} />
      <main className="mx-auto flex max-w-5xl flex-col gap-6 px-4 pb-14 pt-9 md:px-6">
        <div>
          <Link href="/dashboard" className="text-sm font-semibold text-primary-text">
            ← Back to dashboard
          </Link>
          <h1 className="mt-2.5 font-display text-[34px] font-bold leading-tight tracking-tight">
            Request time off
          </h1>
          <p className="mt-1.5 text-muted-foreground">Admins get a notification as soon as you send this.</p>
        </div>
        <VacationRequestForm availableDays={user.vacationDaysTotal - user.vacationDaysUsed} />
      </main>
    </div>
  );
}
