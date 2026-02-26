/**
 * Product Mock Data Fixtures
 *
 * Factory functions to generate realistic product test data.
 *
 * @module @apex/test-utils/fixtures/product
 */

import type { Product, ProductImage, ProductVariant } from '@apex/validators';
import { faker } from '@faker-js/faker';

export interface CreateMockProductOptions {
  id?: string;
  slug?: string;
  name?: string;
  price?: number;
  inStock?: boolean;
  hasVariants?: boolean;
  categoryId?: string;
  quantity?: number;
}

/**
 * Creates a mock product image
 */
export function createMockProductImage(
  overrides?: Partial<ProductImage>
): ProductImage {
  return {
    url: faker.image.urlLoremFlickr({ category: 'product' }),
    altText: faker.commerce.productName(),
    isPrimary: false,
    order: 0,
    ...overrides,
  };
}

/**
 * Creates a mock product variant
 */
export function createMockProductVariant(
  overrides?: Partial<ProductVariant>
): ProductVariant {
  const basePrice = faker.number.float({ min: 20, max: 500, precision: 0.01 });

  return {
    id: faker.string.uuid(),
    sku: faker.string.alphanumeric(10).toUpperCase(),
    name: `${faker.color.human()} / ${faker.helpers.arrayElement([
      'S',
      'M',
      'L',
      'XL',
    ])}`,
    price: basePrice,
    compareAtPrice: faker.datatype.boolean() ? basePrice * 1.2 : null,
    quantity: faker.number.int({ min: 0, max: 100 }),
    attributes: [
      {
        name: 'Color',
        value: faker.color.human(),
      },
      {
        name: 'Size',
        value: faker.helpers.arrayElement(['S', 'M', 'L', 'XL']),
      },
    ],
    imageUrl: faker.image.urlLoremFlickr({ category: 'product' }),
    ...overrides,
  };
}

/**
 * Creates a mock product
 */
export function createMockProduct(
  options: CreateMockProductOptions = {}
): Product {
  const basePrice =
    options.price ?? faker.number.float({ min: 20, max: 500, precision: 0.01 });
  const hasDiscount = faker.datatype.boolean();

  const product: Product = {
    id: options.id ?? faker.string.uuid(),
    slug:
      options.slug ??
      faker.helpers.slugify(faker.commerce.productName()).toLowerCase(),
    name: {
      ar: faker.commerce.productName(),
      en: faker.commerce.productName(),
    },
    description: {
      ar: faker.commerce.productDescription(),
      en: faker.commerce.productDescription(),
    },
    shortDescription: faker.lorem.sentence(),

    price: basePrice,
    compareAtPrice: hasDiscount ? basePrice * 1.25 : null,
    currency: 'USD',

    images: [
      createMockProductImage({ isPrimary: true }),
      createMockProductImage(),
      createMockProductImage(),
    ],

    categoryId: options.categoryId ?? faker.string.uuid(),
    categoryName: faker.commerce.department(),
    categorySlug: faker.helpers
      .slugify(faker.commerce.department())
      .toLowerCase(),

    tags: faker.helpers.arrayElements(['new', 'trending', 'sale', 'featured'], {
      min: 0,
      max: 2,
    }),
    brand: faker.company.name(),

    variants: options.hasVariants
      ? [createMockProductVariant(), createMockProductVariant()]
      : [],
    hasVariants: options.hasVariants ?? false,

    inStock: options.inStock ?? true,
    quantity: faker.number.int({ min: 0, max: 100 }),

    metaTitle: faker.lorem.sentence({ min: 5, max: 10 }),
    metaDescription: faker.lorem.sentence({ min: 10, max: 20 }),

    averageRating: faker.number.float({ min: 3, max: 5, precision: 0.1 }),
    reviewCount: faker.number.int({ min: 0, max: 500 }),

    createdAt: faker.date.past().toISOString(),
    updatedAt: faker.date.recent().toISOString(),
  };

  return product;
}

/**
 * Creates an array of mock products
 */
export function createMockProductList(count = 10): Product[] {
  return Array.from({ length: count }, () => createMockProduct());
}

/**
 * Creates a mock out-of-stock product
 */
export function createOutOfStockProduct(): Product {
  return createMockProduct({
    inStock: false,
    quantity: 0,
  });
}

/**
 * Creates a mock featured product
 */
export function createFeaturedProduct(): Product {
  const product = createMockProduct({
    price: faker.number.float({ min: 100, max: 500, precision: 0.01 }),
  });

  return {
    ...product,
    tags: [...product.tags, 'featured'],
  };
}
