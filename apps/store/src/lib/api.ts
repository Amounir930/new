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
  tenantId?: string,
  options: RequestInit = {}
) {
  // 🛡️ S2 FIX: Enforce hostname-based discovery if tenantId is missing or generic
  const resolvedTenantId = (!tenantId || tenantId === 'public')
    ? (extractTenantFromHost() || 'public')
    : tenantId;

  const url = `${API_BASE}${endpoint}`;

  try {
    const res = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'x-tenant-id': resolvedTenantId, // Crucial for S2 Isolation in API
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

/**
 * 🛡️ S2 FIX: Helper to extract tenant identifier from current hostname
 */
function extractTenantFromHost(): string | null {
  if (typeof window === 'undefined') return null;
  const host = window.location.hostname;
  const parts = host.split('.');
  // Check if we are on a tenant subdomain (e.g., tenant.60sec.shop)
  if (parts.length >= 3 && parts[0] !== 'www' && parts[0] !== 'api' && parts[0] !== 'admin') {
    return parts[0];
  }
  return null;
}
