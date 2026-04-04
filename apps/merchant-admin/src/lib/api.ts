import { config } from '../config';

const API_URL = config.apiUrl;

const ADM_TKN = 'adm_tkn=';

export const getAuthToken = () => {
  if (typeof window !== 'undefined') {
    const name = ADM_TKN;
    const decodedCookie = decodeURIComponent(document.cookie);
    const ca = decodedCookie.split(';');
    for (let i = 0; i < ca.length; i++) {
      let c = ca[i];
      while (c.charAt(0) === ' ') {
        c = c.substring(1);
      }
      if (c.indexOf(name) === 0) {
        return c.substring(name.length, c.length);
      }
    }
  }
  return null;
};

export const setAuthToken = (token: string) => {
  if (typeof window !== 'undefined') {
    // Set cookie for 1 day
    const d = new Date();
    d.setTime(d.getTime() + 1 * 24 * 60 * 60 * 1000);
    const expires = `expires=${d.toUTCString()}`;
    // biome-ignore lint/suspicious/noDocumentCookie: S1-S15 Compliance: Token management
    document.cookie = `adm_tkn=${token}; ${expires}; path=/; SameSite=Lax; Secure`;
  }
};

interface FetchOptions extends RequestInit {
  token?: string;
  responseType?: 'json' | 'blob';
}

export async function apiFetch<T>(
  endpoint: string,
  options: FetchOptions = {}
): Promise<T> {
  const token = options.token || getAuthToken();
  const tenantId = await extractTenantFromHost();

  const headers: Record<string, string> = {
    ...((options.headers as Record<string, string>) || {}),
  };

  // 🛡️ MULTIPART FIX: Only set application/json if not using FormData
  // If FormData is present, the browser MUST set the boundary itself.
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  // 🛡️ SSR Protocol Pivot: Use internal Docker URL for server-side fetches
  const isServer = typeof window === 'undefined';
  const baseUrl = isServer ? process.env.INTERNAL_API_URL || API_URL : API_URL;

  if (tenantId) {
    headers['X-Tenant-ID'] = tenantId;
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  // 🛡️ S11: AbortController Timeout (Zombie UI Prevention)
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);

  try {
    const res = await fetch(`${baseUrl}${endpoint}`, {
      ...options,
      headers,
      signal: controller.signal,
      credentials: 'include',
    });

    if (!res.ok) {
      const error = await res.json().catch(() => ({ message: res.statusText }));
      throw new Error(error.message || `API Error: ${res.status}`);
    }

    if (res.status === 204) return {} as T;

    if (options.responseType === 'blob') {
      return (await res.blob()) as T;
    }

    return res.json();
  } catch (err: any) {
    if (err.name === 'AbortError') {
      throw new Error(
        'API Request Timed Out (15s). Please check your connection.'
      );
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * 🛡️ S2 FIX: Hardened helper to extract tenant identifier from current hostname.
 * Works for both Client-side and SSR.
 */
async function extractTenantFromHost(): Promise<string | null> {
  let host = '';
  if (typeof window !== 'undefined') {
    // Client-side
    host = window.location.hostname;
  } else {
    // Server-side (SSR)
    try {
      const { headers } = await import('next/headers');
      const headersList = await headers();
      host = headersList.get('host') || '';
    } catch {
      return null;
    }
  }

  if (!host) return null;

  const parts = host.split('.');
  // 🛡️ S2 FIX: Only treat as tenant if it's a subdomain and not an IP address or internal host
  const isIP = /^\d{1,3}(\.\d{1,3}){3}$/.test(host);
  const isInternal =
    parts[0] === 'www' ||
    parts[0] === 'api' ||
    parts[0] === 'admin' ||
    parts[0] === 'super-admin' ||
    parts[0] === 'localhost';

  if (parts.length >= 3 && !isIP && !isInternal) {
    return parts[0];
  }
  return null;
}

// ═══════════════════════════════════════════════════════════════
// MERCHANT CUSTOMERS API HELPERS
// ═══════════════════════════════════════════════════════════════

export interface CustomerListItem {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  createdAt: string;
  lastLoginAt: string | null;
  totalOrdersCount: number;
  totalSpentAmount: string;
  walletBalance: string;
  loyaltyPoints: number;
  isVerified: boolean;
  acceptsMarketing: boolean;
  avatarUrl: string | null;
}

export interface CustomerListResponse {
  customers: CustomerListItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface CustomerDetail extends CustomerListItem {
  gender: string | null;
  language: string;
  notes: string | null;
  tags: string | null;
  dateOfBirth: string | null;
}

export async function getCustomers(params: {
  page?: number;
  limit?: number;
  search?: string;
  sort?: 'newest' | 'oldest' | 'spent_desc' | 'name_asc';
} = {}): Promise<CustomerListResponse> {
  const query = new URLSearchParams();
  if (params.page) query.set('page', String(params.page));
  if (params.limit) query.set('limit', String(params.limit));
  if (params.search) query.set('search', params.search);
  if (params.sort) query.set('sort', params.sort);

  const qs = query.toString();
  return apiFetch<CustomerListResponse>(`/merchant/customers${qs ? `?${qs}` : ''}`);
}

export async function getCustomer(id: string): Promise<CustomerDetail> {
  return apiFetch<CustomerDetail>(`/merchant/customers/${id}`);
}
