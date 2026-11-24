import Link from 'next/link';
import { ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  description?: ReactNode;
  back?: { href: string; label: string };
  actions?: ReactNode;
}

export function PageHeader({ title, description, back, actions }: PageHeaderProps) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        {back ? (
          <Link href={back.href} className="text-sm font-semibold text-primary-text">
            ← {back.label}
          </Link>
        ) : null}
        <h1 className={`font-display text-[34px] font-bold leading-tight tracking-tight ${back ? 'mt-2.5' : ''}`}>
          {title}
        </h1>
        {description ? <p className="mt-1.5 text-muted-foreground">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-2.5">{actions}</div> : null}
    </div>
  );
}
