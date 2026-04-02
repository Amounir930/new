import { config } from '../config';

const API_URL = config.apiUrl;

export const getAuthToken = () => {
  if (typeof window === 'undefined') return null;
  return sessionStorage.getItem('access_token');
};

export const setAuthToken = (token: string) => {
  if (typeof window !== 'undefined') {
    if (token) {
      sessionStorage.setItem('access_token', token);
    } else {
      sessionStorage.removeItem('access_token');
    }
  }
};

export const getManagementKey = () => {
  if (typeof window === 'undefined') return null;
  return sessionStorage.getItem('X-SUPER-ADMIN-KEY');
};

export const setManagementKey = (key: string) => {
  if (typeof window !== 'undefined') {
    if (key) {
      sessionStorage.setItem('X-SUPER-ADMIN-KEY', key);
    } else {
      sessionStorage.removeItem('X-SUPER-ADMIN-KEY');
    }
  }
};

interface FetchOptions extends RequestInit {
  token?: string;
}

export class ApiError extends Error {
  constructor(
    public message: string,
    public status: number,
    public data?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export async function apiFetch<T>(
  endpoint: string,
  options: FetchOptions = {}
): Promise<T> {
  const token = options.token || getAuthToken();
  const managementKey = getManagementKey();
  const tenantId = await extractTenantFromHost();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) || {}),
  };

  if (tenantId) {
    headers['X-Tenant-ID'] = tenantId;
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  if (managementKey) {
    headers['X-Super-Admin-Key'] = managementKey;
  }

  // 🛡️ S11: AbortController Timeout (Zombie UI Prevention)
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);

  try {
    const res = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
      signal: controller.signal,
      credentials: 'include',
    });

    if (!res.ok) {
      const errorData = await res
        .json()
        .catch(() => ({ message: res.statusText }));
      throw new ApiError(
        errorData.message || `API Error: ${res.status}`,
        res.status,
        errorData
      );
    }

    if (res.status === 204) return {} as T;

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
