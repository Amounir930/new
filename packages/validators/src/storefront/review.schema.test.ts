import { describe, expect, it } from 'vitest';
import { CreateReviewSchema, ReviewSchema } from './review.schema.js';

describe('ReviewSchema', () => {
  const validReview = {
    id: '550e8400-e29b-41d4-a716-446655440009',
    productId: '550e8400-e29b-41d4-a716-446655440001',
    customerId: '550e8400-e29b-41d4-a716-446655440006',
    customerName: 'Alice Smith',
    rating: 5,
    title: 'Great Product!',
    content: 'I really enjoyed using this product. Highly recommended.',
    verified: true,
    helpful: 12,
    createdAt: new Date().toISOString(),
  };

  it('should validate valid review', () => {
    const result = ReviewSchema.safeParse(validReview);
    expect(result.success).toBe(true);
  });

  it('should reject rating > 5', () => {
    const result = ReviewSchema.safeParse({ ...validReview, rating: 6 });
    expect(result.success).toBe(false);
  });

  it('should reject empty content', () => {
    const result = ReviewSchema.safeParse({ ...validReview, content: '' });
    expect(result.success).toBe(false);
  });

  it('should validate CreateReviewSchema with minimum content length', () => {
    const request = {
      productId: validReview.productId,
      rating: 4,
      content: 'This is at least 10 chars.',
    };
    const result = CreateReviewSchema.safeParse(request);
    expect(result.success).toBe(true);
  });

  it('should reject CreateReviewSchema with too short content', () => {
    const request = {
      productId: validReview.productId,
      rating: 4,
      content: 'Too short',
    };
    const result = CreateReviewSchema.safeParse(request);
    expect(result.success).toBe(false);
  });
});
