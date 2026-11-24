import Link from 'next/link';
import { Icon } from '@/components/ui/icon';

export function NotificationsBell({ unreadCount }: { unreadCount: number }) {
  const label = unreadCount === 0 ? 'Notifications' : `Notifications, ${unreadCount} unread`;

  return (
    <Link
      href="/notifications"
      aria-label={label}
      className="relative grid h-11 w-11 place-items-center rounded-xl border border-border bg-card text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
    >
      <Icon name="bell" size={18} />
      {unreadCount > 0 ? (
        <span
          aria-hidden="true"
          className="absolute -right-1.5 -top-1.5 grid h-5 min-w-5 place-items-center rounded-full bg-danger px-1.5 text-[11px] font-bold text-white dark:text-background"
        >
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      ) : null}
    </Link>
  );
}
