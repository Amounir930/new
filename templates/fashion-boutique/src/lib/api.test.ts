/**
 * API Client Tests
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock axios before importing api
vi.mock('axios', () => {
  const mockInstance = {
    defaults: {
      baseURL: 'http://localhost:3001/api/storefront',
      timeout: 10000,
      withCredentials: true,
      headers: {},
    },
    interceptors: {
      request: { use: vi.fn(), eject: vi.fn() },
      response: { use: vi.fn(), eject: vi.fn() },
    },
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  };

  return {
    default: {
      create: vi.fn(() => mockInstance),
    },
  };
});

import { api, endpoints } from './api';

describe('API Client', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Configuration', () => {
    it('has correct base URL', () => {
      expect(api.defaults.baseURL).toContain('/api/storefront');
    });

    it('sets correct timeout', () => {
      expect(api.defaults.timeout).toBe(10000);
    });

    it('includes credentials', () => {
      expect(api.defaults.withCredentials).toBe(true);
    });
  });

  describe('Products API', () => {
    it('calls products list endpoint', async () => {
      const mockGet = vi.spyOn(api, 'get').mockResolvedValue({ data: [] });

      await endpoints.products.list();

      expect(mockGet).toHaveBeenCalledWith('/products', { params: undefined });
    });

    it('calls get by slug endpoint', async () => {
      const mockGet = vi.spyOn(api, 'get').mockResolvedValue({ data: {} });

      await endpoints.products.getBySlug('test-product');

      expect(mockGet).toHaveBeenCalledWith('/products/test-product');
    });

    it('calls featured products endpoint', async () => {
      const mockGet = vi.spyOn(api, 'get').mockResolvedValue({ data: [] });

      await endpoints.products.featured();

      expect(mockGet).toHaveBeenCalledWith('/products/featured');
    });
  });

  describe('Cart API', () => {
    it('calls get cart endpoint', async () => {
      const mockGet = vi.spyOn(api, 'get').mockResolvedValue({ data: {} });

      await endpoints.cart.get();

      expect(mockGet).toHaveBeenCalledWith('/cart');
    });

    it('calls add item endpoint', async () => {
      const mockPost = vi.spyOn(api, 'post').mockResolvedValue({ data: {} });
      const itemData = { productId: '1', quantity: 2 };

      await endpoints.cart.addItem(itemData);

      expect(mockPost).toHaveBeenCalledWith('/cart/items', itemData);
    });

    it('calls update item endpoint', async () => {
      const mockPatch = vi.spyOn(api, 'patch').mockResolvedValue({ data: {} });

      await endpoints.cart.updateItem('item-1', 3);

      expect(mockPatch).toHaveBeenCalledWith('/cart/items/item-1', {
        quantity: 3,
      });
    });

    it('calls remove item endpoint', async () => {
      const mockDelete = vi
        .spyOn(api, 'delete')
        .mockResolvedValue({ data: {} });

      await endpoints.cart.removeItem('item-1');

      expect(mockDelete).toHaveBeenCalledWith('/cart/items/item-1');
    });

    it('calls apply coupon endpoint', async () => {
      const mockPost = vi.spyOn(api, 'post').mockResolvedValue({ data: {} });

      await endpoints.cart.applyCoupon('SAVE20');

      expect(mockPost).toHaveBeenCalledWith('/cart/coupon', { code: 'SAVE20' });
    });
  });

  describe('Auth API', () => {
    it('calls login endpoint', async () => {
      const mockPost = vi.spyOn(api, 'post').mockResolvedValue({ data: {} });

      await endpoints.auth.login('test@example.com', 'password');

      expect(mockPost).toHaveBeenCalledWith('/auth/login', {
        email: 'test@example.com',
        password: 'password',
      });
    });

    it('calls register endpoint', async () => {
      const mockPost = vi.spyOn(api, 'post').mockResolvedValue({ data: {} });
      const userData = { email: 'test@example.com', password: 'password' };

      await endpoints.auth.register(userData);

      expect(mockPost).toHaveBeenCalledWith('/auth/register', userData);
    });

    it('calls logout endpoint', async () => {
      const mockPost = vi.spyOn(api, 'post').mockResolvedValue({ data: {} });

      await endpoints.auth.logout();

      expect(mockPost).toHaveBeenCalledWith('/auth/logout');
    });

    it('calls me endpoint', async () => {
      const mockGet = vi.spyOn(api, 'get').mockResolvedValue({ data: {} });

      await endpoints.auth.me();

      expect(mockGet).toHaveBeenCalledWith('/auth/me');
    });
  });

  describe('Checkout API', () => {
    it('calls calculate endpoint', async () => {
      const mockPost = vi.spyOn(api, 'post').mockResolvedValue({ data: {} });
      const checkoutData = { items: [] };

      await endpoints.checkout.calculate(checkoutData);

      expect(mockPost).toHaveBeenCalledWith(
        '/checkout/calculate',
        checkoutData
      );
    });

    it('calls complete endpoint', async () => {
      const mockPost = vi.spyOn(api, 'post').mockResolvedValue({ data: {} });
      const orderData = { paymentMethod: 'card' };

      await endpoints.checkout.complete(orderData);

      expect(mockPost).toHaveBeenCalledWith('/checkout/complete', orderData);
    });

    it('calls create payment intent endpoint', async () => {
      const mockPost = vi.spyOn(api, 'post').mockResolvedValue({ data: {} });

      await endpoints.checkout.createPaymentIntent();

      expect(mockPost).toHaveBeenCalledWith('/checkout/stripe/intent');
    });
  });

  describe('Categories API', () => {
    it('calls list categories endpoint', async () => {
      const mockGet = vi.spyOn(api, 'get').mockResolvedValue({ data: [] });

      await endpoints.categories.list();

      expect(mockGet).toHaveBeenCalledWith('/categories');
    });

    it('calls get category by slug endpoint', async () => {
      const mockGet = vi.spyOn(api, 'get').mockResolvedValue({ data: {} });

      await endpoints.categories.getBySlug('mens-clothing');

      expect(mockGet).toHaveBeenCalledWith('/categories/mens-clothing');
    });
  });

  describe('Account API', () => {
    it('calls orders endpoint', async () => {
      const mockGet = vi.spyOn(api, 'get').mockResolvedValue({ data: [] });

      await endpoints.account.orders();

      expect(mockGet).toHaveBeenCalledWith('/account/orders', {
        params: undefined,
      });
    });

    it('calls get order endpoint', async () => {
      const mockGet = vi.spyOn(api, 'get').mockResolvedValue({ data: {} });

      await endpoints.account.getOrder('order-123');

      expect(mockGet).toHaveBeenCalledWith('/account/orders/order-123');
    });

    it('calls wishlist endpoint', async () => {
      const mockGet = vi.spyOn(api, 'get').mockResolvedValue({ data: [] });

      await endpoints.account.wishlist();

      expect(mockGet).toHaveBeenCalledWith('/account/wishlist');
    });

    it('calls add to wishlist endpoint', async () => {
      const mockPost = vi.spyOn(api, 'post').mockResolvedValue({ data: {} });

      await endpoints.account.addToWishlist('product-123');

      expect(mockPost).toHaveBeenCalledWith('/account/wishlist/product-123');
    });
  });
});
