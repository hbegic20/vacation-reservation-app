import { cn } from '@/lib/utils';
import { TextareaHTMLAttributes } from 'react';

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        'w-full rounded-xl border border-border bg-transparent px-3 py-2 text-sm outline-none ring-primary transition focus:ring-2',
        className
      )}
      {...props}
    />
  );
}
