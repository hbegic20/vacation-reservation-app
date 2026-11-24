import { ReactNode } from 'react';

interface FieldProps {
  id: string;
  label: string;
  hint?: string;
  children: ReactNode;
}

export function Field({ id, label, hint, children }: FieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-semibold">
        {label}
      </label>
      {children}
      {hint ? <p className="text-[13px] text-muted-foreground">{hint}</p> : null}
    </div>
  );
}
