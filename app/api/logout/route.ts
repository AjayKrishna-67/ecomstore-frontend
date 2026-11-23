import { NextResponse } from 'next/server';
import { getSession, destroySession } from '@/lib/session';
import { logout } from '@/providers/account';

export async function POST() {
  const session = await getSession();
  const authToken = session.authToken;

  if (authToken) {
    try {
      await logout();
    } catch (err) {
      console.error('Error logging out:', err);
    }
  }

  // Always destroy local session
  await destroySession();

  return NextResponse.json({ success: true });
}
