import { getIronSession, IronSession } from 'iron-session';
import { cookies } from 'next/headers';

export interface SessionData {
  authToken?: string;
  activeOrderError?: any;
}

const sessionOptions = {
  password: process.env.SESSION_SECRET || 'dev-only-insecure-session-secret-set-SESSION_SECRET',
  cookieName: 'vendure_session',
  cookieOptions: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
  },
};

export async function getSession(): Promise<IronSession<SessionData>> {
  const cookieStore = await cookies();
  return getIronSession<SessionData>(cookieStore, sessionOptions);
}

export async function getAuthToken(): Promise<string | undefined> {
  const session = await getSession();
  return session.authToken;
}

export async function setAuthToken(token: string): Promise<void> {
  const session = await getSession();
  session.authToken = token;
  await session.save();
}

export async function destroySession(): Promise<void> {
  const session = await getSession();
  session.destroy();
}
