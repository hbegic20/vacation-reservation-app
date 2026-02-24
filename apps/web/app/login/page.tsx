import { LoginForm } from '@/components/forms/login-form';
import { Card } from '@/components/ui/card';
import { getCurrentUser } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function LoginPage() {
  const user = await getCurrentUser();
  if (user) {
    redirect('/dashboard');
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md space-y-4">
        <div>
          <h1 className="text-2xl font-bold">Company Vacation Portal</h1>
          <p className="text-sm text-muted-foreground">Sign in to manage leave requests.</p>
        </div>
        <LoginForm />
      </Card>
    </main>
  );
}
