import { config } from '../config';

const API_URL = config.apiUrl;

export const getAuthToken = () => {
  // S8: Manual token extraction disabled for HttpOnly compatibility.
  // Browser will handle token transport automatically via credentials: 'include'.
  return null;
};

export const setAuthToken = (_token: string) => {
  // S8: Client-side cookie setting is deprecated in favor of server-side Set-Cookie.
  // This remains only for non-HttpOnly legacy support if needed, otherwise ignore.
};

interface FetchOptions extends RequestInit {
  token?: string;
}

export class ApiError extends Error {
  constructor(public message: string, public status: number, public data?: any) {
    super(message);
    this.name = 'ApiError';
  }
}

export async function apiFetch<T>(
  endpoint: string,
  options: FetchOptions = {}
): Promise<T> {
  const token = options.token || getAuthToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) || {}),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  // S1: Sovereign Authorization Bridge
  // Automatically inject the Super Admin Key if set in the environment or persistent storage
  const superAdminKey = typeof window !== 'undefined' ? localStorage.getItem('X-SUPER-ADMIN-KEY') : null;
  if (superAdminKey) {
    headers['X-Super-Admin-Key'] = superAdminKey;
  }

  const res = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
    credentials: 'include', // S8: Always include cookies for session support
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ message: res.statusText }));
    throw new ApiError(
      errorData.message || `API Error: ${res.status}`,
      res.status,
      errorData
    );
  }

  if (res.status === 204) return {} as T;

  return res.json();
}
