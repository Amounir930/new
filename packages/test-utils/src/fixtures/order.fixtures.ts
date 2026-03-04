/**
 * Order Mock Data Fixtures
 *
 * Factory functions to generate order and address test data.
 *
 * @module @apex/test-utils/fixtures/order
 */

import type { Address, Order, OrderItem } from '@apex/validators';
import { faker } from '@faker-js/faker';
import { createMockProduct } from './product.fixtures';

/**
 * Creates a mock address
 */
export function createMockAddress(overrides?: Partial<Address>): Address {
  return {
    name: faker.person.fullName(),
    line1: faker.location.streetAddress(),
    line2: faker.datatype.boolean() ? faker.location.secondaryAddress() : null,
    city: faker.location.city(),
    state: faker.location.state(),
    postalCode: faker.location.zipCode(),
    country: faker.location.countryCode('alpha-2') as 'US' | 'SA',
    phone: faker.phone.number(),
    ...overrides,
  };
}

/**
 * Creates a mock order item
 */
export function createMockOrderItem(overrides?: Partial<OrderItem>): OrderItem {
  const product: any = createMockProduct();

  return {
    productId: product.id,
    name: 'Mock Product',
    sku: faker.string.alphanumeric(10).toUpperCase(),
    price: product.price,
    quantity: faker.number.int({ min: 1, max: 3 }),
    imageUrl: product.images[0]?.url ?? null,
    ...overrides,
  };
}

/**
 * Creates a mock order
 */
export function createMockOrder(overrides?: Partial<Order>): Order {
  const items = Array.from(
    { length: faker.number.int({ min: 1, max: 3 }) },
    () => createMockOrderItem()
  );

  const subtotal = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const discount = faker.number.float({
    min: 0,
    max: subtotal * 0.2,
    precision: 0.01,
  });
  const shipping = 15;
  const tax = (subtotal - discount) * 0.1;
  const total = subtotal - discount + shipping + tax;

  const createdAt = faker.date.past();

  return {
    id: faker.string.uuid(),
    orderNumber: `ORD-${new Date().getFullYear()}-${faker.string.numeric(6)}`,
    tenantId: faker.string.uuid(),
    customerId: faker.string.uuid(),
    status: faker.helpers.arrayElement([
      'pending',
      'processing',
      'shipped',
      'delivered',
    ]),
    items,
    subtotal,
    discount,
    shipping,
    tax,
    total,
    currency: 'USD',
    shippingAddress: createMockAddress(),
    billingAddress: createMockAddress(),
    paymentMethod: faker.helpers.arrayElement(['card', 'cod', 'wallet']),
    paymentStatus: faker.helpers.arrayElement(['pending', 'paid']),
    trackingNumber: faker.string.alphanumeric(16).toUpperCase(),
    trackingUrl: faker.internet.url(),
    createdAt: createdAt.toISOString(),
    updatedAt: faker.date
      .between({ from: createdAt, to: new Date() })
      .toISOString(),
    shippedAt: null,
    deliveredAt: null,
    ...overrides,
  };
}

/**
 * Creates a delivered order
 */
export function createDeliveredOrder(): Order {
  const createdAt = faker.date.past({ years: 0.5 });
  const shippedAt = faker.date.between({ from: createdAt, to: new Date() });
  const deliveredAt = faker.date.between({ from: shippedAt, to: new Date() });

  return createMockOrder({
    status: 'delivered',
    paymentStatus: 'paid',
    shippedAt: shippedAt.toISOString(),
    deliveredAt: deliveredAt.toISOString(),
  });
}

/**
 * Creates a pending order
 */
export function createPendingOrder(): Order {
  return createMockOrder({
    status: 'pending',
    paymentStatus: 'pending',
    shippedAt: null,
    deliveredAt: null,
  });
}
