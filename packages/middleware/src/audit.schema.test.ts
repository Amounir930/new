/**
 * Audit Schema Tests
 * Rule 5.1: Zod Schema Validation
 */

import { describe, expect, it } from 'bun:test';
import {
  AuditLogSchema,
  type CreateAuditLogDto,
  CreateAuditLogSchema,
} from './audit.schema.js';

describe('Audit Schema Validation', () => {
  describe('AuditLogSchema', () => {
    it('should validate valid audit log entry', () => {
      const validLog = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        tenantId: '550e8400-e29b-41d4-a716-446655440001',
        userId: '550e8400-e29b-41d4-a716-446655440002',
        userEmail: 'user@example.com',
        action: 'CREATE',
        entityType: 'Product',
        entityId: '550e8400-e29b-41d4-a716-446655440003',
        metadata: { price: 100 },
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
        timestamp: '2024-01-01T00:00:00.000Z',
      };

      const result = AuditLogSchema.safeParse(validLog);
      expect(result.success).toBe(true);
    });

    it('should reject invalid action', () => {
      const invalidLog = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        tenantId: '550e8400-e29b-41d4-a716-446655440001',
        userId: '550e8400-e29b-41d4-a716-446655440002',
        userEmail: 'user@example.com',
        action: 'INVALID_ACTION',
        entityType: 'Product',
        entityId: '550e8400-e29b-41d4-a716-446655440003',
        metadata: {},
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
        timestamp: '2024-01-01T00:00:00.000Z',
      };

      const result = AuditLogSchema.safeParse(invalidLog);
      expect(result.success).toBe(false);
    });

    it('should accept all valid actions', () => {
      const actions = [
        'CREATE',
        'UPDATE',
        'DELETE',
        'LOGIN',
        'LOGOUT',
        'EXPORT',
      ];

      for (const action of actions) {
        const log = {
          id: '550e8400-e29b-41d4-a716-446655440000',
          tenantId: '550e8400-e29b-41d4-a716-446655440001',
          userId: '550e8400-e29b-41d4-a716-446655440002',
          userEmail: 'user@example.com',
          action,
          entityType: 'Product',
          entityId: '550e8400-e29b-41d4-a716-446655440003',
          metadata: {},
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0',
          timestamp: '2024-01-01T00:00:00.000Z',
        };

        const result = AuditLogSchema.safeParse(log);
        expect(result.success).toBe(true);
      }
    });

    it('should reject invalid email', () => {
      const invalidLog = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        tenantId: '550e8400-e29b-41d4-a716-446655440001',
        userId: '550e8400-e29b-41d4-a716-446655440002',
        userEmail: 'invalid-email',
        action: 'CREATE',
        entityType: 'Product',
        entityId: '550e8400-e29b-41d4-a716-446655440003',
        metadata: {},
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
        timestamp: '2024-01-01T00:00:00.000Z',
      };

      const result = AuditLogSchema.safeParse(invalidLog);
      expect(result.success).toBe(false);
    });

    it('should reject invalid IP address', () => {
      const invalidLog = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        tenantId: '550e8400-e29b-41d4-a716-446655440001',
        userId: '550e8400-e29b-41d4-a716-446655440002',
        userEmail: 'user@example.com',
        action: 'CREATE',
        entityType: 'Product',
        entityId: '550e8400-e29b-41d4-a716-446655440003',
        metadata: {},
        ipAddress: 'invalid-ip',
        userAgent: 'Mozilla/5.0',
        timestamp: '2024-01-01T00:00:00.000Z',
      };

      const result = AuditLogSchema.safeParse(invalidLog);
      expect(result.success).toBe(false);
    });

    it('should reject invalid timestamp', () => {
      const invalidLog = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        tenantId: '550e8400-e29b-41d4-a716-446655440001',
        userId: '550e8400-e29b-41d4-a716-446655440002',
        userEmail: 'user@example.com',
        action: 'CREATE',
        entityType: 'Product',
        entityId: '550e8400-e29b-41d4-a716-446655440003',
        metadata: {},
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
        timestamp: 'invalid-timestamp',
      };

      const result = AuditLogSchema.safeParse(invalidLog);
      expect(result.success).toBe(false);
    });
  });

  describe('CreateAuditLogSchema', () => {
    it('should validate valid create audit log entry', () => {
      const validLog = {
        tenantId: '550e8400-e29b-41d4-a716-446655440001',
        userId: '550e8400-e29b-41d4-a716-446655440002',
        userEmail: 'user@example.com',
        action: 'CREATE',
        entityType: 'Product',
        entityId: '550e8400-e29b-41d4-a716-446655440003',
        metadata: { price: 100 },
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
      };

      const result = CreateAuditLogSchema.safeParse(validLog);
      expect(result.success).toBe(true);
    });

    it('should reject missing required fields', () => {
      const invalidLog = {
        tenantId: '550e8400-e29b-41d4-a716-446655440001',
      };

      const result = CreateAuditLogSchema.safeParse(invalidLog);
      expect(result.success).toBe(false);
    });

    it('should accept without optional metadata', () => {
      const validLog = {
        tenantId: '550e8400-e29b-41d4-a716-446655440001',
        userId: '550e8400-e29b-41d4-a716-446655440002',
        userEmail: 'user@example.com',
        action: 'LOGIN',
        entityType: 'User',
        entityId: '550e8400-e29b-41d4-a716-446655440002',
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
      };

      const result = CreateAuditLogSchema.safeParse(validLog);
      expect(result.success).toBe(true);
    });

    it('should infer correct type', () => {
      const log: CreateAuditLogDto = {
        tenantId: '550e8400-e29b-41d4-a716-446655440001',
        userId: '550e8400-e29b-41d4-a716-446655440002',
        userEmail: 'user@example.com',
        action: 'CREATE',
        entityType: 'Product',
        entityId: '550e8400-e29b-41d4-a716-446655440003',
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
      };
      expect(log.action).toBe('CREATE');
    });
  });
});
