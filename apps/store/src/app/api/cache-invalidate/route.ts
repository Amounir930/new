/**
 * Cache Invalidation Webhook
 * Allows merchant admin to trigger ISR revalidation when products/banners change
 * 
 * Usage: POST /api/cache-invalidate
 * Headers: x-admin-secret: {secret}
 * Body: { tenantId: string, tags?: string[] }
 */

import { NextRequest, NextResponse } from 'next/server';

const ADMIN_SECRET = process.env.ADMIN_REVALIDATE_SECRET || 'dev-secret-change-me';

export async function POST(request: NextRequest) {
  // Verify admin secret
  const adminSecret = request.headers.get('x-admin-secret');
  
  if (!adminSecret || adminSecret !== ADMIN_SECRET) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    const { tenantId, tags } = body as { tenantId?: string; tags?: string[] };

    if (!tenantId && !tags) {
      return NextResponse.json(
        { success: false, error: 'tenantId or tags required' },
        { status: 400 }
      );
    }

    // Revalidate specific cache tags
    if (tags && tags.length > 0) {
      await Promise.all(
        tags.map((tag) => revalidateTag(tag))
      );
      
      return NextResponse.json({
        success: true,
        message: `Revalidated ${tags.length} tags`,
        tags,
      });
    }

    // Revalidate all tenant-specific caches
    if (tenantId) {
      await revalidateTag('storefront');
      await revalidateTag(`tenant-${tenantId}`);
      
      // Invalidate Redis cache via API call
      await invalidateRedisCache(tenantId);
      
      return NextResponse.json({
        success: true,
        message: `Cache invalidated for tenant ${tenantId}`,
        tenantId,
      });
    }

    return NextResponse.json(
      { success: false, error: 'Invalid request' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Cache invalidation error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Revalidate Next.js ISR cache for a specific tag
 */
async function revalidateTag(tag: string) {
  try {
    const { revalidateTag: nextRevalidate } = await import('next/cache');
    nextRevalidate(tag);
    console.log(`[Cache] Revalidated tag: ${tag}`);
  } catch (error) {
    console.error(`[Cache] Failed to revalidate tag ${tag}:`, error);
  }
}

/**
 * Invalidate Redis cache via backend API
 */
async function invalidateRedisCache(tenantId: string) {
  try {
    const apiUrl = process.env.INTERNAL_API_URL || 'http://api:3000/api/v1';
    
    await fetch(`${apiUrl}/storefront/cache/invalidate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-tenant-id': tenantId,
        'x-admin-secret': ADMIN_SECRET,
      },
      body: JSON.stringify({ tenantId }),
    });
    
    console.log(`[Redis] Cache invalidated for tenant: ${tenantId}`);
  } catch (error) {
    console.error(`[Redis] Failed to invalidate cache for tenant ${tenantId}:`, error);
  }
}
