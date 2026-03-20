import { NextRequest, NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';

/**
 * Vector 4: Secure ISR Revalidation Endpoint
 * Allows the API to trigger instant cache invalidation in the Storefront.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const tag = searchParams.get('tag');
  const secret = searchParams.get('secret');

  // S1/S7 Protocol: Validate internal secret to prevent cache denial-of-service
  if (secret !== process.env.INTERNAL_API_SECRET) {
    return NextResponse.json({ message: 'Invalid secret' }, { status: 401 });
  }

  if (!tag) {
    return NextResponse.json({ message: 'Tag is required' }, { status: 400 });
  }

  try {
    // S12: Perform on-demand revalidation
    // Satisfy linter: Next.js 16.1.7 expects a profile/config as second argument
    revalidateTag(tag, 'default');
    
    // Also revalidate the specific tenant tag if it's a config/bootstrap update
    if (tag.startsWith('config-') || tag.startsWith('bootstrap-')) {
        const tenantId = tag.split('-')[1];
        if (tenantId) {
            revalidateTag(`tenant-${tenantId}`, 'default');
        }
    }

    return NextResponse.json({ revalidated: true, now: Date.now() });
  } catch (err) {
    return NextResponse.json({ message: 'Error revalidating', error: (err as Error).message }, { status: 500 });
  }
}
