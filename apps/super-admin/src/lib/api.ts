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

  const res = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
    credentials: 'include', // S8: Always include cookies for session support
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(error.message || `API Error: ${res.status}`);
  }

  if (res.status === 204) return {} as T;

  return res.json();
}
