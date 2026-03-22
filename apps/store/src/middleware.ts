import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Storefront Middleware
 * Handles session/cart persistence and potential internationalization/multi-tenancy routing.
 */
export function middleware(request: NextRequest) {
  const response = NextResponse.next();
  const { pathname } = request.nextUrl;

  // S11: Device Fingerprinting/Session Management (Simplified)
  // Ensure we have a session ID for cart persistence even for guests
  let sessionId = request.cookies.get('cart_sid')?.value;
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    response.cookies.set('cart_sid', sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
