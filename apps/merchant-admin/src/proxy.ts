import { jwtVerify } from 'jose';
import { type NextRequest, NextResponse } from 'next/server';

const JWT_SECRET = process.env.JWT_SECRET;
const MERCHANT_PROTECTED_ROUTES = ['/dashboard', '/orders', '/products'];

async function verifyMerchantToken(token: string) {
  if (!JWT_SECRET) {
    console.error('[MW] JWT_SECRET missing from environment');
    throw new Error('JWT_SECRET missing');
  }
  try {
    const secret = new TextEncoder().encode(JWT_SECRET);
    const { payload } = await jwtVerify(token, secret, {
      requiredClaims: ['exp'],
    });
    return payload;
  } catch (err) {
    console.error(
      `[MW] JWT Verification Failed: ${err instanceof Error ? err.message : String(err)}`
    );
    throw err;
  }
}

function isMerchantAuthorized(payload: any): boolean {
  if (!payload || typeof payload !== 'object') return false;
  // Authorized roles for merchant admin portal
  return (
    ['admin', 'staff', 'tenant_admin', 'super_admin'].includes(payload.role) &&
    !!payload.tenantId
  );
}

function extractAuthToken(request: NextRequest): string | undefined {
  return (
    request.cookies.get('adm_tkn')?.value ||
    request.cookies.get('adm_tkn_fe')?.value
  );
}

function handleLoginRedirect(
  request: NextRequest,
  payload: any
): NextResponse | undefined {
  const { pathname } = request.nextUrl;
  if (
    (pathname === '/login' || pathname === '/') &&
    isMerchantAuthorized(payload)
  ) {
    console.log('[MW] Redirecting authenticated user to /dashboard');
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }
  return undefined;
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = extractAuthToken(request);
  const isProtected = MERCHANT_PROTECTED_ROUTES.some((route) =>
    pathname.startsWith(route)
  );

  if (!isProtected) {
    if (token) {
      try {
        const payload = await verifyMerchantToken(token);
        return handleLoginRedirect(request, payload) || NextResponse.next();
      } catch {
        return NextResponse.next();
      }
    }
    return NextResponse.next();
  }

  if (!token) {
    console.log(`[MW] Blocking unauthenticated access to ${pathname}`);
    return NextResponse.redirect(new URL('/login', request.url));
  }

  try {
    const payload = await verifyMerchantToken(token);
    if (!isMerchantAuthorized(payload)) {
      console.warn(`[MW] Unauthorized role for user: ${payload.sub}`);
      return NextResponse.redirect(new URL('/login', request.url));
    }
    return NextResponse.next();
  } catch (_error) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
}

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
