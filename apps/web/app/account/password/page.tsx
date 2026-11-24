import type { Metadata } from 'next';
import { ChangePasswordForm } from '@/components/forms/change-password-form';
import { PageHeader } from '@/components/layout/page-header';
import { PageShell } from '@/components/layout/page-shell';
import { Card } from '@/components/ui/card';
import { Icon } from '@/components/ui/icon';
import { requireSignedIn } from '@/lib/auth';

export const metadata: Metadata = { title: 'Change password' };

export default async function ChangePasswordPage() {
  const user = await requireSignedIn();

  return (
    <PageShell user={user} width="narrow">
      <PageHeader
        title={user.mustChangePassword ? 'Choose your password' : 'Change password'}
        description={`Signed in as ${user.email}`}
        back={user.mustChangePassword ? undefined : { href: '/dashboard', label: 'Back to dashboard' }}
      />
      {user.mustChangePassword ? (
        <div role="status" className="flex gap-3 rounded-xl border border-warning/40 bg-warning-soft px-4 py-3.5 text-sm">
          <Icon name="alertCircle" size={22} className="mt-px shrink-0 text-warning" />
          <p>
            <span className="font-semibold text-warning">You’re using a temporary password.</span>{' '}
            Choose your own before you continue. Your current password is the one an admin gave you.
          </p>
        </div>
      ) : null}
      <Card>
        <ChangePasswordForm />
      </Card>
    </PageShell>
  );
}
