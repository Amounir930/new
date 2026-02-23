import { type NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = process.env.JWT_SECRET;

export async function middleware(request: NextRequest) {
  const token = request.cookies.get('adm_tkn')?.value;
  const { pathname } = request.nextUrl;

  // Protected paths for system governance
  const isProtected = pathname.startsWith('/dashboard') || 
                     pathname.startsWith('/tenants') || 
                     pathname.startsWith('/blueprints') ||
                     pathname.startsWith('/infra') ||
                     pathname.startsWith('/security') ||
                     pathname.startsWith('/settings');

  if (isProtected) {
    if (!token) {
      console.warn(`[Security] Unauthenticated attempt to ${pathname}`);
      return NextResponse.redirect(new URL('/login', request.url));
    }

    try {
      if (!JWT_SECRET) {
        console.error('❌ S1 Violation: JWT_SECRET missing from environment.');
        throw new Error('Internal Configuration Error');
      }
      const secret = new TextEncoder().encode(JWT_SECRET);
      const { payload } = await jwtVerify(token, secret);

      if (payload.role !== 'super_admin') {
        console.warn(`[Security] Non-super-admin access attempt: ${payload.role}`);
        return NextResponse.redirect(new URL('/login', request.url));
      }
    } catch (error) {
      console.error('[Security] Auth Verification Failed:', error);
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  // Redirect /login back to dashboard if already authenticated
  if (pathname === '/login' || pathname === '/') {
    if (token && JWT_SECRET) {
      try {
        const secret = new TextEncoder().encode(JWT_SECRET);
        const { payload } = await jwtVerify(token, secret);
        if (payload.role === 'super_admin') {
          return NextResponse.redirect(new URL('/dashboard', request.url));
        }
      } catch (e) {
        // Soft fail
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*', 
    '/tenants/:path*', 
    '/blueprints/:path*', 
    '/infra/:path*', 
    '/security/:path*', 
    '/settings/:path*', 
    '/login', 
    '/'
  ],
};
