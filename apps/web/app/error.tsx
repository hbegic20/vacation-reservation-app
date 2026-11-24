'use client';

import Link from 'next/link';
import { StatusPage } from '@/components/layout/status-page';
import { Button, buttonStyles } from '@/components/ui/button';

interface ErrorPageProps {
  reset: () => void;
}

export default function ErrorPage({ reset }: ErrorPageProps) {
  return (
    <StatusPage
      title="Something went wrong"
      description="We couldn’t load this page. The server may be unavailable. Please try again."
      actions={
        <>
          <Button type="button" onClick={reset}>
            Try again
          </Button>
          <Link href="/dashboard" className={buttonStyles('secondary')}>
            Go to dashboard
          </Link>
        </>
      }
    />
  );
}
