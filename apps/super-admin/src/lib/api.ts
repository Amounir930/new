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

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) || {}),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  if (managementKey) {
    headers['X-Super-Admin-Key'] = managementKey;
  }

  const res = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
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
}
