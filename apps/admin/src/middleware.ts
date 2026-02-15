import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    const token = request.cookies.get('admin_token')?.value;
    const { pathname } = request.nextUrl;

    // Protect /super-admin routes
    if (pathname.startsWith('/super-admin')) {
        if (!token) {
            const loginUrl = new URL('/login', request.url);
            return NextResponse.redirect(loginUrl);
        }
    }

    // Redirect /login to /super-admin if already authenticated
    if (pathname === '/login') {
        if (token) {
            const dashboardUrl = new URL('/super-admin', request.url);
            return NextResponse.redirect(dashboardUrl);
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/super-admin/:path*', '/login'],
};
