import type { Metadata } from 'next';
import { PageHeader } from '@/components/layout/page-header';
import { PageShell } from '@/components/layout/page-shell';
import { NotificationsPanel } from '@/components/notifications/notifications-panel';
import { fetchNotifications, fetchUnreadNotificationCount } from '@/lib/api';
import { requireToken, requireUser } from '@/lib/auth';

export const metadata: Metadata = { title: 'Notifications' };

export default async function NotificationsPage() {
  const user = await requireUser();
  const token = requireToken();
  const [notifications, unread] = await Promise.all([
    fetchNotifications(token),
    fetchUnreadNotificationCount(token)
  ]);

  return (
    <PageShell user={user} width="medium">
      <PageHeader
        title="Notifications"
        description={
          user.role === 'ADMIN'
            ? 'New requests, cancellations and the daily digest.'
            : 'Decisions on your requests and recorded sick leave.'
        }
      />
      <NotificationsPanel
        title="All notifications"
        notifications={notifications}
        unreadCount={unread.unread}
        emptyText="Nothing here yet. You’ll see updates about your requests here."
      />
    </PageShell>
  );
}
