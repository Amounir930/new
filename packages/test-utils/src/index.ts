/**
 * Test Utilities Index
 *
 * Main exports for @apex/test-utils package.
 *
 * @module @apex/test-utils
 */

// ═══════════════════════════════════════════════════════════
// Mock Data Fixtures
// ═══════════════════════════════════════════════════════════
export * from './fixtures/product.fixtures';
export * from './fixtures/cart.fixtures';
export * from './fixtures/order.fixtures';
export * from './fixtures/customer.fixtures';

// ═══════════════════════════════════════════════════════════
// MSW Mocks
// ═══════════════════════════════════════════════════════════
export * from './mocks/server';
export * from './mocks/handlers/products.handlers';
export * from './mocks/handlers/cart.handlers';
export * from './mocks/handlers/orders.handlers';

// ═══════════════════════════════════════════════════════════
// Security Utilities
// ═══════════════════════════════════════════════════════════
export * from './security-base';
