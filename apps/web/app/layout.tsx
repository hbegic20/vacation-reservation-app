import type { Metadata } from 'next';
import { ReactNode } from 'react';
import { ThemeProvider } from '@/components/layout/theme-provider';
import './globals.css';

export const metadata: Metadata = {
  title: 'Vacation Reservation App',
  description: 'Company-wide leave management platform'
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
