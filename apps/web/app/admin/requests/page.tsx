import { TopNav } from '@/components/layout/top-nav';
import { ReviewRequestModal } from '@/components/forms/review-request-modal';
import { StatusBadge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { fetchVacations } from '@/lib/api';
import { getToken, requireAdmin } from '@/lib/auth';

export default async function AdminRequestsPage() {
  const user = await requireAdmin();
  const token = getToken();
  const requests = await fetchVacations(token!);

  return (
    <div>
      <TopNav user={user} />
      <main className="mx-auto max-w-6xl space-y-6 p-4 md:p-6">
        <h1 className="text-2xl font-bold">Approval Queue</h1>
        <div className="grid gap-4">
          {requests.map((request) => (
            <Card key={request.id} className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold">
                    {request.user
                      ? `${request.user.firstName} ${request.user.lastName}`
                      : request.userId}
                  </p>
                  {request.user ? (
                    <p className="text-xs text-muted-foreground">
                      {request.user.email}
                      {request.user.department ? ` · ${request.user.department}` : ''}
                    </p>
                  ) : null}
                  <p className="text-sm text-muted-foreground">
                    {new Date(request.startDate).toLocaleDateString()} -{' '}
                    {new Date(request.endDate).toLocaleDateString()}
                  </p>
                </div>
                <StatusBadge status={request.status} />
              </div>
              <p className="text-sm">
                {request.absenceType} · {request.reason}
              </p>
              {request.status === 'PENDING' ? (
                <ReviewRequestModal
                  requestId={request.id}
                  title={
                    request.user
                      ? `${request.user.firstName} ${request.user.lastName}`
                      : request.userId
                  }
                  subtitle={`${new Date(request.startDate).toLocaleDateString()} - ${new Date(request.endDate).toLocaleDateString()}`}
                />
              ) : (
                <p className="text-sm text-muted-foreground">
                  {request.adminComment || 'No admin comment provided.'}
                </p>
              )}
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
}
