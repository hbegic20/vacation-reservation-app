import { AdminNotificationItem } from '@vacation/shared';
import { markAllNotificationsReadAction, markNotificationReadAction } from '@/app/actions';
import { Button } from '@/components/ui/button';
import { formatTimestamp } from '@/lib/dates';
import { notificationTypeLabels } from '@/lib/labels';
import { cn } from '@/lib/utils';

const visibleLimit = 6;

interface AdminNotificationsProps {
  notifications: AdminNotificationItem[];
  unreadCount: number;
}

export function AdminNotifications({ notifications, unreadCount }: AdminNotificationsProps) {
  return (
    <section aria-labelledby="notifications-title" className="overflow-hidden rounded-2xl border border-border bg-card">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-6 py-5">
        <div>
          <h2 id="notifications-title" className="font-display text-[17px] font-semibold">
            Notifications
          </h2>
          <p className="text-sm text-muted-foreground">
            {unreadCount === 0 ? 'Everything is read.' : `${unreadCount} unread`}
          </p>
        </div>
        {unreadCount > 0 ? (
          <form action={markAllNotificationsReadAction}>
            <Button type="submit" variant="secondary">
              Mark all read
            </Button>
          </form>
        ) : null}
      </div>

      {notifications.length === 0 ? (
        <p className="px-6 py-5 text-sm text-muted-foreground">No notifications yet.</p>
      ) : (
        <ul>
          {notifications.slice(0, visibleLimit).map((notification) => (
            <li
              key={notification.id}
              className={cn(
                'flex items-start justify-between gap-3 border-b border-border px-6 py-4 last:border-b-0',
                notification.isRead ? '' : 'bg-primary-soft/60'
              )}
            >
              <div className="flex min-w-0 gap-3">
                <span
                  aria-hidden="true"
                  className={cn(
                    'mt-2 h-2 w-2 shrink-0 rounded-full',
                    notification.isRead ? 'bg-transparent' : 'bg-primary'
                  )}
                />
                <div className="min-w-0">
                  <p className="text-sm font-semibold">
                    {notification.isRead ? null : <span className="sr-only">Unread: </span>}
                    {notification.title}
                  </p>
                  <p className="text-sm text-muted-foreground">{notification.message}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {notificationTypeLabels[notification.type]} · {formatTimestamp(notification.createdAt)}
                  </p>
                </div>
              </div>
              {notification.isRead ? null : (
                <form action={markNotificationReadAction}>
                  <input type="hidden" name="notificationId" value={notification.id} />
                  <Button type="submit" variant="ghost" className="text-[13px]">
                    Mark read
                  </Button>
                </form>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
