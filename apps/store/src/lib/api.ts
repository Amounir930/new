import { headers } from 'next/headers';

import { config } from '../config';

/**
 * S1/S2: API Fetcher for Storefront
 * Supports internal networking (Docker) and dynamic tenant context
 */

// If we are on the server (SSR), we use the internal service name to bypass Traefik/DNS
const IS_SERVER = typeof window === 'undefined';
const INTERNAL_API_URL = config.internalApiUrl;
const PUBLIC_API_URL = config.publicApiUrl;

export const API_BASE = IS_SERVER ? INTERNAL_API_URL : PUBLIC_API_URL;

export async function fetchStorefront(
  endpoint: string,
  options: RequestInit = {}
) {
  const url = `${API_BASE}${endpoint}`;

  // Extract tenant from headers (Injected by middleware.ts)
  let tenantId = 'public';
  if (IS_SERVER) {
    const headerList = await headers();
    tenantId = headerList.get('x-tenant-id') || 'public';
  }

  try {
    const res = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'x-tenant-id': tenantId, // Crucial for S2 Isolation in API
        ...options.headers,
      },
      // S12: Cache policy
      cache: options.cache || (IS_SERVER ? 'force-cache' : 'default'),
    });

    if (!res.ok) {
      const errorMsg = `API Error [${res.status}]: ${url} | Tenant: ${tenantId}`;
      console.error(errorMsg);

      // S5: Error Filtering & S4: Audit logging on frontend (conceptual)
      if (res.status >= 500) {
        // Critical error - log to GlitchTip/Sentry in real app
        return { error: 'INTERNAL_SERVER_ERROR', status: res.status };
      }

      if (res.status === 429) {
        return { error: 'TOO_MANY_REQUESTS', status: res.status };
      }

      return { error: 'API_ERROR', status: res.status };
    }

    return res.json();
  } catch (error) {
    console.error(`Fetch error: ${url} | Tenant: ${tenantId}`, error);
    return null;
  }
}

export async function getHomeData() {
  return fetchStorefront('/storefront/home', {
    next: { revalidate: 300 }, // S12: ISR 5 mins
  });
}

export async function getTenantConfig() {
  return fetchStorefront('/storefront/config', {
    next: { revalidate: 3600 }, // Cache for 1 hour
  });
}

export async function getProducts(
  params: {
    featured?: boolean;
    category?: string;
    limit?: number;
    sort?: 'newest' | 'price_asc' | 'price_desc';
  } = {}
) {
  const query = new URLSearchParams(params as any).toString();
  return fetchStorefront(`/storefront/products?${query}`, {
    next: { revalidate: 60 },
  });
}

export async function getProductBySlug(slug: string) {
  return fetchStorefront(`/storefront/products/${slug}`, {
    next: { revalidate: 60 },
  });
}
