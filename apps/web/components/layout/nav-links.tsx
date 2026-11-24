'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Icon } from '@/components/ui/icon';
import { cn } from '@/lib/utils';
import { NavItem } from './nav-items';

function WaitingBadge({ count, className }: { count: number | undefined; className?: string }) {
  if (!count) {
    return null;
  }
  return (
    <>
      <span
        aria-hidden="true"
        className={cn(
          'grid h-5 min-w-5 place-items-center rounded-full bg-warning px-1.5 text-[11px] font-bold text-white dark:text-background',
          className
        )}
      >
        {count}
      </span>
      <span className="sr-only">, {count} waiting</span>
    </>
  );
}

function mostSpecificMatch(items: NavItem[], pathname: string): string | null {
  const matches = items.filter(
    (item) => pathname === item.href || pathname.startsWith(`${item.href}/`)
  );
  const longest = matches.sort((a, b) => b.href.length - a.href.length)[0];
  return longest?.href ?? null;
}

export function DesktopNavLinks({ items }: { items: NavItem[] }) {
  const activeHref = mostSpecificMatch(items, usePathname());

  return (
    <nav aria-label="Main" className="hidden gap-1 md:flex">
      {items.map((item) => {
        const isActive = item.href === activeHref;
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={isActive ? 'page' : undefined}
            className={cn(
              'inline-flex min-h-11 items-center gap-2 rounded-xl px-3.5 text-sm transition-colors',
              isActive
                ? 'bg-primary-soft font-semibold text-primary-text'
                : 'font-medium text-muted-foreground hover:bg-muted hover:text-foreground'
            )}
          >
            {item.label}
            <WaitingBadge count={item.waitingCount} />
          </Link>
        );
      })}
    </nav>
  );
}

export function MobileTabBar({ items }: { items: NavItem[] }) {
  const activeHref = mostSpecificMatch(items, usePathname());

  return (
    <nav
      id="mobile-tab-bar"
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-30 grid border-t border-border bg-card pb-[env(safe-area-inset-bottom)] md:hidden"
      style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}
    >
      {items.map((item) => {
        const isActive = item.href === activeHref;
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={isActive ? 'page' : undefined}
            className={cn(
              'relative flex min-h-16 flex-col items-center justify-center gap-0.5 text-xs',
              isActive ? 'font-bold text-primary-text' : 'font-semibold text-muted-foreground'
            )}
          >
            <Icon name={item.icon} size={22} />
            {item.label}
            <WaitingBadge count={item.waitingCount} className="absolute left-1/2 top-1.5 ml-2" />
          </Link>
        );
      })}
    </nav>
  );
}
