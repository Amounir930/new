import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * S2 HOTFIX: Multi-tenant Middleware with Subdomain Rewrite
 *
 * PROBLEM SOLVED: force-dynamic kills ALL caching (DB crushed under load),
 * but ISR with Host header causes cross-tenant cache poisoning.
 *
 * SOLUTION: Rewrite the URL to include the subdomain in the PATH.
 * e.g. store1.60sec.shop/ → internally routed as /m/store1/
 * Next.js sees each subdomain as a DIFFERENT page → safe per-tenant ISR caching.
 */
export function middleware(request: NextRequest) {
  // S2 FIX 18C: Only trust the raw Host header (TLS/SNI verified).
  // x-forwarded-host is client-controllable and enables cache poisoning.
  const host = request.headers.get('host') || '';

  // S2 FIX: Strip port from host to prevent resolution failure (Point 4)
  const cleanHost = host.split(':')[0];
  const isApexDomain = cleanHost.endsWith('.60sec.shop') || cleanHost.includes('localhost');
  let tenantIdentifier = cleanHost; // Default for custom domains

  if (isApexDomain) {
    const parts = cleanHost.split('.');
    if (cleanHost.includes('localhost')) {
      if (parts.length > 2) tenantIdentifier = parts[0];
    } else {
      // S2 FIX 16B: Explicitly handle root domain (parts.length < 3)
      if (parts.length < 3) {
        tenantIdentifier = ''; // Root domain
      } else {
        // e.g. store1.60sec.shop -> parts = [store1, 60sec, shop] -> index length-3
        tenantIdentifier = parts[parts.length - 3];
      }
    }
  }

  // S2: Decide if we should intercept or let infra handle it
  const infraSubdomains = ['api', 'super-admin', 'git', 'www', 'admin', 'staging'];
  // If no identifier (root) or identifier is in infra list
  const isInfra = !tenantIdentifier || infraSubdomains.includes(tenantIdentifier.toLowerCase());

  // S8 FIX 13A: RESTORED 'unsafe-inline' for React Hydration (Next.js App Router dependency)
  // Nonces are incompatible with ISR, so we stick to 'self' and trusted domains + inline.
  const cspHeader = `
    default-src 'self' localhost:* https://*.60sec.shop;
    script-src 'self' https://*.60sec.shop localhost:* 'unsafe-eval' 'unsafe-inline';
    style-src 'self' https://fonts.googleapis.com https://*.60sec.shop localhost:* 'unsafe-inline';
    img-src 'self' data: https: https://*.60sec.shop localhost:*;
    font-src 'self' data: https://fonts.gstatic.com https://*.60sec.shop localhost:*;
    connect-src 'self' https://*.60sec.shop http://localhost:*;
    frame-ancestors 'none';
    base-uri 'self';
    form-action 'self';
  `.replace(/\s{2,}/g, ' ').trim();

  // Build request headers
  const requestHeaders = new Headers(request.headers);
  requestHeaders.delete('x-tenant-id'); // S2: Never trust client-provided tenant
  requestHeaders.set('Content-Security-Policy', cspHeader);

  if (tenantIdentifier && !isInfra) {
    requestHeaders.set('x-tenant-id', tenantIdentifier);

    // S12 HOTFIX: Use tenantIdentifier for internal path-based ISR isolation
    const url = request.nextUrl.clone();
    url.pathname = `/m/${tenantIdentifier}${url.pathname}`;

    const response = NextResponse.rewrite(url, {
      request: { headers: requestHeaders },
    });
    response.headers.set('Content-Security-Policy', cspHeader);
    return response;
  }

  requestHeaders.set('x-tenant-id', 'public');

  const response = NextResponse.next({
    request: { headers: requestHeaders },
  });
  response.headers.set('Content-Security-Policy', cspHeader);
  return response;
}

export const config = {
  matcher: [
    // S2 FIX 16A: SEO-Safe Matcher (Only ignore specific static extensions)
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|css|js|woff|woff2)$).*)',
  ],
};
