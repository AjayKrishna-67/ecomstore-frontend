'use client';

import { Suspense, useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

function VerifyContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('No verification token provided');
      return;
    }

    fetch('/api/google', {
      method: 'POST',
      body: JSON.stringify({ action: 'verify', token }),
      headers: { 'Content-Type': 'application/json' },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setStatus('success');
          setMessage('Your email has been verified successfully!');
        } else {
          setStatus('error');
          setMessage(data.error || 'Verification failed');
        }
      })
      .catch(() => {
        setStatus('error');
        setMessage('An error occurred during verification');
      });
  }, [token]);

  return (
    <div className="w-full max-w-md p-8 bg-surface rounded-xl shadow-lg text-center">
      {status === 'loading' && (
        <p className="text-text-tertiary">Verifying your account...</p>
      )}
      {status === 'success' && (
        <>
          <h1 className="text-2xl font-bold text-green-600 mb-4">Verified!</h1>
          <p className="mb-6">{message}</p>
          <Link
            href="/"
            className="bg-navy text-white px-6 py-3 rounded-lg font-semibold"
          >
            Go to Home
          </Link>
        </>
      )}
      {status === 'error' && (
        <>
          <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
          <p className="mb-6">{message}</p>
          <Link
            href="/"
            className="text-spice hover:underline font-semibold"
          >
            Go to Home
          </Link>
        </>
      )}
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense
      fallback={
        <div className="w-full max-w-md p-8 bg-surface rounded-xl shadow-lg text-center">
          <p className="text-text-tertiary">Verifying your account...</p>
        </div>
      }
    >
      <VerifyContent />
    </Suspense>
  );
}
