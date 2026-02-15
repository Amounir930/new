import { describe, expect, it } from 'bun:test';
import { ProductSchema } from './product.schema.js';

describe('ProductSchema', () => {
  const validProduct = {
    id: '550e8400-e29b-41d4-a716-446655440001',
    slug: 'test-product',
    name: 'Test Product',
    description: 'A comprehensive description of the test product.',
    shortDescription: 'Short summary.',
    price: 99.99,
    compareAtPrice: 120.0,
    currency: 'USD',
    images: [
      {
        url: 'https://example.com/img1.jpg',
        alt: 'Test Image 1',
        isPrimary: true,
      },
    ],
    categoryId: '550e8400-e29b-41d4-a716-446655440002',
    categoryName: 'Electronics',
    categorySlug: 'electronics',
    tags: ['new', 'sale'],
    brand: 'Apex Brand',
    variants: [],
    hasVariants: false,
    inStock: true,
    quantity: 100,
    metaTitle: 'Test Product | Buy Now',
    metaDescription: 'Get the best Test Product at our store.',
    averageRating: 4.5,
    reviewCount: 10,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  it('should validate valid product data', () => {
    const result = ProductSchema.safeParse(validProduct);
    expect(result.success).toBe(true);
  });

  it('should reject invalid slug format', () => {
    const result = ProductSchema.safeParse({
      ...validProduct,
      slug: 'Invalid Slug!',
    });
    expect(result.success).toBe(false);
  });

  it('should reject negative price', () => {
    const result = ProductSchema.safeParse({
      ...validProduct,
      price: -10,
    });
    expect(result.success).toBe(false);
  });

  it('should reject empty images array', () => {
    const result = ProductSchema.safeParse({
      ...validProduct,
      images: [],
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe(
        'At least one product image is required'
      );
    }
  });

  it('should reject invalid rating (> 5)', () => {
    const result = ProductSchema.safeParse({
      ...validProduct,
      averageRating: 6,
    });
    expect(result.success).toBe(false);
  });

  it('should allow null for optional fields like brand or description', () => {
    const result = ProductSchema.safeParse({
      ...validProduct,
      brand: null,
      description: null,
    });
    expect(result.success).toBe(true);
  });

  it('should validate variants if provided', () => {
    const productWithVariant = {
      ...validProduct,
      hasVariants: true,
      variants: [
        {
          id: '550e8400-e29b-41d4-a716-446655440003',
          sku: 'SKU-001',
          name: 'Variant 1',
          price: 99.99,
          compareAtPrice: null,
          quantity: 50,
          attributes: { size: 'L' },
          imageUrl: null,
        },
      ],
    };
    const result = ProductSchema.safeParse(productWithVariant);
    expect(result.success).toBe(true);
  });
});
