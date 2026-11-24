import Link from 'next/link';
import { TopNav } from '@/components/layout/top-nav';
import { Card } from '@/components/ui/card';
import { buttonStyles } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/badge';
import { fetchVacations } from '@/lib/api';
import { requireToken, requireUser } from '@/lib/auth';
import { formatDateRange } from '@/lib/dates';
import { absenceTypeLabels } from '@/lib/labels';

export default async function VacationsPage() {
  const user = await requireUser();
  const token = requireToken();
  const vacations = await fetchVacations(token);

  return (
    <div>
      <TopNav user={user} />
      <main className="mx-auto max-w-6xl space-y-6 p-4 md:p-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Vacation Requests</h1>
          {user.role === 'EMPLOYEE' ? (
            <Link href="/vacations/request" className={buttonStyles()}>
              Request Vacation
            </Link>
          ) : null}
        </div>

        <div className="grid gap-4">
          {vacations.length === 0 ? (
            <Card>
              <p className="text-sm text-muted-foreground">
                {user.role === 'EMPLOYEE'
                  ? 'You have not requested any time off yet.'
                  : 'No vacation requests have been submitted yet.'}
              </p>
            </Card>
          ) : null}
          {vacations.map((request) => (
            <Card key={request.id} className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">
                  {formatDateRange(request.startDate, request.endDate)}
                </p>
                <StatusBadge status={request.status} />
              </div>
              <p className="text-sm text-muted-foreground">
                {absenceTypeLabels[request.absenceType]} · {request.reason}
              </p>
              {request.adminComment ? (
                <p className="rounded-lg bg-muted px-3 py-2 text-sm">Admin: {request.adminComment}</p>
              ) : null}
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
}
