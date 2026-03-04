/**
 * Cart Mock Data Fixtures
 *
 * Factory functions to generate cart test data.
 *
 * @module @apex/test-utils/fixtures/cart
 */

import type { Cart, CartItem } from '@apex/validators';
import { faker } from '@faker-js/faker';
import { createMockProduct } from './product.fixtures';

/**
 * Creates a mock cart item
 */
export function createMockCartItem(overrides?: Partial<CartItem>): CartItem {
  const product: any = createMockProduct();
  const quantity = faker.number.int({ min: 1, max: 5 });

  return {
    productId: product.id,
    variantId: null,
    name: product.name?.en ?? product.name ?? 'Mock Product',
    sku: faker.string.alphanumeric(10).toUpperCase(),
    price: product.price,
    quantity,
    imageUrl: product.images[0]?.url ?? null,
    attributes: undefined,
    ...overrides,
  };
}

/**
 * Creates a mock cart
 */
export function createMockCart(overrides?: Partial<Cart>): Cart {
  const items = Array.from(
    { length: faker.number.int({ min: 1, max: 3 }) },
    () => createMockCartItem()
  );

  const subtotal = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const discount = 0;
  const shipping = 10;
  const tax = subtotal * 0.1;
  const total = subtotal - discount + shipping + tax;

  return {
    id: faker.string.uuid(),
    tenantId: faker.string.uuid(),
    customerId: faker.string.uuid(),
    items,
    subtotal,
    discount,
    shipping,
    tax,
    total,
    appliedCoupons: [],
    currency: 'USD',
    itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
    updatedAt: faker.date.recent().toISOString(),
    ...overrides,
  };
}

/**
 * Creates an empty cart
 */
export function createEmptyCart(): Cart {
  return createMockCart({
    items: [],
    subtotal: 0,
    discount: 0,
    shipping: 0,
    tax: 0,
    total: 0,
    itemCount: 0,
  });
}

/**
 * Creates a guest cart (no customerId)
 */
export function createGuestCart(): Cart {
  return createMockCart({
    customerId: null,
  });
}
