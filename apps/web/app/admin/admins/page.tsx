import { TopNav } from '@/components/layout/top-nav';
import { CreateAdminForm } from '@/components/forms/create-admin-form';
import { Card } from '@/components/ui/card';
import { fetchAdmins } from '@/lib/api';
import { getToken, requireAdmin } from '@/lib/auth';

export default async function AdminsPage() {
  const user = await requireAdmin();
  const token = getToken();
  const admins = await fetchAdmins(token!);

  return (
    <div>
      <TopNav user={user} />
      <main className="mx-auto max-w-6xl space-y-6 p-4 md:p-6">
        <h1 className="text-2xl font-bold">Admins</h1>

        <Card className="space-y-4">
          <h2 className="text-lg font-semibold">Add New Admin</h2>
          <CreateAdminForm />
        </Card>

        <Card className="space-y-3">
          <h2 className="text-lg font-semibold">Current Admins</h2>
          <div className="grid gap-3">
            {admins.map((admin) => (
              <div key={admin.id} className="rounded-xl bg-muted p-3 text-sm">
                <p className="font-semibold">
                  {admin.firstName} {admin.lastName}
                </p>
                <p className="text-muted-foreground">{admin.email}</p>
                <p className="text-xs text-muted-foreground">
                  {admin.department || 'No department'} · Added{' '}
                  {new Date(admin.createdAt).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        </Card>
      </main>
    </div>
  );
}
