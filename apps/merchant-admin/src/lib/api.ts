import { config } from '../config';

const API_URL = config.apiUrl;

const ADM_TKN = 'adm_tkn_fe=';

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
    document.cookie = `adm_tkn_fe=${token}; ${expires}; path=/; SameSite=Lax; Secure`;
  }
};

interface FetchOptions extends RequestInit {
  token?: string;
}

export async function apiFetch<T>(
  endpoint: string,
  options: FetchOptions = {}
): Promise<T> {
  const token = options.token || getAuthToken();
  const tenantId = extractTenantFromHost();

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

  const res = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
    credentials: 'include',
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(error.message || `API Error: ${res.status}`);
  }

  if (res.status === 204) return {} as T;

  return res.json();
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
