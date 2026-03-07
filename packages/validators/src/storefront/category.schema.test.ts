import { describe, expect, it } from 'bun:test';
import { CategorySchema, CategoryTreeNodeSchema } from './category.schema';

describe('CategorySchema', () => {
  const validCategory = {
    id: '550e8400-e29b-41d4-a716-446655440007',
    slug: 'electronics',
    name: 'Electronics',
    description: 'All gadgets and devices',
    imageUrl: 'https://example.com/cat.jpg',
    parentId: null,
    productCount: 150,
    order: 1,
  };

  it('should validate valid category', () => {
    const result = CategorySchema.safeParse(validCategory);
    expect(result.success).toBe(true);
  });

  it('should reject invalid slug characters', () => {
    const result = CategorySchema.safeParse({
      ...validCategory,
      slug: 'Bad_Slug',
    });
    expect(result.success).toBe(false);
  });

  it('should validate recursive category tree', () => {
    const tree = {
      ...validCategory,
      children: [
        {
          ...validCategory,
          id: '550e8400-e29b-41d4-a716-446655440008',
          slug: 'phones',
          name: 'Phones',
          parentId: validCategory.id,
          children: [],
        },
      ],
    };
    const result = CategoryTreeNodeSchema.safeParse(tree);
    expect(result.success).toBe(true);
  });
});
