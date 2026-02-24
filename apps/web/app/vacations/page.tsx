import Link from 'next/link';
import { TopNav } from '@/components/layout/top-nav';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/badge';
import { fetchVacations } from '@/lib/api';
import { getToken, requireUser } from '@/lib/auth';

export default async function VacationsPage() {
  const user = await requireUser();
  const token = getToken();
  const vacations = await fetchVacations(token!);

  return (
    <div>
      <TopNav user={user} />
      <main className="mx-auto max-w-6xl space-y-6 p-4 md:p-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Vacation Requests</h1>
          {user.role === 'EMPLOYEE' ? (
            <Link href="/vacations/request">
              <Button>Request Vacation</Button>
            </Link>
          ) : null}
        </div>

        <div className="grid gap-4">
          {vacations.map((request) => (
            <Card key={request.id} className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">
                  {new Date(request.startDate).toLocaleDateString()} -{' '}
                  {new Date(request.endDate).toLocaleDateString()}
                </p>
                <StatusBadge status={request.status} />
              </div>
              <p className="text-sm text-muted-foreground">
                {request.absenceType} · {request.reason}
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
