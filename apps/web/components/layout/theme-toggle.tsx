'use client';

import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { Icon } from '@/components/ui/icon';

export function ThemeToggle() {
  const [mounted, setMounted] = useState(false);
  const { resolvedTheme, setTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted && resolvedTheme === 'dark';

  return (
    <button
      type="button"
      aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
      disabled={!mounted}
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className="grid h-11 w-11 place-items-center rounded-xl border border-border bg-card text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
    >
      <Icon name={isDark ? 'sun' : 'moon'} size={18} />
    </button>
  );
}
