import { type NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  console.error('❌ S1 Violation: JWT_SECRET is not defined in the environment.');
}

export async function middleware(request: NextRequest) {
  const token = request.cookies.get('adm_tkn')?.value;
  const { pathname } = request.nextUrl;

  // Paths requiring super_admin role
  const isSuperAdminRoute = pathname.startsWith('/super-admin');

  if (isSuperAdminRoute) {
    if (!token) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    try {
      if (!JWT_SECRET) throw new Error('JWT_SECRET missing');
      const secret = new TextEncoder().encode(JWT_SECRET);
      const { payload } = await jwtVerify(token, secret);

      // Verify super_admin role
      if (payload.role !== 'super_admin') {
        console.warn(`[Security] Non-super-admin access attempt: ${payload.role}`);
        return NextResponse.redirect(new URL('/login', request.url));
      }
    } catch (error) {
      console.error('[Security] JWT Verification Failed:', error);
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  // Redirect /login to /super-admin if already authenticated as super_admin
  if (pathname === '/login' || pathname === '/') {
    if (token) {
      try {
        const secret = new TextEncoder().encode(JWT_SECRET);
        const { payload } = await jwtVerify(token, secret);
        if (payload.role === 'super_admin') {
          return NextResponse.redirect(new URL('/super-admin', request.url));
        }
      } catch (e) {
        // Invalid token
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/super-admin/:path*', '/login'],
};
