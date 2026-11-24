import type { Metadata } from 'next';
import { CreateEmployeeForm } from '@/components/forms/create-employee-form';
import { PageHeader } from '@/components/layout/page-header';
import { PageShell } from '@/components/layout/page-shell';
import { Card } from '@/components/ui/card';
import { requireAdmin } from '@/lib/auth';

export const metadata: Metadata = { title: 'Add employee' };

export default async function NewEmployeePage() {
  const user = await requireAdmin();

  return (
    <PageShell user={user} width="narrow">
      <PageHeader
        title="Add employee"
        description="They can sign in with their email and the temporary password."
        back={{ href: '/admin/employees', label: 'Back to employees' }}
      />
      <Card>
        <CreateEmployeeForm />
      </Card>
    </PageShell>
  );
}
