'use client';

import Link from 'next/link';
import { Button, buttonStyles } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface ErrorPageProps {
  reset: () => void;
}

export default function ErrorPage({ reset }: ErrorPageProps) {
  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md space-y-4">
        <div>
          <h1 className="text-2xl font-bold">Something went wrong</h1>
          <p className="text-sm text-muted-foreground">
            We could not load this page. The server may be unavailable. Please try again.
          </p>
        </div>
        <div className="flex gap-2">
          <Button type="button" onClick={reset}>
            Try again
          </Button>
          <Link href="/dashboard" className={buttonStyles('secondary')}>
            Go to dashboard
          </Link>
        </div>
      </Card>
    </main>
  );
}
