import { AdminNotificationItem } from '@vacation/shared';
import {
  markAllNotificationsReadAction,
  markNotificationReadAction
} from '@/app/actions';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

function formatDate(date: string) {
  return new Date(date).toISOString().slice(0, 16).replace('T', ' ');
}

export function AdminNotifications({
  notifications,
  unreadCount
}: {
  notifications: AdminNotificationItem[];
  unreadCount: number;
}) {
  return (
    <Card className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Admin Notifications</h2>
          <p className="text-sm text-muted-foreground">Unread: {unreadCount}</p>
        </div>
        <form action={markAllNotificationsReadAction}>
          <Button type="submit" variant="secondary">
            Mark All Read
          </Button>
        </form>
      </div>

      <div className="space-y-2">
        {notifications.length === 0 ? (
          <p className="text-sm text-muted-foreground">No notifications yet.</p>
        ) : (
          notifications.map((notification) => (
            <div
              key={notification.id}
              className={`rounded-xl border p-3 ${notification.isRead ? 'bg-muted/40' : 'bg-card'}`}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold">{notification.title}</p>
                  <p className="text-xs text-muted-foreground">{notification.message}</p>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    {notification.type} · {formatDate(notification.createdAt)}
                  </p>
                </div>
                {!notification.isRead ? (
                  <form action={markNotificationReadAction}>
                    <input type="hidden" name="notificationId" value={notification.id} />
                    <Button type="submit" variant="ghost" className="text-xs">
                      Mark read
                    </Button>
                  </form>
                ) : null}
              </div>
            </div>
          ))
        )}
      </div>
    </Card>
  );
}
