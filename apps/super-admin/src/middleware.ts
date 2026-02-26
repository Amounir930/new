import { jwtVerify } from 'jose';
import { type NextRequest, NextResponse } from 'next/server';

const JWT_SECRET = process.env.JWT_SECRET;
const PROTECTED_PREFIXES = [
  '/dashboard',
  '/tenants',
  '/blueprints',
  '/infra',
  '/security',
  '/settings',
  '/orders',
  '/products',
];

async function verifyToken(token: string) {
  if (!JWT_SECRET) {
    throw new Error('JWT_SECRET missing');
  }
  const secret = new TextEncoder().encode(JWT_SECRET);
  const { payload } = await jwtVerify(token, secret);
  return payload;
}

function isProtectedRoute(pathname: string): boolean {
  return PROTECTED_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

async function handleProtected(request: NextRequest, token?: string) {
  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  try {
    const payload = await verifyToken(token);
    if (payload.role !== 'super_admin') {
      throw new Error('Role mismatch');
    }
    return NextResponse.next();
  } catch (_error) {
    const response = NextResponse.redirect(new URL('/login', request.url));
    response.cookies.delete('adm_tkn');
    return response;
  }
}

async function handleAuthRedirect(request: NextRequest, token?: string) {
  if (!token || !JWT_SECRET) return NextResponse.next();

  try {
    const payload = await verifyToken(token);
    if (payload.role === 'super_admin') {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  } catch (_e) {
    // Ignore invalid tokens on login page
  }
  return NextResponse.next();
}

export async function middleware(request: NextRequest) {
  const token = request.cookies.get('adm_tkn')?.value;
  const { pathname } = request.nextUrl;

  if (isProtectedRoute(pathname)) {
    return handleProtected(request, token);
  }

  if (pathname === '/' || pathname === '/login') {
    return handleAuthRedirect(request, token);
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
    '/orders/:path*',
    '/products/:path*',
    '/login',
    '/',
  ],
};
