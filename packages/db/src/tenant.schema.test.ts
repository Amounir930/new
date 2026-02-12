/**
 * Tenant Schema Tests
 * S3 Protocol: Input Validation
 * Rule 4.1: Test Coverage Mandate
 */

import { describe, expect, it } from 'bun:test';
import {
  type CreateTenantDto,
  CreateTenantSchema,
  type TenantResponseDto,
  TenantResponseSchema,
  type UpdateTenantDto,
  UpdateTenantSchema,
} from './tenant.schema.js';

describe('Tenant Schema', () => {
  describe('CreateTenantSchema', () => {
    it('should validate valid tenant creation data', () => {
      const validData = {
        subdomain: 'my-store',
        name: 'My Store',
        adminEmail: 'admin@example.com',
        plan: 'basic' as const,
      };

      const result = CreateTenantSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should validate with default free plan', () => {
      const dataWithoutPlan = {
        subdomain: 'my-store',
        name: 'My Store',
        adminEmail: 'admin@example.com',
      };

      const result = CreateTenantSchema.safeParse(dataWithoutPlan);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.plan).toBe('free');
      }
    });

    it('should reject subdomain shorter than 3 characters', () => {
      const invalidData = {
        subdomain: 'ab',
        name: 'My Store',
        adminEmail: 'admin@example.com',
      };

      const result = CreateTenantSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject subdomain longer than 30 characters', () => {
      const invalidData = {
        subdomain: 'a'.repeat(31),
        name: 'My Store',
        adminEmail: 'admin@example.com',
      };

      const result = CreateTenantSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject subdomain with uppercase letters', () => {
      const invalidData = {
        subdomain: 'MyStore',
        name: 'My Store',
        adminEmail: 'admin@example.com',
      };

      const result = CreateTenantSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject subdomain with special characters', () => {
      const invalidData = {
        subdomain: 'my_store!',
        name: 'My Store',
        adminEmail: 'admin@example.com',
      };

      const result = CreateTenantSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should accept subdomain with hyphens', () => {
      const validData = {
        subdomain: 'my-store-name',
        name: 'My Store',
        adminEmail: 'admin@example.com',
      };

      const result = CreateTenantSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should accept subdomain with numbers', () => {
      const validData = {
        subdomain: 'store123',
        name: 'My Store',
        adminEmail: 'admin@example.com',
      };

      const result = CreateTenantSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject name shorter than 2 characters', () => {
      const invalidData = {
        subdomain: 'my-store',
        name: 'A',
        adminEmail: 'admin@example.com',
      };

      const result = CreateTenantSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject name longer than 100 characters', () => {
      const invalidData = {
        subdomain: 'my-store',
        name: 'A'.repeat(101),
        adminEmail: 'admin@example.com',
      };

      const result = CreateTenantSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject invalid email format', () => {
      const invalidData = {
        subdomain: 'my-store',
        name: 'My Store',
        adminEmail: 'not-an-email',
      };

      const result = CreateTenantSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should accept all valid plan types', () => {
      const plans = ['free', 'basic', 'pro', 'enterprise'] as const;

      for (const plan of plans) {
        const validData = {
          subdomain: 'my-store',
          name: 'My Store',
          adminEmail: 'admin@example.com',
          plan,
        };

        const result = CreateTenantSchema.safeParse(validData);
        expect(result.success).toBe(true);
      }
    });

    it('should reject invalid plan type', () => {
      const invalidData = {
        subdomain: 'my-store',
        name: 'My Store',
        adminEmail: 'admin@example.com',
        plan: 'invalid-plan',
      };

      const result = CreateTenantSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject missing required fields', () => {
      const result = CreateTenantSchema.safeParse({});
      expect(result.success).toBe(false);
    });

    it('should reject missing subdomain', () => {
      const dataWithoutSubdomain = {
        name: 'My Store',
        adminEmail: 'admin@example.com',
      };

      const result = CreateTenantSchema.safeParse(dataWithoutSubdomain);
      expect(result.success).toBe(false);
    });

    it('should reject missing name', () => {
      const dataWithoutName = {
        subdomain: 'my-store',
        adminEmail: 'admin@example.com',
      };

      const result = CreateTenantSchema.safeParse(dataWithoutName);
      expect(result.success).toBe(false);
    });

    it('should reject missing adminEmail', () => {
      const dataWithoutEmail = {
        subdomain: 'my-store',
        name: 'My Store',
      };

      const result = CreateTenantSchema.safeParse(dataWithoutEmail);
      expect(result.success).toBe(false);
    });
  });

  describe('TenantResponseSchema', () => {
    it('should validate valid tenant response', () => {
      const validResponse = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        subdomain: 'my-store',
        name: 'My Store',
        plan: 'basic' as const,
        status: 'active' as const,
        createdAt: '2024-01-01T00:00:00Z',
      };

      const result = TenantResponseSchema.safeParse(validResponse);
      expect(result.success).toBe(true);
    });

    it('should accept all valid status types', () => {
      const statuses = ['active', 'suspended', 'pending'] as const;

      for (const status of statuses) {
        const validResponse = {
          id: '550e8400-e29b-41d4-a716-446655440000',
          subdomain: 'my-store',
          name: 'My Store',
          plan: 'basic' as const,
          status,
          createdAt: '2024-01-01T00:00:00Z',
        };

        const result = TenantResponseSchema.safeParse(validResponse);
        expect(result.success).toBe(true);
      }
    });

    it('should reject invalid UUID format for id', () => {
      const invalidResponse = {
        id: 'not-a-uuid',
        subdomain: 'my-store',
        name: 'My Store',
        plan: 'basic',
        status: 'active',
        createdAt: '2024-01-01T00:00:00Z',
      };

      const result = TenantResponseSchema.safeParse(invalidResponse);
      expect(result.success).toBe(false);
    });

    it('should reject invalid datetime format', () => {
      const invalidResponse = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        subdomain: 'my-store',
        name: 'My Store',
        plan: 'basic',
        status: 'active',
        createdAt: 'not-a-datetime',
      };

      const result = TenantResponseSchema.safeParse(invalidResponse);
      expect(result.success).toBe(false);
    });

    it('should reject missing required fields', () => {
      const result = TenantResponseSchema.safeParse({});
      expect(result.success).toBe(false);
    });
  });

  describe('UpdateTenantSchema', () => {
    it('should validate partial update with only name', () => {
      const updateData = {
        name: 'Updated Store Name',
      };

      const result = UpdateTenantSchema.safeParse(updateData);
      expect(result.success).toBe(true);
    });

    it('should validate partial update with only plan', () => {
      const updateData = {
        plan: 'pro' as const,
      };

      const result = UpdateTenantSchema.safeParse(updateData);
      expect(result.success).toBe(true);
    });

    it('should validate partial update with only status', () => {
      const updateData = {
        status: 'suspended' as const,
      };

      const result = UpdateTenantSchema.safeParse(updateData);
      expect(result.success).toBe(true);
    });

    it('should validate full update', () => {
      const updateData = {
        name: 'Updated Store Name',
        plan: 'enterprise' as const,
        status: 'active' as const,
      };

      const result = UpdateTenantSchema.safeParse(updateData);
      expect(result.success).toBe(true);
    });

    it('should accept empty object (no updates)', () => {
      const result = UpdateTenantSchema.safeParse({});
      expect(result.success).toBe(true);
    });

    it('should reject name shorter than 2 characters', () => {
      const invalidData = {
        name: 'A',
      };

      const result = UpdateTenantSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject name longer than 100 characters', () => {
      const invalidData = {
        name: 'A'.repeat(101),
      };

      const result = UpdateTenantSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject invalid plan type', () => {
      const invalidData = {
        plan: 'invalid-plan',
      };

      const result = UpdateTenantSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject invalid status type', () => {
      const invalidData = {
        status: 'deleted',
      };

      const result = UpdateTenantSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('Type exports', () => {
    it('should export CreateTenantDto type', () => {
      const validData: CreateTenantDto = {
        subdomain: 'test-store',
        name: 'Test Store',
        adminEmail: 'test@example.com',
        plan: 'pro',
      };
      expect(validData).toBeDefined();
    });

    it('should export TenantResponseDto type', () => {
      const validData: TenantResponseDto = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        subdomain: 'test-store',
        name: 'Test Store',
        plan: 'pro',
        status: 'active',
        createdAt: '2024-01-01T00:00:00Z',
      };
      expect(validData).toBeDefined();
    });

    it('should export UpdateTenantDto type', () => {
      const validData: UpdateTenantDto = {
        name: 'Updated Name',
        plan: 'enterprise',
      };
      expect(validData).toBeDefined();
    });
  });
});
