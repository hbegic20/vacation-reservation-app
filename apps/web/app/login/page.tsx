import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { LoginForm } from '@/components/forms/login-form';
import { Icon } from '@/components/ui/icon';
import { getCurrentUser } from '@/lib/auth';

export const metadata: Metadata = { title: 'Sign in' };

export default async function LoginPage() {
  const user = await getCurrentUser();
  if (user) {
    redirect('/dashboard');
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="flex w-full max-w-md flex-col gap-6">
        <div className="flex items-center gap-2.5">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary text-white">
            <Icon name="logo" size={22} />
          </span>
          <span className="font-display text-xl font-bold">Vacation Hub</span>
        </div>
        <div className="flex flex-col gap-6 rounded-2xl border border-border bg-card p-7">
          <div>
            <h1 className="font-display text-[28px] font-bold leading-tight tracking-tight">Sign in</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Request time off and see your remaining days.
            </p>
          </div>
          <LoginForm />
        </div>
        <p className="text-center text-[13px] text-muted-foreground">
          Forgot your password? Ask an admin to reset it.
        </p>
      </div>
    </main>
  );
}
