import Link from 'next/link';
import { TopNav } from '@/components/layout/top-nav';
import { EditEmployeeForm } from '@/components/forms/edit-employee-form';
import { ResetPasswordForm } from '@/components/forms/reset-password-form';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { fetchEmployeeById } from '@/lib/api';
import { getToken, requireAdmin } from '@/lib/auth';

interface EditEmployeePageProps {
  params: {
    id: string;
  };
}

export default async function EditEmployeePage({ params }: EditEmployeePageProps) {
  const user = await requireAdmin();
  const token = getToken();
  const employee = await fetchEmployeeById(token!, params.id);

  return (
    <div>
      <TopNav user={user} />
      <main className="mx-auto max-w-4xl space-y-4 p-4 md:p-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Edit Employee</h1>
          <Link href="/admin/employees">
            <Button variant="secondary">Back</Button>
          </Link>
        </div>

        <Card className="space-y-4">
          <h2 className="text-lg font-semibold">Profile & Allowance</h2>
          <EditEmployeeForm employee={employee} />
        </Card>

        <Card className="space-y-4">
          <h2 className="text-lg font-semibold">Reset Password</h2>
          <ResetPasswordForm employeeId={employee.id} />
        </Card>
      </main>
    </div>
  );
}
