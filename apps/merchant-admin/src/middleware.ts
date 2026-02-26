import { jwtVerify } from 'jose';
import { type NextRequest, NextResponse } from 'next/server';

const JWT_SECRET = process.env.JWT_SECRET;
const MERCHANT_PROTECTED_ROUTES = ['/dashboard', '/orders', '/products'];

async function verifyMerchantToken(token: string) {
  if (!JWT_SECRET) throw new Error('JWT_SECRET missing');
  const secret = new TextEncoder().encode(JWT_SECRET);
  const { payload } = await jwtVerify(token, secret, {
    requiredClaims: ['exp'],
  });
  return payload;
}

function isMerchantAuthorized(payload: any): boolean {
  return ['admin', 'staff'].includes(payload.role) && !!payload.tenantId;
}

async function handleMerchantProtected(request: NextRequest, token?: string) {
  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  try {
    const payload = await verifyMerchantToken(token);
    if (!isMerchantAuthorized(payload)) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    return NextResponse.next();
  } catch (_error) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
}

async function handleMerchantAuthRedirect(
  request: NextRequest,
  token?: string
) {
  if (!token || !JWT_SECRET) return NextResponse.next();
  try {
    const payload = await verifyMerchantToken(token);
    if (isMerchantAuthorized(payload)) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  } catch (_e) {
    // Ignore invalid tokens
  }
  return NextResponse.next();
}

export async function middleware(request: NextRequest) {
  const token = request.cookies.get('adm_tkn')?.value;
  const { pathname } = request.nextUrl;

  const isProtected = MERCHANT_PROTECTED_ROUTES.some((route) =>
    pathname.startsWith(route)
  );

  if (isProtected) {
    return handleMerchantProtected(request, token);
  }

  if (pathname === '/login' || pathname === '/') {
    return handleMerchantAuthRedirect(request, token);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/orders/:path*',
    '/products/:path*',
    '/login',
  ],
};
