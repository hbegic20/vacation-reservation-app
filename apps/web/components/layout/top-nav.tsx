import Link from 'next/link';
import { AuthUser } from '@vacation/shared';
import { logoutAction } from '@/app/actions';
import { Icon } from '@/components/ui/icon';
import { navItemsFor } from './nav-items';
import { DesktopNavLinks, MobileTabBar } from './nav-links';
import { ThemeToggle } from './theme-toggle';

function initials(user: AuthUser): string {
  return `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase();
}

export function TopNav({ user }: { user: AuthUser }) {
  const items = navItemsFor(user.role);

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
            <ThemeToggle />
            <div className="hidden items-center gap-2.5 rounded-xl border border-border py-1 pl-3 pr-1 sm:flex">
              <span className="text-sm font-semibold">
                {user.firstName} {user.lastName}
              </span>
              <span
                aria-hidden="true"
                className="grid h-9 w-9 place-items-center rounded-[9px] bg-primary-soft text-[13px] font-bold text-primary-text"
              >
                {initials(user)}
              </span>
            </div>
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
