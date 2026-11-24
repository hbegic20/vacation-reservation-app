import type { Metadata } from 'next';
import { Inter, Space_Grotesk } from 'next/font/google';
import { ReactNode } from 'react';
import { ThemeProvider } from '@/components/layout/theme-provider';
import './globals.css';

const inter = Inter({ subsets: ['latin', 'latin-ext'], variable: '--font-inter', display: 'swap' });
const spaceGrotesk = Space_Grotesk({
  subsets: ['latin', 'latin-ext'],
  weight: ['500', '600', '700'],
  variable: '--font-space-grotesk',
  display: 'swap'
});

export const metadata: Metadata = {
  title: { default: 'Vacation Hub', template: '%s · Vacation Hub' },
  description: 'Company-wide leave management platform'
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={`${inter.variable} ${spaceGrotesk.variable}`}>
      <body className="font-sans text-[15px] leading-normal antialiased">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
