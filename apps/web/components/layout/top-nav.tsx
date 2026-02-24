import Link from 'next/link';
import { AuthUser } from '@vacation/shared';
import { ThemeToggle } from './theme-toggle';
import { logoutAction } from '@/app/actions';
import { Button } from '../ui/button';

export function TopNav({ user }: { user: AuthUser }) {
  return (
    <header className="sticky top-0 z-20 border-b border-border/60 bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="text-sm font-semibold tracking-wide text-primary">
            Vacation Hub
          </Link>
          <nav className="flex gap-2 text-sm">
            <Link className="rounded-lg px-3 py-1.5 hover:bg-muted" href="/dashboard">
              Dashboard
            </Link>
            <Link className="rounded-lg px-3 py-1.5 hover:bg-muted" href="/vacations">
              Vacations
            </Link>
            {user.role === 'ADMIN' ? (
              <>
                <Link className="rounded-lg px-3 py-1.5 hover:bg-muted" href="/admin">
                  Admin
                </Link>
                <Link className="rounded-lg px-3 py-1.5 hover:bg-muted" href="/admin/calendar">
                  Calendar
                </Link>
                <Link className="rounded-lg px-3 py-1.5 hover:bg-muted" href="/admin/admins">
                  Admins
                </Link>
              </>
            ) : null}
          </nav>
        </div>
        <div className="flex items-center gap-2">
          <span className="hidden text-xs text-muted-foreground sm:inline">
            {user.firstName} {user.lastName} · {user.email}
          </span>
          <ThemeToggle />
          <form action={logoutAction}>
            <Button type="submit" variant="secondary">
              Logout
            </Button>
          </form>
        </div>
      </div>
    </header>
  );
}
