import Link from 'next/link';
import { TopNav } from '@/components/layout/top-nav';
import { CreateEmployeeForm } from '@/components/forms/create-employee-form';
import { buttonStyles } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { requireAdmin } from '@/lib/auth';

export default async function NewEmployeePage() {
  const user = await requireAdmin();

  return (
    <div>
      <TopNav user={user} />
      <main className="mx-auto max-w-3xl space-y-4 p-4 md:p-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Create Employee Account</h1>
          <Link href="/admin/employees" className={buttonStyles('secondary')}>
            Back to Employees
          </Link>
        </div>
        <Card>
          <CreateEmployeeForm />
        </Card>
      </main>
    </div>
  );
}
