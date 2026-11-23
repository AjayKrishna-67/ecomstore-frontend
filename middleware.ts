import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Protected routes that require authentication
const protectedPaths = ['/account', '/checkout'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if route requires authentication
  const isProtectedRoute = protectedPaths.some((path) =>
    pathname.startsWith(path),
  );

  if (isProtectedRoute) {
    // Check for session cookie
    const sessionCookie = request.cookies.get('vendure_session');
    if (!sessionCookie) {
      // Redirect to home/login if not authenticated
      const url = request.nextUrl.clone();
      url.pathname = '/';
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/account/:path*', '/checkout/:path*'],
};
