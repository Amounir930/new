/**
 * API Client for Fashion Boutique Template
 *
 * Axios-based client with tenant context and authentication.
 *
 * @module lib/api
 */

import axios, { type AxiosInstance } from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
const TENANT_ID = process.env.NEXT_PUBLIC_TENANT_ID;

/**
 * Create API client with default configuration
 */
export const api: AxiosInstance = axios.create({
  baseURL: `${API_BASE_URL}/api/storefront`,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    ...(TENANT_ID && { 'X-Tenant-ID': TENANT_ID }),
  },
  withCredentials: true, // Send httpOnly cookies
});

/**
 * Request interceptor - Add auth token if available
 */
api.interceptors.request.use(
  (config) => {
    // Token is in httpOnly cookie, no need to add manually
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * Response interceptor - Handle errors
 */
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Redirect to login
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

/**
 * API endpoints
 */
export const endpoints = {
  // Configuration
  config: () => api.get('/config'),
  menu: () => api.get('/menu'),

  // Products
  products: {
    list: (params?: Record<string, any>) => api.get('/products', { params }),
    getBySlug: (slug: string) => api.get(`/products/${slug}`),
    featured: () => api.get('/products/featured'),
  },

  // Categories
  categories: {
    list: () => api.get('/categories'),
    getBySlug: (slug: string) => api.get(`/categories/${slug}`),
  },

  // Cart
  cart: {
    get: () => api.get('/cart'),
    addItem: (data: {
      productId: string;
      variantId?: string;
      quantity: number;
    }) => api.post('/cart/items', data),
    updateItem: (itemId: string, quantity: number) =>
      api.patch(`/cart/items/${itemId}`, { quantity }),
    removeItem: (itemId: string) => api.delete(`/cart/items/${itemId}`),
    applyCoupon: (code: string) => api.post('/cart/coupon', { code }),
  },

  // Checkout
  checkout: {
    calculate: (data: any) => api.post('/checkout/calculate', data),
    complete: (data: any) => api.post('/checkout/complete', data),
    createPaymentIntent: () => api.post('/checkout/stripe/intent'),
  },

  // Auth
  auth: {
    login: (email: string, password: string) =>
      api.post('/auth/login', { email, password }),
    register: (data: any) => api.post('/auth/register', data),
    logout: () => api.post('/auth/logout'),
    me: () => api.get('/auth/me'),
  },

  // Account
  account: {
    orders: (params?: Record<string, any>) =>
      api.get('/account/orders', { params }),
    getOrder: (id: string) => api.get(`/account/orders/${id}`),
    addresses: () => api.get('/account/addresses'),
    wishlist: () => api.get('/account/wishlist'),
    addToWishlist: (productId: string) =>
      api.post(`/account/wishlist/${productId}`),
  },
};

export default api;
