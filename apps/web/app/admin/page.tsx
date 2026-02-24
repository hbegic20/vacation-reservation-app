import Link from 'next/link';
import { TopNav } from '@/components/layout/top-nav';
import { Card } from '@/components/ui/card';
import { requireAdmin } from '@/lib/auth';

export default async function AdminPage() {
  const user = await requireAdmin();

  return (
    <div>
      <TopNav user={user} />
      <main className="mx-auto max-w-6xl space-y-4 p-4 md:p-6">
        <h1 className="text-2xl font-bold">Admin Panel</h1>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Link href="/admin/requests">
            <Card className="cursor-pointer transition hover:-translate-y-0.5 hover:shadow-xl">
              <h2 className="text-lg font-semibold">Pending Requests</h2>
              <p className="text-sm text-muted-foreground">Approve or reject employee vacation requests.</p>
            </Card>
          </Link>
          <Link href="/admin/employees">
            <Card className="cursor-pointer transition hover:-translate-y-0.5 hover:shadow-xl">
              <h2 className="text-lg font-semibold">Employees</h2>
              <p className="text-sm text-muted-foreground">
                Review employee vacation allowance and utilization.
              </p>
            </Card>
          </Link>
          <Link href="/admin/calendar">
            <Card className="cursor-pointer transition hover:-translate-y-0.5 hover:shadow-xl">
              <h2 className="text-lg font-semibold">Year Calendar</h2>
              <p className="text-sm text-muted-foreground">
                View all vacations by date and hover to inspect employee requests.
              </p>
            </Card>
          </Link>
          <Link href="/admin/admins">
            <Card className="cursor-pointer transition hover:-translate-y-0.5 hover:shadow-xl">
              <h2 className="text-lg font-semibold">Admins</h2>
              <p className="text-sm text-muted-foreground">
                Add additional administrators and view current admin access.
              </p>
            </Card>
          </Link>
        </div>
      </main>
    </div>
  );
}
