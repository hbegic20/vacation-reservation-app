import { ReactNode } from 'react';
import { AuthUser } from '@vacation/shared';
import { cn } from '@/lib/utils';
import { TopNav } from './top-nav';

const widths = {
  narrow: 'max-w-3xl',
  medium: 'max-w-5xl',
  wide: 'max-w-6xl',
  full: 'max-w-7xl'
};

interface PageShellProps {
  user: AuthUser;
  width?: keyof typeof widths;
  children: ReactNode;
}

export function PageShell({ user, width = 'wide', children }: PageShellProps) {
  return (
    <div>
      <TopNav user={user} />
      <main className={cn('mx-auto flex flex-col gap-6 px-4 pb-14 pt-9 md:px-6', widths[width])}>
        {children}
      </main>
    </div>
  );
}
