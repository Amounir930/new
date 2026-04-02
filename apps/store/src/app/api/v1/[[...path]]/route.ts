import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * Ìª°Ô∏è Next.js Catch-all API Proxy (Protocol S2/S5)
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
    const baseUrl = backendUrl.endsWith('/') ? backendUrl.slice(0, -1) : backendUrl;
    const targetUrl = `${baseUrl}/${pathString}${searchParams ? '?' + searchParams : ''}`;

    const headers = new Headers(request.headers);
    headers.set('host', 'api:3000');
    headers.set('x-tenant-id', 'public');

    const fetchOptions: RequestInit = {
      method: request.method,
      headers: headers,
      cache: 'no-store',
    };

    if (!['GET', 'HEAD'].includes(request.method)) {
      try {
        const body = await request.blob();
        if (body && body.size > 0) {
          fetchOptions.body = body;
        }
      } catch {
        // Body already consumed or empty
      }
    }

    const res = await fetch(targetUrl, fetchOptions);
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
      { error: 'Internal API Gateway Error', message: 'Failed to reach backend.' },
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
