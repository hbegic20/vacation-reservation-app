import { redirect } from 'next/navigation';
import { VacationRequestForm } from '@/components/forms/vacation-request-form';
import { TopNav } from '@/components/layout/top-nav';
import { Card } from '@/components/ui/card';
import { requireUser } from '@/lib/auth';

export default async function RequestVacationPage() {
  const user = await requireUser();
  if (user.role !== 'EMPLOYEE') {
    redirect('/dashboard');
  }

  return (
    <div>
      <TopNav user={user} />
      <main className="mx-auto max-w-3xl p-4 md:p-6">
        <Card className="space-y-4">
          <div>
            <h1 className="text-2xl font-bold">Request Vacation</h1>
            <p className="text-sm text-muted-foreground">
              Fill in your dates and reason. Your request will be reviewed by HR/admin.
            </p>
          </div>
          <VacationRequestForm />
        </Card>
      </main>
    </div>
  );
}
