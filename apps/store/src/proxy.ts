import { env } from '@apex/config';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

/**
 * 🛡️ S5 Protocol: Internal Error Masking
 * Prevents raw backend stack traces or messages from leaking to the frontend.
 */
function maskInternalError(tenant: string, _error: unknown) {
  // S4: Log internally for forensics (Not visible to Browser/Client)
  console['error'](`[S5-FORENSICS] Tenant: ${tenant} | Error:`, _error);
  // Mask the message for the response
  return `[S5-SHIELD] Internal Processing Error for tenant: ${tenant}. Please contact support with Ref: ${crypto.randomUUID().slice(0, 8)}`;
}

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
function getTenantIdentifier(host: string): string {
  const cleanHost = host.split(':')[0];
  return resolveTenantIdentifier(cleanHost);
}

function resolveTenantIdentifier(cleanHost: string): string {
  const isApexDomain =
    cleanHost === '60sec.shop' ||
    cleanHost.endsWith('.60sec.shop') ||
    cleanHost.includes('localhost');

  if (isApexDomain) {
    const parts = cleanHost.split('.');
    if (cleanHost.includes('localhost')) {
      return parts.length > 2 ? parts[0] : cleanHost;
    }
    // S2 FIX 16B: Explicitly handle root domain (parts.length < 3)
    if (parts.length < 3) {
      return ''; // Root domain
    }
    // e.g. store1.60sec.shop -> parts = [store1, 60sec, shop] -> index length-3
    return parts[parts.length - 3];
  }
  return cleanHost; // Default for custom domains
}

function getInfraStatus(tenantIdentifier: string): boolean {
  const infraSubdomains = [
    'localhost',
    '127.0.0.1',
    'api',
    'super-admin',
    'git',
    'www',
    'admin',
    'staging',
  ];
  return (
    !tenantIdentifier ||
    infraSubdomains.includes(tenantIdentifier.toLowerCase())
  );
}

function getCSPHeader(): string {
  return `
    default-src 'self' localhost:* https://*.60sec.shop;
    script-src 'self' https://*.60sec.shop localhost:* 'unsafe-eval' 'unsafe-inline';
    style-src 'self' https://fonts.googleapis.com https://*.60sec.shop localhost:* 'unsafe-inline';
    img-src 'self' data: https: https://*.60sec.shop localhost:*;
    font-src 'self' data: https://fonts.gstatic.com https://*.60sec.shop localhost:*;
    connect-src 'self' https://*.60sec.shop http://localhost:*;
    frame-ancestors 'none';
    base-uri 'self';
    form-action 'self';
  `
    .replace(/\s{2,}/g, ' ')
    .trim();
}

export async function proxy(request: NextRequest) {
  const host = request.headers.get('host') || '';
  const tenantIdentifier = getTenantIdentifier(host);
  const isInfra = getInfraStatus(tenantIdentifier);
  const cspHeader = getCSPHeader();

  // Build request headers
  const requestHeaders = new Headers(request.headers);
  requestHeaders.delete('x-tenant-id'); // S2: Never trust client-provided tenant
  requestHeaders.set('Content-Security-Policy', cspHeader);

  if (tenantIdentifier && !isInfra) {
    // Protocol S11: Forensic Tenant Validation (Check if tenant exists in Registry)
    try {
      const apiUrl = env.INTERNAL_API_URL;
      // Edge-compatible fetch caching relies on standard Cache-Control headers from your backend
      // S12 FIX: Removed invalid 'next.revalidate' logic from Edge context to prevent Self-DDoS
      const checkRes = await fetch(
        `${apiUrl}/public/tenants/discovery/${tenantIdentifier.toLowerCase()}`,
        {
          headers: { 'User-Agent': 'Apex-Middleware-Forensics' },
        }
      );

      if (checkRes.status === 404 || checkRes.status === 403) {
        // Ghost Tenant Detected: Exterminate request with 404 rewrite
        const url = request.nextUrl.clone();
        url.pathname = '/404'; // S11 Mandate: Show sterile not-found page
        return NextResponse.rewrite(url, {
          status: 404,
          headers: requestHeaders,
        });
      }

      if (!checkRes.ok) {
        throw new Error(`API Hub returned status ${checkRes.status}`);
      }
    } catch (err) {
      // 🛡️ S5 Mandate: Mask raw errors before they reach the browser engine
      const _maskedMessage = maskInternalError(tenantIdentifier, err);
      // S11 Mandate: Fail-Closed. Show a 503 Service Unavailable page if backend is unreachable.
      const url = request.nextUrl.clone();
      url.pathname = '/503'; // Architectural Requirement: Prevent Fail-Open leaks
      return NextResponse.rewrite(url, {
        status: 503,
        headers: requestHeaders,
      });
    }

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
  // S11: Session Management (Merged from middleware.ts)
  let sessionId = request.cookies.get('cart_sid')?.value;
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    response.cookies.set('cart_sid', sessionId, {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });
  }

  return response;
}

export const config = {
  matcher: [
    // S2 FIX 16A: SEO-Safe Matcher (Only ignore specific static extensions)
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|css|js|woff|woff2)$).*)',
  ],
};
