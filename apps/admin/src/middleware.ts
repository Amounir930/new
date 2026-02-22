import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('adm_tkn')?.value;
  const { pathname } = request.nextUrl;

  // Protect /super-admin routes
  if (pathname.startsWith('/super-admin')) {
    if (!token) {
      const loginUrl = new URL('/login', request.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  // Protect /dashboard (merchant routes)
  if (pathname.startsWith('/dashboard') || pathname.startsWith('/orders') || pathname.startsWith('/products')) {
    if (!token) {
      const loginUrl = new URL('/login', request.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  // Redirect /login to /onboarding if already authenticated, assuming the onboarding redirect logic catches valid stores.
  if (pathname === '/login' || pathname === '/') {
    if (token) {
      const dashboardUrl = new URL('/onboarding', request.url);
      return NextResponse.redirect(dashboardUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/super-admin/:path*', '/login'],
};
