/**
 * MSW Server Setup
 *
 * Configures Mock Service Worker for Node/Bun tests.
 *
 * @module @apex/test-utils/mocks/server
 */

import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll } from 'bun:test';
import { cartHandlers } from './handlers/cart.handlers';
import { ordersHandlers } from './handlers/orders.handlers';
import { productsHandlers } from './handlers/products.handlers';

/**
 * MSW server with all handlers registered
 */
export const server = setupServer(
  ...productsHandlers,
  ...cartHandlers,
  ...ordersHandlers
);

/**
 * Setup function for Bun
 *
 * @example
 * // In your test file:
 * import { setupMswServer } from '@apex/test-utils';
 * setupMswServer();
 */
export function setupMswServer() {
  // Start server before all tests
  beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }));

  // Reset handlers after each test
  afterEach(() => server.resetHandlers());

  // Clean up after all tests
  afterAll(() => server.close());
}
