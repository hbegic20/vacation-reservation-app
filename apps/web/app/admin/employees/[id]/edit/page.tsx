import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { EditEmployeeForm } from '@/components/forms/edit-employee-form';
import { ResetPasswordForm } from '@/components/forms/reset-password-form';
import { PageHeader } from '@/components/layout/page-header';
import { PageShell } from '@/components/layout/page-shell';
import { Avatar } from '@/components/ui/avatar';
import { Card } from '@/components/ui/card';
import { ApiError, fetchEmployeeById } from '@/lib/api';
import { requireAdmin, requireToken } from '@/lib/auth';
import { formatDate } from '@/lib/dates';

export const metadata: Metadata = { title: 'Edit employee' };

interface EditEmployeePageProps {
  params: {
    id: string;
  };
}

async function findEmployee(token: string, id: string) {
  try {
    return await fetchEmployeeById(token, id);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      notFound();
    }
    throw error;
  }
}

export default async function EditEmployeePage({ params }: EditEmployeePageProps) {
  const user = await requireAdmin();
  const token = requireToken();
  const employee = await findEmployee(token, params.id);

  return (
    <PageShell user={user} width="narrow">
      <PageHeader
        title={`${employee.firstName} ${employee.lastName}`}
        back={{ href: '/admin/employees', label: 'Back to employees' }}
      />
      <div className="-mt-2 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
        <Avatar firstName={employee.firstName} lastName={employee.lastName} seed={employee.id} />
        <span>{employee.email}</span>
        <span aria-hidden="true">·</span>
        <span>Joined {formatDate(employee.createdAt)}</span>
      </div>

      <Card className="flex flex-col gap-5">
        <h2 className="font-display text-[17px] font-semibold">Profile and allowance</h2>
        <EditEmployeeForm employee={employee} />
      </Card>

      <Card className="flex flex-col gap-4">
        <h2 className="font-display text-[17px] font-semibold">Reset password</h2>
        <ResetPasswordForm employeeId={employee.id} />
      </Card>
    </PageShell>
  );
}
