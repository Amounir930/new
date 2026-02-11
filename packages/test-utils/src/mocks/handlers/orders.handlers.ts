/**
 * MSW Handlers for Orders API
 *
 * Mock API endpoints for order testing.
 *
 * @module @apex/test-utils/mocks/handlers/orders
 */

import { http, HttpResponse } from 'msw';
import {
  createMockOrder,
  createPendingOrder,
} from '../../fixtures/order.fixtures';

const BASE_URL = '/api';

export const ordersHandlers = [
  // POST /api/orders - Create order
  http.post(`${BASE_URL}/orders`, async ({ request }) => {
    await request.json();

    const order = createPendingOrder();

    return HttpResponse.json({ order }, { status: 201 });
  }),

  // GET /api/orders/:id - Get order details
  http.get(`${BASE_URL}/orders/:id`, ({ params }) => {
    const { id } = params;
    const order = createMockOrder({ id: id as string });

    return HttpResponse.json({ order });
  }),

  // GET /api/orders - Get customer orders
  http.get(`${BASE_URL}/orders`, () => {
    const orders = Array.from({ length: 5 }, () => createMockOrder());

    return HttpResponse.json({ orders });
  }),
];
