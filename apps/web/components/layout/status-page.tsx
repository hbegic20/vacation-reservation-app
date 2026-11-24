import { ReactNode } from 'react';
import { Icon } from '@/components/ui/icon';

interface StatusPageProps {
  code?: string;
  title: string;
  description: string;
  actions: ReactNode;
}

export function StatusPage({ code, title, description, actions }: StatusPageProps) {
  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="flex w-full max-w-md flex-col gap-6">
        <div className="flex items-center gap-2.5">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary text-white">
            <Icon name="logo" size={22} />
          </span>
          <span className="font-display text-xl font-bold">Vacation Hub</span>
        </div>
        <div className="flex flex-col gap-5 rounded-2xl border border-border bg-card p-7">
          <div>
            {code ? <p className="font-display text-sm font-semibold text-primary-text">{code}</p> : null}
            <h1 className="mt-1 font-display text-[28px] font-bold leading-tight tracking-tight">{title}</h1>
            <p className="mt-1.5 text-muted-foreground">{description}</p>
          </div>
          <div className="flex flex-wrap gap-2.5">{actions}</div>
        </div>
      </div>
    </main>
  );
}
