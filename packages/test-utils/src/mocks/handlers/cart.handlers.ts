/**
 * MSW Handlers for Cart API
 *
 * Mock API endpoints for cart testing.
 *
 * @module @apex/test-utils/mocks/handlers/cart
 */

import { http, HttpResponse } from 'msw';
import { createEmptyCart, createMockCart } from '../../fixtures/cart.fixtures';

const BASE_URL = '/api';

let mockCart = createMockCart();

export const cartHandlers = [
  // GET /api/cart - Get current cart
  http.get(`${BASE_URL}/cart`, () => {
    return HttpResponse.json({ cart: mockCart });
  }),

  // POST /api/cart/items - Add item to cart
  http.post(`${BASE_URL}/cart/items`, async ({ request }) => {
    await request.json();

    // Add item to mock cart (simplified)
    mockCart = createMockCart(); // In real test, you'd add the actual item

    return HttpResponse.json({ cart: mockCart });
  }),

  // PATCH /api/cart/items/:id - Update cart item quantity
  http.patch(`${BASE_URL}/cart/items/:id`, async ({ request }) => {
    await request.json();

    // Update item in mock cart
    mockCart = createMockCart();

    return HttpResponse.json({ cart: mockCart });
  }),

  // DELETE /api/cart/items/:id - Remove item from cart
  http.delete(`${BASE_URL}/cart/items/:id`, () => {
    // Remove item from mock cart
    mockCart = createEmptyCart();

    return HttpResponse.json({ cart: mockCart });
  }),
];

/**
 * Reset cart to initial state (useful for test cleanup)
 */
export function resetMockCart() {
  mockCart = createMockCart();
}
