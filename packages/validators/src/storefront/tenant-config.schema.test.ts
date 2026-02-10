import { describe, expect, it } from 'vitest';
import { TenantConfigSchema } from './tenant-config.schema.js';

describe('TenantConfigSchema', () => {
  const validData = {
    tenantId: '550e8400-e29b-41d4-a716-446655440000',
    subdomain: 'test-store',
    storeName: 'Test Store',
    logoUrl: 'https://example.com/logo.png',
    faviconUrl: 'https://example.com/favicon.ico',
    primaryColor: '#2563eb',
    secondaryColor: '#f8fafc',
    fontFamily: 'Inter',
    defaultLanguage: 'en',
    currency: 'USD',
    timezone: 'UTC',
    rtlEnabled: false,
    features: {
      wishlist: true,
      compareProducts: true,
      reviews: true,
      loyalty: false,
      b2b: false,
      affiliates: false,
      aiRecommendations: false,
    },
    socialLinks: {
      instagram: 'https://instagram.com/test',
      twitter: 'https://twitter.com/test',
      facebook: 'https://facebook.com/test',
      whatsapp: null,
    },
    contactEmail: 'admin@test.com',
    contactPhone: '+1234567890',
    address: '123 Test St',
  };

  it('should validate valid tenant config', () => {
    const result = TenantConfigSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it('should reject invalid UUID for tenantId', () => {
    const result = TenantConfigSchema.safeParse({
      ...validData,
      tenantId: 'not-a-uuid',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe(
        'Tenant ID must be a valid UUID'
      );
    }
  });

  it('should reject invalid subdomain characters', () => {
    const result = TenantConfigSchema.safeParse({
      ...validData,
      subdomain: 'Invalid_Subdomain!',
    });
    expect(result.success).toBe(false);
  });

  it('should reject invalid primaryColor hex', () => {
    const result = TenantConfigSchema.safeParse({
      ...validData,
      primaryColor: 'red',
    });
    expect(result.success).toBe(false);
  });

  it('should reject unsupported fontFamily', () => {
    const result = TenantConfigSchema.safeParse({
      ...validData,
      fontFamily: 'Comic Sans',
    });
    expect(result.success).toBe(false);
  });

  it('should reject invalid timezone', () => {
    const result = TenantConfigSchema.safeParse({
      ...validData,
      timezone: 'Invalid/Timezone',
    });
    expect(result.success).toBe(false);
  });

  it('should allow null for optional URLs and contact info', () => {
    const result = TenantConfigSchema.safeParse({
      ...validData,
      logoUrl: null,
      contactPhone: null,
      address: null,
    });
    expect(result.success).toBe(true);
  });
});
