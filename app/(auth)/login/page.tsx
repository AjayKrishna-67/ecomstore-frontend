'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { GoogleLoginButton } from '@/components/Google/GoogleLoginButton';
import Link from 'next/link';
import { trackLogin } from '@/lib/fbpixel';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/google', {
        method: 'POST',
        body: JSON.stringify({ action: 'login', email, password }),
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();

      if (data.success) {
        trackLogin('email');
        router.push('/?loginSuccess=true');
        router.refresh();
      } else {
        setError(data.error || 'Login failed');
      }
    } catch {
      setError('An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md p-8 bg-surface rounded-xl shadow-lg">
      <h1 className="text-2xl font-bold text-foreground mb-6 text-center">
        Sign In
      </h1>

      {error && (
        <div className="mb-4 p-3 rounded bg-red-50 text-red-600 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-4 py-2 rounded-lg border"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-1">
            Password
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full px-4 py-2 rounded-lg border"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-navy text-white rounded-lg font-semibold hover:opacity-90 disabled:opacity-50"
        >
          {loading ? 'Signing in...' : 'Sign In'}
        </button>
      </form>

      <div className="my-6 text-center text-sm text-text-muted">or</div>

      <GoogleLoginButton />

      <p className="mt-6 text-center text-sm text-text-tertiary">
        Don&apos;t have an account?{' '}
        <Link href="/login" className="text-spice hover:underline">
          Sign up
        </Link>
      </p>
    </div>
  );
}
