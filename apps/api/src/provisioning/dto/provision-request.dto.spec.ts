/**
 * Provision Request DTO Tests
 * S3 Protocol: Input Validation
 * Rule 4.1: Test Coverage Mandate
 */

import { describe, expect, it } from 'vitest';
import {
  ProvisionRequestDto,
  ProvisionRequestSchema,
} from './provision-request.dto.js';

describe('ProvisionRequestSchema', () => {
  const validProvisionData = {
    subdomain: 'coffee-beans',
    storeName: 'Coffee Beans Shop',
    adminEmail: 'admin@coffeebeans.com',
    plan: 'basic' as const,
    superAdminKey: 'super-admin-secret-key-32-chars-long',
  };

  it('should validate valid provision request', () => {
    const result = ProvisionRequestSchema.safeParse(validProvisionData);
    expect(result.success).toBe(true);
  });

  it('should validate with default free plan', () => {
    const dataWithoutPlan = {
      ...validProvisionData,
      plan: undefined,
    };

    const result = ProvisionRequestSchema.safeParse(dataWithoutPlan);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.plan).toBe('free');
    }
  });

  describe('subdomain validation', () => {
    it('should reject subdomain shorter than 3 characters', () => {
      const invalidData = {
        ...validProvisionData,
        subdomain: 'ab',
      };

      const result = ProvisionRequestSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject subdomain longer than 30 characters', () => {
      const invalidData = {
        ...validProvisionData,
        subdomain: 'a'.repeat(31),
      };

      const result = ProvisionRequestSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject subdomain with uppercase letters', () => {
      const invalidData = {
        ...validProvisionData,
        subdomain: 'CoffeeBeans',
      };

      const result = ProvisionRequestSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject subdomain with underscores', () => {
      const invalidData = {
        ...validProvisionData,
        subdomain: 'coffee_beans',
      };

      const result = ProvisionRequestSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject subdomain with special characters', () => {
      const invalidData = {
        ...validProvisionData,
        subdomain: 'coffee@beans',
      };

      const result = ProvisionRequestSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should accept subdomain with hyphens', () => {
      const validData = {
        ...validProvisionData,
        subdomain: 'coffee-beans-shop',
      };

      const result = ProvisionRequestSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should accept subdomain with numbers', () => {
      const validData = {
        ...validProvisionData,
        subdomain: 'coffee123',
      };

      const result = ProvisionRequestSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should accept subdomain starting with number', () => {
      const validData = {
        ...validProvisionData,
        subdomain: '123coffee',
      };

      const result = ProvisionRequestSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });
  });

  describe('storeName validation', () => {
    it('should reject storeName shorter than 2 characters', () => {
      const invalidData = {
        ...validProvisionData,
        storeName: 'A',
      };

      const result = ProvisionRequestSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject storeName longer than 100 characters', () => {
      const invalidData = {
        ...validProvisionData,
        storeName: 'A'.repeat(101),
      };

      const result = ProvisionRequestSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should accept storeName with 2 characters', () => {
      const validData = {
        ...validProvisionData,
        storeName: 'AB',
      };

      const result = ProvisionRequestSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should accept storeName with 100 characters', () => {
      const validData = {
        ...validProvisionData,
        storeName: 'A'.repeat(100),
      };

      const result = ProvisionRequestSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should accept storeName with special characters', () => {
      const validData = {
        ...validProvisionData,
        storeName: 'Coffee & Beans™ Shop 🍵',
      };

      const result = ProvisionRequestSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });
  });

  describe('adminEmail validation', () => {
    it('should reject invalid email format', () => {
      const invalidData = {
        ...validProvisionData,
        adminEmail: 'not-an-email',
      };

      const result = ProvisionRequestSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject email without @ symbol', () => {
      const invalidData = {
        ...validProvisionData,
        adminEmail: 'admin.example.com',
      };

      const result = ProvisionRequestSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject email without domain', () => {
      const invalidData = {
        ...validProvisionData,
        adminEmail: 'admin@',
      };

      const result = ProvisionRequestSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should accept valid email with subdomain', () => {
      const validData = {
        ...validProvisionData,
        adminEmail: 'admin@sub.domain.com',
      };

      const result = ProvisionRequestSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should accept valid email with plus sign', () => {
      const validData = {
        ...validProvisionData,
        adminEmail: 'admin+test@example.com',
      };

      const result = ProvisionRequestSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });
  });

  describe('plan validation', () => {
    it('should accept all valid plan types', () => {
      const plans = ['free', 'basic', 'pro', 'enterprise'] as const;

      for (const plan of plans) {
        const validData = {
          ...validProvisionData,
          plan,
        };

        const result = ProvisionRequestSchema.safeParse(validData);
        expect(result.success).toBe(true);
      }
    });

    it('should reject invalid plan type', () => {
      const invalidData = {
        ...validProvisionData,
        plan: 'invalid-plan',
      };

      const result = ProvisionRequestSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject premium as plan type', () => {
      const invalidData = {
        ...validProvisionData,
        plan: 'premium',
      };

      const result = ProvisionRequestSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('superAdminKey validation', () => {
    it('should reject superAdminKey shorter than 32 characters', () => {
      const invalidData = {
        ...validProvisionData,
        superAdminKey: 'short-key',
      };

      const result = ProvisionRequestSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject superAdminKey longer than 128 characters', () => {
      const invalidData = {
        ...validProvisionData,
        superAdminKey: 'a'.repeat(129),
      };

      const result = ProvisionRequestSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should accept superAdminKey with exactly 32 characters', () => {
      const validData = {
        ...validProvisionData,
        superAdminKey: 'a'.repeat(32),
      };

      const result = ProvisionRequestSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should accept superAdminKey with exactly 128 characters', () => {
      const validData = {
        ...validProvisionData,
        superAdminKey: 'a'.repeat(128),
      };

      const result = ProvisionRequestSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject superAdminKey with spaces', () => {
      const invalidData = {
        ...validProvisionData,
        superAdminKey: 'super admin key with 32 chars long',
      };

      const result = ProvisionRequestSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should accept superAdminKey with hyphens', () => {
      const validData = {
        ...validProvisionData,
        superAdminKey: 'super-admin-key-with-exactly-32-chars',
      };

      const result = ProvisionRequestSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should accept superAdminKey with underscores', () => {
      const validData = {
        ...validProvisionData,
        superAdminKey: 'super_admin_key_with_exactly_32_chars',
      };

      const result = ProvisionRequestSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject superAdminKey with special characters', () => {
      const invalidData = {
        ...validProvisionData,
        superAdminKey: 'super@admin#key$with%32&chars*long!',
      };

      const result = ProvisionRequestSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject missing superAdminKey', () => {
      const { superAdminKey, ...dataWithoutKey } = validProvisionData;

      const result = ProvisionRequestSchema.safeParse(dataWithoutKey);
      expect(result.success).toBe(false);
    });

    it('should reject null superAdminKey', () => {
      const invalidData = {
        ...validProvisionData,
        superAdminKey: null,
      };

      const result = ProvisionRequestSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject undefined superAdminKey', () => {
      const invalidData = {
        ...validProvisionData,
        superAdminKey: undefined,
      };

      const result = ProvisionRequestSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('missing required fields', () => {
    it('should reject empty object', () => {
      const result = ProvisionRequestSchema.safeParse({});
      expect(result.success).toBe(false);
    });

    it('should reject missing subdomain', () => {
      const { subdomain, ...dataWithoutSubdomain } = validProvisionData;
      const result = ProvisionRequestSchema.safeParse(dataWithoutSubdomain);
      expect(result.success).toBe(false);
    });

    it('should reject missing storeName', () => {
      const { storeName, ...dataWithoutStoreName } = validProvisionData;
      const result = ProvisionRequestSchema.safeParse(dataWithoutStoreName);
      expect(result.success).toBe(false);
    });

    it('should reject missing adminEmail', () => {
      const { adminEmail, ...dataWithoutEmail } = validProvisionData;
      const result = ProvisionRequestSchema.safeParse(dataWithoutEmail);
      expect(result.success).toBe(false);
    });
  });
});

describe('ProvisionRequestDto', () => {
  it('should be defined', () => {
    expect(ProvisionRequestDto).toBeDefined();
  });
});
