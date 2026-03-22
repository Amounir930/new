import { jwtVerify } from 'jose';
import { type NextRequest, NextResponse } from 'next/server';

const JWT_SECRET = process['env']['JWT_SECRET'];
const MERCHANT_PROTECTED_ROUTES = ['/dashboard', '/orders', '/products'];

async function verifyMerchantToken(token: string) {
  if (!JWT_SECRET) throw new Error('JWT_SECRET missing');
  try {
    const secret = new TextEncoder().encode(JWT_SECRET);
    const { payload } = await jwtVerify(token, secret, {
      requiredClaims: ['exp'],
    });
    console.log(
      `[MW] JWT Verified for: ${payload.sub} | Role: ${payload.role} | Tenant: ${payload.tenantId}`
    );
    return payload;
  } catch (err) {
    console.error(
      `[MW] JWT Verification Failed: ${err instanceof Error ? err.message : String(err)}`
    );
    throw err;
  }
}

function isMerchantAuthorized(payload: unknown): boolean {
  if (!payload || typeof payload !== 'object') return false;
  const p = payload as { role?: string; tenantId?: string };
  // Authorized roles for merchant admin portal
  return (
    ['admin', 'staff', 'tenant_admin', 'super_admin'].includes(
      p.role as string
    ) && !!p.tenantId
  );
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
  const { pathname } = request.nextUrl;

  // S8: Check both HttpOnly cookie (adm_tkn) and Frontend fallback (adm_tkn_fe)
  const token =
    request.cookies.get('adm_tkn')?.value ||
    request.cookies.get('adm_tkn_fe')?.value;

  const isProtected = MERCHANT_PROTECTED_ROUTES.some((route) =>
    pathname.startsWith(route)
  );

  if (isProtected) {
    console.log(
      `[MW] Protected Access: ${pathname} | Token Present: ${!!token}`
    );
    const res = await handleMerchantProtected(request, token);
    if (res.status === 307 || res.status === 302) {
      console.log(`[MW] Redirecting to Login from ${pathname}`);
    }
    return res;
  }

  if (pathname === '/login' || pathname === '/') {
    console.log(`[MW] Auth Page: ${pathname} | Token Present: ${!!token}`);
    const res = await handleMerchantAuthRedirect(request, token);
    if (res.status === 307 || res.status === 302) {
      console.log(`[MW] Redirecting to Dashboard from ${pathname}`);
    }
    return res;
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
