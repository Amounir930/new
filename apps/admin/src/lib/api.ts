
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

export const getAuthToken = () => {
    if (typeof window !== 'undefined') {
        return localStorage.getItem('super_admin_token');
    }
    return null;
};

export const setAuthToken = (token: string) => {
    if (typeof window !== 'undefined') {
        localStorage.setItem('super_admin_token', token);
    }
};

interface FetchOptions extends RequestInit {
    token?: string;
}

export async function apiFetch<T>(endpoint: string, options: FetchOptions = {}): Promise<T> {
    const token = options.token || getAuthToken();

    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(options.headers as Record<string, string> || {}),
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers,
    });

    if (!res.ok) {
        const error = await res.json().catch(() => ({ message: res.statusText }));
        throw new Error(error.message || `API Error: ${res.status}`);
    }

    if (res.status === 204) return {} as T;

    return res.json();
}
