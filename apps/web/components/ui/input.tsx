import { cn } from '@/lib/utils';
import { InputHTMLAttributes } from 'react';

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        'w-full rounded-xl border border-border bg-transparent px-3 py-2 text-sm outline-none ring-primary transition focus:ring-2',
        className
      )}
      {...props}
    />
  );
}
