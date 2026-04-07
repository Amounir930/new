import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * 🛡️ Next.js Registration Proxy (Protocol S2/S5)
 * Proxies POST /api/v1/auth/register-tenant to the internal NestJS backend.
 * Resolves the 404 issue on the marketing landing page (60sec.shop).
 */
export async function POST(request: NextRequest) {
  const backendUrl = process.env.INTERNAL_API_URL || 'http://api:3000/api/v1';
  const targetUrl = `${backendUrl}/auth/register-tenant`;

  const headers = new Headers(request.headers);
  headers.set('host', 'api:3000');
  headers.set('x-tenant-id', 'public');

  try {
    const body = await request.blob();

    const res = await fetch(targetUrl, {
      method: 'POST',
      headers: headers,
      body: body,
      cache: 'no-store',
    });

    const data = await res.blob();
    const responseHeaders = new Headers(res.headers);
    responseHeaders.delete('server');
    responseHeaders.delete('x-powered-by');

    return new NextResponse(data, {
      status: res.status,
      headers: responseHeaders,
    });
  } catch (error: any) {
    console.error('[REGISTRATION-PROXY-ERROR]:', error);
    return NextResponse.json(
      {
        error: 'Internal API Gateway Error',
        message: 'Failed to reach registration service.',
      },
      { status: 502 }
    );
  }
}
