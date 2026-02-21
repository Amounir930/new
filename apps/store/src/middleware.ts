import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * S2: Tenant Detection Middleware for Storefront
 * Extracts subdomain and injects it as a header for all downstream API requests
 */
export function middleware(request: NextRequest) {
  const host = request.headers.get('host') || '';
  const forwardedHost = request.headers.get('x-forwarded-host');
  const effectiveHost = forwardedHost || host;

  // 1. Extract subdomain
  let subdomain = '';
  const parts = effectiveHost.split('.');

  if (host.includes('localhost')) {
    // localhost:3002 or tenant.localhost:3002
    if (parts.length > 2) subdomain = parts[0];
  } else {
    // tenant.60sec.shop
    if (parts.length >= 3) subdomain = parts[0];
  }

  // 2. Ignore infrastructure subdomains
  const infraSubdomains = [
    'api',
    'super-admin',
    'git',
    'www',
    'admin',
    'staging',
  ];
  const isInfra = infraSubdomains.includes(subdomain.toLowerCase());

  // 3. Inject tenant info into headers for Server Components
  const requestHeaders = new Headers(request.headers);
  if (subdomain && !isInfra) {
    requestHeaders.set('x-tenant-id', subdomain);
  } else {
    requestHeaders.set('x-tenant-id', 'public');
  }

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

// Only run on page routes, not static assets or api routes
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
