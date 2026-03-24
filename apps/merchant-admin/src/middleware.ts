import { jwtVerify } from 'jose';
import { type NextRequest, NextResponse } from 'next/server';

const JWT_SECRET = process.env.JWT_SECRET;
const MERCHANT_PROTECTED_ROUTES = ['/dashboard', '/orders', '/products'];

/**
 * 🛡️ Cryptographic JWT Verification
 * S7 Protocol: AES-256-GCM / HMAC Integrity
 */
async function verifyMerchantToken(token: string) {
  if (!JWT_SECRET) {
    throw new Error('S1 Violation: JWT_SECRET missing from environment');
  }
  try {
    const secret = new TextEncoder().encode(JWT_SECRET);
    const { payload } = await jwtVerify(token, secret, {
      requiredClaims: ['exp', 'role', 'tenantId'],
    });
    return payload;
  } catch (err) {
    return null;
  }
}

/**
 * 🛡️ Role-Based Access Control (RBAC) Logic
 */
function isMerchantAuthorized(payload: any): boolean {
  if (!payload || typeof payload !== 'object') return false;
  
  // Strict check for admin-level authority
  const authorizedRoles = ['tenant_admin', 'super_admin', 'admin', 'staff'];
  return (
    authorizedRoles.includes(payload.role) &&
    !!payload.tenantId
  );
}

/**
 * 🛡️ Edge-Level Middleware
 * Enforces route protection and session integrity
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Strictly enforce production cookie: adm_tkn
  const token = request.cookies.get('adm_tkn')?.value;
  
  const isProtectedRoute = MERCHANT_PROTECTED_ROUTES.some((route) =>
    pathname.startsWith(route)
  );

  const isAuthRoute = pathname === '/login' || pathname === '/';

  // 1. Unauthenticated request to protected route -> Redirect to Login
  if (isProtectedRoute && !token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // 2. Perform token verification if present
  if (token) {
    const payload = await verifyMerchantToken(token);

    // Invalid Token on Protected Route -> Redirect to Login
    if (isProtectedRoute && (!payload || !isMerchantAuthorized(payload))) {
      const response = NextResponse.redirect(new URL('/login', request.url));
      response.cookies.delete('adm_tkn'); // Purge corrupt session
      return response;
    }

    // Valid Token on Login Route -> Redirect to Dashboard (Auto-session)
    if (isAuthRoute && payload && isMerchantAuthorized(payload)) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  return NextResponse.next();
}

/**
 * ⚙️ Middleware Performance Configuration
 * Effectively isolates /dashboard and /login routes from static asset processing
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - images/public assets
     */
    '/((?!api|_next/static|_next/image|favicon.ico|[\\w-]+\\.\\w+).*)',
  ],
};
