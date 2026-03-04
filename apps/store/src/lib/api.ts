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

/**
 * S12 FIX 11C: Refactored to accept tenantId as an argument.
 * Calling headers() inside this function forces the entire page into 'force-dynamic',
 * killing ISR (revalidate). Explicitly passing the tenantId preserves ISR.
 */
export async function fetchStorefront(
  endpoint: string,
  tenantId = 'public',
  options: RequestInit = {}
) {
  const url = `${API_BASE}${endpoint}`;

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
      // S5 Security: Mask internal URL to prevent infrastructure disclosure
      const errorMsg = `API Error [${res.status}] | Tenant: ${tenantId}`;
      void errorMsg;

      if (res.status >= 500) {
        return { error: 'INTERNAL_SERVER_ERROR', status: res.status };
      }

      if (res.status === 429) {
        return { error: 'TOO_MANY_REQUESTS', status: res.status };
      }

      return { error: 'API_ERROR', status: res.status };
    }

    return res.json();
  } catch (_error) {
    /* `Fetch error: ${url} | Tenant: ${tenantId}`, error */
    return null;
  }
}

export async function getHomeData(tenantId: string) {
  return fetchStorefront('/storefront/home', tenantId, {
    next: { revalidate: 300 }, // S12: ISR 5 mins
  });
}

export async function getTenantConfig(tenantId: string) {
  return fetchStorefront('/storefront/config', tenantId, {
    next: { revalidate: 3600 }, // Cache for 1 hour
  });
}

export async function getStoreBootstrap(tenantId: string) {
  return fetchStorefront('/storefront/bootstrap', tenantId, {
    next: { revalidate: 60 }, // S12: Aggregate revalidation
  });
}

export async function getProducts(
  tenantId: string,
  params: {
    featured?: boolean;
    category?: string;
    limit?: number;
    sort?: 'newest' | 'price_asc' | 'price_desc';
  } = {}
) {
  const query = new URLSearchParams(
    params as Record<string, string>
  ).toString();
  return fetchStorefront(`/storefront/products?${query}`, tenantId, {
    next: { revalidate: 60 },
  });
}

export async function getProductBySlug(tenantId: string, slug: string) {
  return fetchStorefront(`/storefront/products/${slug}`, tenantId, {
    next: { revalidate: 60 },
  });
}
