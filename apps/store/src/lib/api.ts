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

interface StorefrontFetchOptions extends RequestInit {
  cache?: RequestCache;
  next?: {
    revalidate?: number | false;
    tags?: string[];
  };
}

export async function fetchStorefront(
  path: string,
  tenantId?: string,
  options: StorefrontFetchOptions = {}
) {
  // 🛡️ S2 FIX: Enforce hostname-based discovery if tenantId is missing or generic
  const resolvedTenantId = (!tenantId || tenantId === 'public')
    ? ((await extractTenantFromHost()) || 'public')
    : tenantId;

  try {
    const res = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'x-tenant-id': resolvedTenantId, // Crucial for S2 Isolation in API
        ...options.headers,
      },
      // S12: Cache policy with Vector 4 Tagging
      cache: options.cache || (IS_SERVER ? 'force-cache' : 'default'),
      next: {
        revalidate: options.next?.revalidate,
        tags: [
          'storefront',
          `tenant-${resolvedTenantId}`,
          ...(tenantId && tenantId !== 'public' ? [`tenant-${tenantId}`] : []),
          ...(options.next?.tags || []),
        ],
      },
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
 * 🛡️ S2 FIX: Universal helper to extract tenant identifier from Host header (SSR) or hostname (Client)
 */
export async function extractTenantFromHost(): Promise<string | null> {
  let host = '';

  if (typeof window !== 'undefined') {
    // Client-side
    host = window.location.hostname;
  } else {
    // Server-side (SSR)
    const { headers } = await import('next/headers');
    const headersList = await headers();
    host = headersList.get('host') || '';
  }

  const parts = host.split('.');
  // 🛡️ S2 FIX: Only treat as tenant if it's a subdomain and not an IP address or internal host
  const isIP = /^\d{1,3}(\.\d{1,3}){3}$/.test(host);
  const isInternal = parts[0] === 'www' || parts[0] === 'api' || parts[0] === 'admin' || parts[0] === 'super-admin' || parts[0] === 'localhost';

  if (parts.length >= 3 && !isIP && !isInternal) {
    return parts[0];
  }
  return null;
}
