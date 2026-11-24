import Link from 'next/link';
import { TopNav } from '@/components/layout/top-nav';
import { buttonStyles } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { fetchEmployees } from '@/lib/api';
import { requireAdmin, requireToken } from '@/lib/auth';
import { formatDate } from '@/lib/dates';

export default async function AdminEmployeesPage() {
  const user = await requireAdmin();
  const token = requireToken();
  const employees = await fetchEmployees(token);

  return (
    <div>
      <TopNav user={user} />
      <main className="mx-auto max-w-6xl space-y-6 p-4 md:p-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Employees</h1>
          <Link href="/admin/employees/new" className={buttonStyles()}>
            Create Employee
          </Link>
        </div>
        <div className="grid gap-4">
          {employees.length === 0 ? (
            <Card>
              <p className="text-sm text-muted-foreground">
                No employees yet. Create the first account to get started.
              </p>
            </Card>
          ) : null}
          {employees.map((employee) => {
            const remaining = employee.vacationDaysTotal - employee.vacationDaysUsed;
            return (
              <Card key={employee.id} className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-semibold">
                    {employee.firstName} {employee.lastName}
                  </p>
                  <p className="text-sm text-muted-foreground">{employee.email}</p>
                  <p className="text-xs text-muted-foreground">
                    {employee.department || 'No department'} ·{' '}
                    {employee.isActive ? 'Active' : 'Inactive'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Joined {formatDate(employee.createdAt)}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 text-sm">
                  <span className="rounded-xl bg-muted px-3 py-2">
                    {employee.vacationDaysUsed}/{employee.vacationDaysTotal} used ({remaining} left)
                  </span>
                  <span className="rounded-xl bg-amber-100 px-3 py-2 text-amber-800 dark:bg-amber-900/60 dark:text-amber-200">
                    Pending: {employee.pendingRequests}
                  </span>
                  <span className="rounded-xl bg-emerald-100 px-3 py-2 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200">
                    Upcoming approved: {employee.upcomingApprovedRequests}
                  </span>
                  <Link
                    href={`/admin/employees/${employee.id}/edit`}
                    className={buttonStyles('secondary')}
                  >
                    Edit
                  </Link>
                </div>
              </Card>
            );
          })}
        </div>
      </main>
    </div>
  );
}
