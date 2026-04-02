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
  try {
    const resolvedParams = await params;
    const pathSegments = resolvedParams.path || [];
    const pathString = pathSegments.join('/');
    const searchParams = request.nextUrl.searchParams.toString();
    
    // Resolve Backend URL
    const backendUrl = process.env.INTERNAL_API_URL || 'http://api:3000/api/v1';
    // S2 FIX: Proper URL normalization (Avoid double slashes)
    const baseUrl = backendUrl.endsWith('/') ? backendUrl.slice(0, -1) : backendUrl;
    const targetUrl = `${baseUrl}/${pathString}${searchParams ? '?' + searchParams : ''}`;

    const headers = new Headers(request.headers);
    headers.set('host', 'api:3000');
    headers.set('x-tenant-id', 'public');

    // S12 FIX: Only attempt to read body if it's a writable method
    let body: any = undefined;
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method)) {
      try {
        body = await request.blob();
      } catch {
        // Body already consumed or empty
      }
    }

    const res = await fetch(targetUrl, {
      method: request.method,
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
    console.error('[API-PROXY-ERROR]:', error);
    return NextResponse.json(
      { error: 'Internal API Gateway Error', message: error.message || 'Failed to reach backend.' },
      { status: 502 }
    );
  }
}

export const GET = handle;
export const POST = handle;
export const PUT = handle;
export const PATCH = handle;
export const DELETE = handle;
export const HEAD = handle;
export const OPTIONS = handle;
