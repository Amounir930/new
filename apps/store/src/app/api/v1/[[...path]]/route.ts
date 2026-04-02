import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * Ìª°Ô∏è Next.js Catch-all API Proxy (Protocol S2/S5)
 * Proxies all requests at /api/v1/* to the NestJS backend on the root domain.
 * This resolves the 404 issue on the marketing landing page (60sec.shop).
 */
async function handle(
  request: NextRequest,
  { params }: { params: Promise<{ path?: string[] }> }
) {
  const { path } = await params;
  const pathString = path ? path.join('/') : '';
  const searchParams = request.nextUrl.searchParams.toString();
  
  // Resolve Backend URL: Secure Internal Link within Docker Network
  const backendUrl = process.env.INTERNAL_API_URL || 'http://api:3000/api/v1';
  const targetUrl = `${backendUrl}/${pathString}${searchParams ? '?' + searchParams : ''}`;

  const headers = new Headers(request.headers);
  // Ensure the host is correct for the backend service (NestJS expects internal host)
  headers.set('host', 'api:3000');
  // Pass tenant context (always 'public' for marketing domain API calls)
  headers.set('x-tenant-id', 'public');

  try {
    const res = await fetch(targetUrl, {
      method: request.method,
      headers: headers,
      body: request.method !== 'GET' && request.method !== 'HEAD' ? await request.blob() : undefined,
      cache: 'no-store',
    });

    const data = await res.blob();
    
    const responseHeaders = new Headers(res.headers);
    // Mask security headers that shouldn't leak from internal API
    responseHeaders.delete('server');
    responseHeaders.delete('x-powered-by');

    return new NextResponse(data, {
      status: res.status,
      headers: responseHeaders,
    });
  } catch (error) {
    console.error('[API-PROXY-ERROR]:', error);
    return NextResponse.json(
      { error: 'Internal API Gateway Error', message: 'Failed to reach the backend service.' },
      { status: 502 }
    );
  }
}

export const GET = handle;
export const POST = handle;
export const PUT = handle;
export const PATCH = handle;
export const DELETE = handle;
