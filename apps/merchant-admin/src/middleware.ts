import { type NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  console.error('❌ S1 Violation: JWT_SECRET is not defined in the environment.');
}

export async function middleware(request: NextRequest) {
  const token = request.cookies.get('adm_tkn')?.value;
  const { pathname } = request.nextUrl;

  // Paths requiring authentication
  const isProtectedRoute = pathname.startsWith('/dashboard') ||
    pathname.startsWith('/orders') ||
    pathname.startsWith('/products');

  if (isProtectedRoute) {
    if (!token) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    try {
      if (!JWT_SECRET) throw new Error('JWT_SECRET missing');
      const secret = new TextEncoder().encode(JWT_SECRET);
      // S1: Explicitly require exp claim for security
      const { payload } = await jwtVerify(token, secret, {
        requiredClaims: ['exp']
      });

      // S2/S8 Identity Enforcement: Verify roles and tenant
      const role = payload.role as string;
      const tenantId = payload.tenantId as string;

      if (!['admin', 'staff'].includes(role) || !tenantId) {
        console.warn(`[Security] Unauthorized role access attempt: ${role}`);
        return NextResponse.redirect(new URL('/login', request.url));
      }

      // TODO: Match tenantId with host context for multi-tenant isolation
    } catch (error) {
      console.error('[Security] JWT Verification Failed:', error);
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  // Redirect /login to /dashboard if already authenticated as merchant
  if (pathname === '/login' || pathname === '/') {
    if (token) {
      try {
        const secret = new TextEncoder().encode(JWT_SECRET);
        const { payload } = await jwtVerify(token, secret);
        if (['admin', 'staff'].includes(payload.role as string)) {
          return NextResponse.redirect(new URL('/dashboard', request.url));
        }
      } catch (e) {
        // Invalid token, allow staying on login page
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/orders/:path*', '/products/:path*', '/login'],
};
