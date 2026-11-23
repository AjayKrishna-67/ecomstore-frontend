'use client';

// next-app/components/Google/GoogleLoginButton.tsx

import { GoogleLogin } from '@react-oauth/google';
import { useEffect, useState } from 'react';
import { trackLogin, trackSignUp } from '@/lib/fbpixel';

interface GoogleLoginButtonProps {
  redirectTo?: string;
  size?: 'small' | 'medium' | 'large';
  text?: 'signin' | 'signin_with' | 'signup_with' | 'continue_with';
  width?: number;
}

export function GoogleLoginButton({
  redirectTo,
  size = 'medium',
  text = 'signin',
  width,
}: GoogleLoginButtonProps) {
  const [fetcherState, setFetcherState] = useState<'idle' | 'submitting'>('idle');
  const [fetcherData, setFetcherData] = useState<{ error?: string } | null>(null);

  // This effect can show alerts or toasts based on the backend response
  useEffect(() => {
    if (fetcherData?.error) {
      alert(`Login failed: ${fetcherData.error}`);
    }
  }, [fetcherData]);

  const handleSubmit = async (formData: Record<string, string>) => {
    setFetcherState('submitting');
    try {
      const res = await fetch('/api/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (data.redirectUrl) {
        // Distinguish new vs existing user when the API tells us; otherwise
        // default to Login.
        if (data.isNewUser || data.registered) {
          trackSignUp('google');
        } else {
          trackLogin('google');
        }
        window.location.href = data.redirectUrl;
        return;
      }
      setFetcherData(data);
    } catch (err) {
      setFetcherData({ error: 'Network error' });
    } finally {
      setFetcherState('idle');
    }
  };

  return (
    <div className="relative">
      <GoogleLogin
        onSuccess={(credentialResponse) => {
          const token = credentialResponse.credential; // This is the correct ID Token (JWT)
          if (token) {
            const formData: Record<string, string> = { token };
            if (redirectTo) {
              formData.redirectTo = redirectTo;
            }
            // Include referrerId from localStorage for auto-referral registration
            const storedReferrerId = typeof window !== 'undefined'
              ? localStorage.getItem('referrerId')
              : null;
            if (storedReferrerId) {
              formData.referrerId = storedReferrerId;
            }
            handleSubmit(formData);
          }
        }}
        onError={() => {
          console.error('Google login failed');
        }}
        theme="outline"
        size={size}
        text={text}
        shape="rectangular"
        width={width?.toString()}
      />

      {/* Loading overlay */}
      {fetcherState === 'submitting' && (
        <div className="absolute inset-0 bg-white/80 rounded flex items-center justify-center">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
            <span>Signing in...</span>
          </div>
        </div>
      )}
    </div>
  );
}
