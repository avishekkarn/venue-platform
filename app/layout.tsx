import type { Metadata } from 'next';
import type { ReactNode, JSX } from 'react';
import { fontVariables } from '@/lib/fonts';
import './globals.css';

export const metadata: Metadata = {
  title: 'Venue Platform',
};

interface RootLayoutProps {
  children: ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps): JSX.Element {
  return (
    <html lang="en" className={fontVariables}>
      <body>{children}</body>
    </html>
  );
}