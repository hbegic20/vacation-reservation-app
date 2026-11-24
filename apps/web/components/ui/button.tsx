import { cn } from '@/lib/utils';
import { ButtonHTMLAttributes } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';

const variants: Record<ButtonVariant, string> = {
  primary: 'bg-primary text-white hover:bg-primary/90',
  secondary: 'border border-border bg-card text-foreground hover:bg-muted',
  danger: 'border border-danger bg-card text-danger hover:bg-danger-soft',
  ghost: 'text-foreground hover:bg-muted'
};

export function buttonStyles(variant: ButtonVariant = 'primary', className?: string) {
  return cn(
    'inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50',
    variants[variant],
    className
  );
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

export function Button({ className, variant = 'primary', ...props }: ButtonProps) {
  return <button className={buttonStyles(variant, className)} {...props} />;
}
