import type { Metadata } from 'next';
import Link from 'next/link';
import { StatusPage } from '@/components/layout/status-page';
import { buttonStyles } from '@/components/ui/button';

export const metadata: Metadata = { title: 'Page not found' };

export default function NotFound() {
  return (
    <StatusPage
      code="404"
      title="Page not found"
      description="This page doesn’t exist or was moved. Check the address, or head back to your dashboard."
      actions={
        <Link href="/dashboard" className={buttonStyles()}>
          Go to dashboard
        </Link>
      }
    />
  );
}
