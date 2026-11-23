import type { Metadata } from 'next';
import { Suspense } from 'react';
import { Providers } from './providers';
import { MetaPixel } from '@/components/MetaPixel';
import { APP_META_TITLE, APP_META_DESCRIPTION } from '@/lib/constants';
import './globals.css';

export const metadata: Metadata = {
  title: APP_META_TITLE,
  description: APP_META_DESCRIPTION,
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const googleClientId =
    process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID || '';

  return (
    <html lang="en" suppressHydrationWarning>
      <head />
      <body>
        <Suspense fallback={null}>
          <MetaPixel />
        </Suspense>
        <Providers googleClientId={googleClientId}>{children}</Providers>
      </body>
    </html>
  );
}
