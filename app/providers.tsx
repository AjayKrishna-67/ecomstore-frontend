'use client';

import { ThemeProvider } from 'next-themes';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { ActiveOrderProvider } from '@/hooks/use-active-order';
import '@/i18n/client';

interface ProvidersProps {
  children: React.ReactNode;
  googleClientId: string;
}

export function Providers({ children, googleClientId }: ProvidersProps) {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
      <GoogleOAuthProvider clientId={googleClientId}>
        <ActiveOrderProvider>{children}</ActiveOrderProvider>
      </GoogleOAuthProvider>
    </ThemeProvider>
  );
}
