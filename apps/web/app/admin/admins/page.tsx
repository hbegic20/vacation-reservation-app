import type { Metadata } from 'next';
import { CreateAdminForm } from '@/components/forms/create-admin-form';
import { PageHeader } from '@/components/layout/page-header';
import { PageShell } from '@/components/layout/page-shell';
import { Avatar } from '@/components/ui/avatar';
import { fetchAdmins } from '@/lib/api';
import { requireAdmin, requireToken } from '@/lib/auth';
import { formatDate } from '@/lib/dates';
import { plural } from '@/lib/people';

export const metadata: Metadata = { title: 'Admins' };

export default async function AdminsPage() {
  const user = await requireAdmin();
  const token = requireToken();
  const admins = await fetchAdmins(token);

  return (
    <PageShell user={user}>
      <PageHeader
        title="Admins"
        description="Admins can approve requests, manage employees and record sick leave."
      />
      <div className="flex flex-wrap items-start gap-5">
        <section
          aria-labelledby="current-admins-title"
          className="min-w-0 flex-[999_1_480px] overflow-hidden rounded-2xl border border-border bg-card"
        >
          <h2 id="current-admins-title" className="border-b border-border px-6 py-5 font-display text-[17px] font-semibold">
            {plural(admins.length, 'admin')}
          </h2>
          <ul>
            {admins.map((admin) => (
              <li key={admin.id} className="flex flex-wrap items-center gap-3 border-b border-border px-6 py-4 last:border-b-0">
                <Avatar firstName={admin.firstName} lastName={admin.lastName} seed={admin.id} />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">
                    {admin.firstName} {admin.lastName}
                    {admin.id === user.id ? <span className="font-normal text-muted-foreground"> (you)</span> : null}
                  </p>
                  <p className="truncate text-[13px] text-muted-foreground">{admin.email}</p>
                </div>
                <p className="text-[13px] text-muted-foreground">
                  {admin.department ? `${admin.department} · ` : ''}Added {formatDate(admin.createdAt)}
                </p>
              </li>
            ))}
          </ul>
        </section>
        <section
          aria-labelledby="add-admin-title"
          className="flex flex-[1_1_340px] flex-col gap-4 rounded-2xl border border-border bg-card p-6"
        >
          <h2 id="add-admin-title" className="font-display text-[17px] font-semibold">
            Add an admin
          </h2>
          <CreateAdminForm />
        </section>
      </div>
    </PageShell>
  );
}
