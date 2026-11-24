import Link from 'next/link';
import { NotificationItem } from '@vacation/shared';
import { markAllNotificationsReadAction, markNotificationReadAction } from '@/app/actions';
import { Button } from '@/components/ui/button';
import { formatTimestamp } from '@/lib/dates';
import { notificationTypeLabels } from '@/lib/labels';
import { cn } from '@/lib/utils';

interface NotificationsPanelProps {
  title: string;
  notifications: NotificationItem[];
  unreadCount: number;
  emptyText?: string;
  limit?: number;
  viewAllHref?: string;
}

export function NotificationsPanel({
  title,
  notifications,
  unreadCount,
  emptyText = 'No notifications yet.',
  limit,
  viewAllHref
}: NotificationsPanelProps) {
  const visible = limit ? notifications.slice(0, limit) : notifications;
  const hasMore = viewAllHref !== undefined && notifications.length > visible.length;

  return (
    <section aria-labelledby="notifications-title" className="overflow-hidden rounded-2xl border border-border bg-card">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-6 py-5">
        <div>
          <h2 id="notifications-title" className="font-display text-[17px] font-semibold">
            {title}
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

      {visible.length === 0 ? (
        <p className="px-6 py-5 text-sm text-muted-foreground">{emptyText}</p>
      ) : (
        <ul>
          {visible.map((notification) => (
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

      {hasMore ? (
        <Link
          href={viewAllHref}
          className="block border-t border-border px-6 py-3.5 text-sm font-semibold text-primary-text hover:bg-muted"
        >
          View all notifications
        </Link>
      ) : null}
    </section>
  );
}
