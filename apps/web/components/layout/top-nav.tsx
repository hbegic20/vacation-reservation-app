import Link from 'next/link';
import { AuthUser } from '@vacation/shared';
import { logoutAction } from '@/app/actions';
import { Icon } from '@/components/ui/icon';
import { fetchSummary, fetchUnreadNotificationCount } from '@/lib/api';
import { changePasswordPath, requireToken } from '@/lib/auth';
import { fullName } from '@/lib/people';
import { navItemsFor } from './nav-items';
import { DesktopNavLinks, MobileTabBar } from './nav-links';
import { NotificationsBell } from './notifications-bell';
import { ThemeToggle } from './theme-toggle';

function initials(user: AuthUser): string {
  return `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase();
}

async function pendingApprovalCount(user: AuthUser, token: string): Promise<number> {
  if (user.role !== 'ADMIN') {
    return 0;
  }
  const summary = await fetchSummary(token);
  return 'pendingApprovals' in summary ? summary.pendingApprovals : 0;
}

export async function TopNav({ user }: { user: AuthUser }) {
  const token = requireToken();
  const [pendingApprovals, unread] = await Promise.all([
    pendingApprovalCount(user, token),
    fetchUnreadNotificationCount(token)
  ]);
  const items = navItemsFor(user.role, pendingApprovals);

  return (
    <>
      <header className="sticky top-0 z-20 border-b border-border bg-card/95 backdrop-blur">
        <div className="mx-auto flex min-h-[68px] max-w-6xl items-center justify-between gap-3 px-4 md:px-6">
          <div className="flex items-center gap-7">
            <Link href="/dashboard" className="flex min-h-11 items-center gap-2.5 text-foreground">
              <span className="grid h-8 w-8 place-items-center rounded-[9px] bg-primary text-white">
                <Icon name="logo" size={18} />
              </span>
              <span className="font-display text-lg font-bold">Vacation Hub</span>
            </Link>
            <DesktopNavLinks items={items} />
          </div>
          <div className="flex items-center gap-2">
            <NotificationsBell unreadCount={unread.unread} />
            <ThemeToggle />
            <Link
              href={changePasswordPath}
              aria-label={`Account settings for ${fullName(user)}`}
              className="flex min-h-11 items-center gap-2.5 rounded-xl border border-border p-1 transition-colors hover:bg-muted sm:pl-3"
            >
              <span className="hidden text-sm font-semibold text-foreground sm:inline">
                {fullName(user)}
              </span>
              <span
                aria-hidden="true"
                className="grid h-9 w-9 place-items-center rounded-[9px] bg-primary-soft text-[13px] font-bold text-primary-text"
              >
                {initials(user)}
              </span>
            </Link>
            <form action={logoutAction}>
              <button
                type="submit"
                aria-label="Log out"
                className="grid h-11 w-11 place-items-center rounded-xl border border-border bg-card text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <Icon name="logout" size={18} />
              </button>
            </form>
          </div>
        </div>
      </header>
      <MobileTabBar items={items} />
    </>
  );
}
