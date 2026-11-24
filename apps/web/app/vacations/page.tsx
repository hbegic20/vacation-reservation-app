import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { VacationRequest } from '@vacation/shared';
import { RequestList } from '@/components/dashboard/request-list';
import { PageHeader } from '@/components/layout/page-header';
import { PageShell } from '@/components/layout/page-shell';
import { buttonStyles } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { todayKey } from '@/lib/absences';
import { fetchVacations } from '@/lib/api';
import { requireToken, requireUser } from '@/lib/auth';
import { toDateKey } from '@/lib/dates';

export const metadata: Metadata = { title: 'My requests' };

function isComingUp(request: VacationRequest, today: string): boolean {
  return request.status !== 'REJECTED' && toDateKey(request.endDate) >= today;
}

function RequestSection({ id, title, requests }: { id: string; title: string; requests: VacationRequest[] }) {
  return (
    <section aria-labelledby={id} className="overflow-hidden rounded-2xl border border-border bg-card">
      <h2 id={id} className="border-b border-border px-6 py-5 font-display text-[17px] font-semibold">
        {title} <span className="font-sans text-sm font-medium text-muted-foreground">({requests.length})</span>
      </h2>
      <RequestList requests={requests} />
    </section>
  );
}

export default async function VacationsPage() {
  const user = await requireUser();
  if (user.role === 'ADMIN') {
    redirect('/admin/requests?status=ALL');
  }

  const token = requireToken();
  const vacations = await fetchVacations(token);
  const today = todayKey();
  const comingUp = vacations
    .filter((request) => isComingUp(request, today))
    .sort((a, b) => a.startDate.localeCompare(b.startDate));
  const past = vacations.filter((request) => !isComingUp(request, today));

  return (
    <PageShell user={user} width="medium">
      <PageHeader
        title="My requests"
        description={`${user.vacationDaysTotal - user.vacationDaysUsed} of ${user.vacationDaysTotal} days left this year`}
        actions={
          <Link href="/vacations/request" className={buttonStyles('primary', 'min-h-12 px-5 text-[15px]')}>
            <Icon name="plus" size={18} />
            Request time off
          </Link>
        }
      />
      {vacations.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-input bg-card px-6 py-12 text-center">
          <p className="font-display text-xl font-semibold">No requests yet</p>
          <p className="mt-1 text-muted-foreground">When you request time off, it shows up here.</p>
        </div>
      ) : (
        <>
          {comingUp.length > 0 ? (
            <RequestSection id="coming-up-title" title="Coming up" requests={comingUp} />
          ) : null}
          {past.length > 0 ? <RequestSection id="past-title" title="Past and rejected" requests={past} /> : null}
        </>
      )}
    </PageShell>
  );
}
