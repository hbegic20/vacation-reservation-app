import { cn } from '@/lib/utils';
import { ButtonHTMLAttributes } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';

const variants: Record<ButtonVariant, string> = {
  primary: 'bg-primary text-white hover:opacity-90',
  secondary: 'bg-card text-foreground border border-border hover:bg-muted/70',
  danger: 'bg-red-600 text-white hover:bg-red-500',
  ghost: 'text-foreground hover:bg-muted/70'
};

export function buttonStyles(variant: ButtonVariant = 'primary', className?: string) {
  return cn(
    'inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50',
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
