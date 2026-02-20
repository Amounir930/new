import { headers } from 'next/headers';

/**
 * S1/S2: API Fetcher for Storefront
 * Supports internal networking (Docker) and dynamic tenant context
 */

// If we are on the server (SSR), we use the internal service name to bypass Traefik/DNS
const IS_SERVER = typeof window === 'undefined';
const INTERNAL_API_URL = process.env.INTERNAL_API_URL || "http://api:3000/api";
const PUBLIC_API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api";

export const API_BASE = IS_SERVER ? INTERNAL_API_URL : PUBLIC_API_URL;

export async function fetchStorefront(endpoint: string, options: RequestInit = {}) {
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
                "Content-Type": "application/json",
                "x-tenant-id": tenantId, // Crucial for S2 Isolation in API
                ...options.headers,
            },
            // S12: Cache policy
            cache: options.cache || (IS_SERVER ? 'force-cache' : 'default'),
        });

        if (!res.ok) {
            console.error(`API Error [${res.status}]: ${url} | Tenant: ${tenantId}`);
            return null;
        }

        return res.json();
    } catch (error) {
        console.error(`Fetch error: ${url} | Tenant: ${tenantId}`, error);
        return null;
    }
}

export async function getHomeData() {
    return fetchStorefront("/storefront/home", {
        next: { revalidate: 300 }, // S12: ISR 5 mins
    });
}
