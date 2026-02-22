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

  // 3. Generate Security Nonce (S8)
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64');

  // 4. Content Security Policy with Nonce (S8)
  const cspHeader = `
    default-src 'self' localhost:* https://*.60sec.shop;
    script-src 'self' 'nonce-${nonce}' 'strict-dynamic' https://*.60sec.shop localhost:* 'unsafe-eval';
    style-src 'self' 'nonce-${nonce}' https://fonts.googleapis.com https://*.60sec.shop localhost:* 'unsafe-inline';
    img-src 'self' data: https: https://*.60sec.shop localhost:*;
    font-src 'self' data: https://fonts.gstatic.com https://*.60sec.shop localhost:*;
    connect-src 'self' https://*.60sec.shop http://localhost:*;
    frame-ancestors 'none';
    base-uri 'self';
    form-action 'self';
  `.replace(/\s{2,}/g, ' ').trim();

  // 5. Inject tenant info and security headers
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-nonce', nonce);
  requestHeaders.set('Content-Security-Policy', cspHeader);

  if (subdomain && !isInfra) {
    requestHeaders.set('x-tenant-id', subdomain);
  } else {
    requestHeaders.set('x-tenant-id', 'public');
  }

  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  // 6. Set response headers for security (S8)
  response.headers.set('Content-Security-Policy', cspHeader);
  response.headers.set('x-nonce', nonce);

  return response;
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
