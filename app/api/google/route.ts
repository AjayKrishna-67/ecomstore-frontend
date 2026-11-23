import { NextResponse } from 'next/server';
import { authenticateWithGoogle } from '@/providers/custom-plugins';
import { getSession, setAuthToken } from '@/lib/session';
import { login as loginWithPassword } from '@/providers/account';

// Type guard functions
function isCurrentUser(
  result: any,
): result is { id: string; identifier: string; __typename?: 'CurrentUser' } {
  return (
    result &&
    typeof result.id === 'string' &&
    typeof result.identifier === 'string'
  );
}

function isInvalidCredentialsError(
  result: any,
): result is { message: string; __typename: 'InvalidCredentialsError' } {
  return result && result.__typename === 'InvalidCredentialsError';
}

function isNotVerifiedError(
  result: any,
): result is { message: string; __typename: 'NotVerifiedError' } {
  return result && result.__typename === 'NotVerifiedError';
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const action = body.action?.toString();
    const redirectTo = body.redirectTo?.toString();

    // Get session up-front (used by both flows)
    const session = await getSession();

    // ----- Email/password login flow -----
    if (action === 'login') {
      const email = body.email?.toString();
      const password = body.password?.toString();

      if (!email || !password) {
        return NextResponse.json(
          { error: 'Email and password are required' },
          { status: 400 },
        );
      }

      console.log('Attempting password authentication for:', email);
      const loginResult = await loginWithPassword(email, password, true);

      if (loginResult.__typename !== 'CurrentUser') {
        const message =
          (loginResult as any).message || 'Invalid email or password';
        console.error('Password login failed:', message);
        return NextResponse.json({ error: message }, { status: 401 });
      }

      const vendureToken = loginResult._headers.get('vendure-auth-token');
      if (vendureToken) {
        session.authToken = vendureToken;
      }
      (session as any).channelToken = 'Ind-Snacks';
      (session as any).userId = loginResult.id;
      (session as any).identifier = loginResult.identifier;
      (session as any).rememberMe = true;

      await session.save();

      const targetPath = redirectTo || '/';
      const url = new URL(targetPath, request.url);
      url.searchParams.set('reload', 'true');
      url.searchParams.set('loginSuccess', 'true');

      return NextResponse.json({
        success: true,
        redirectUrl: url.pathname + url.search,
      });
    }

    // ----- Google token flow -----
    const token = body.token?.toString();

    if (!token) {
      console.error('No token provided');
      return NextResponse.json({ error: 'No token provided' }, { status: 400 });
    }

    // Read anonymous auth token for cart merge
    const anonymousAuthToken = session.authToken;

    console.log('Attempting Google authentication...');
    const { result: authResult, headers: authHeaders } = await authenticateWithGoogle(token, anonymousAuthToken);

    console.log('Auth result:', authResult);

    if (isInvalidCredentialsError(authResult)) {
      console.error('Invalid credentials:', authResult.message);
      return NextResponse.json({ error: authResult.message }, { status: 401 });
    }

    if (isNotVerifiedError(authResult)) {
      console.error('Email not verified:', authResult.message);
      return NextResponse.json({ error: authResult.message }, { status: 401 });
    }

    if (isCurrentUser(authResult)) {
      console.log('Authentication successful for user:', authResult.identifier);

      // Save the authenticated vendure-auth-token to session
      const vendureToken = authHeaders.get('vendure-auth-token');
      if (vendureToken) {
        session.authToken = vendureToken;
      }
      (session as any).channelToken = 'Ind-Snacks';
      (session as any).userId = authResult.id;
      (session as any).identifier = authResult.identifier;
      (session as any).rememberMe = true;

      await session.save();

      // Build redirect URL — go straight to target (or home).
      // Phone-number prompt is no longer enforced after login.
      const targetPath = redirectTo || '/';
      const url = new URL(targetPath, request.url);
      url.searchParams.set('reload', 'true');
      url.searchParams.set('loginSuccess', 'true');

      // Pass referrerId through if present in formData so client can auto-register
      const referrerId = body.referrerId?.toString();
      if (referrerId) {
        url.searchParams.set('pendingReferral', referrerId);
      }

      return NextResponse.json({ success: true, redirectUrl: url.pathname + url.search });
    }

    // Handle other possible error types
    console.error('Unexpected authentication result:', authResult);
    return NextResponse.json({ error: 'Authentication failed' }, { status: 401 });
  } catch (error) {
    console.error('Google authentication error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
