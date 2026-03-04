/**
 * Tenant-JWT Match Guard Tests
 * S2: Security Protocol - Cross-tenant access prevention
 * Rule 4.1: Test Coverage Mandate
 */

import { beforeEach, describe, expect, it, mock, spyOn } from 'bun:test';
import { UnauthorizedException } from '@nestjs/common';
import {
  TenantJwtMatchGuard,
  type TenantRequest,
} from './tenant-jwt-match.guard.js';

describe('TenantJwtMatchGuard', () => {
  let guard: TenantJwtMatchGuard;
  let mockContext: unknown;
  let mockRequest: Partial<TenantRequest>;

  beforeEach(() => {
    mock.restore();
    guard = new TenantJwtMatchGuard();

    mockRequest = {
      tenantContext: {
        tenantId: 'tenant-123',
      },
      user: {
        tenantId: 'tenant-123',
        id: 'user-456',
        email: 'test@example.com',
      },
    };

    mockContext = {
      switchToHttp: mock().mockReturnValue({
        getRequest: mock().mockReturnValue(mockRequest),
      }),
    };
  });

  describe('canActivate', () => {
    it('should allow access when JWT tenant matches request tenant', () => {
      const result = guard.canActivate(mockContext);
      expect(result).toBe(true);
    });

    it('should allow access when no user (unauthenticated request)', () => {
      mockRequest.user = undefined;

      const result = guard.canActivate(mockContext);
      expect(result).toBe(true);
    });

    it('should allow access when no tenant context (public endpoint)', () => {
      mockRequest.tenantContext = undefined;

      const result = guard.canActivate(mockContext);
      expect(result).toBe(true);
    });

    it('should throw UnauthorizedException when JWT tenant does not match request tenant', () => {
      mockRequest.user = {
        tenantId: 'different-tenant-456',
        id: 'user-456',
        email: 'test@example.com',
      };

      expect(() => guard.canActivate(mockContext)).toThrow(
        UnauthorizedException
      );
      expect(() => guard.canActivate(mockContext)).toThrow(
        'Cross-tenant access denied'
      );
    });

    it('should log S2 violation when cross-tenant access is attempted', () => {
      const consoleSpy = spyOn(console, 'error').mockImplementation(() => {});

      mockRequest.user = {
        tenantId: 'attacker-tenant',
        id: 'user-456',
        email: 'attacker@example.com',
      };

      try {
        guard.canActivate(mockContext);
      } catch {
        // Expected to throw
      }

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('S2 VIOLATION')
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('attacker-tenant')
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('tenant-123')
      );
    });

    it('should allow access when JWT has no tenantId (system user)', () => {
      mockRequest.user = {
        id: 'system-user',
        email: 'system@example.com',
        // No tenantId
      };

      const result = guard.canActivate(mockContext);
      expect(result).toBe(true);
    });

    it('should handle request with minimal context', () => {
      mockRequest = {
        tenantContext: { tenantId: 'minimal-tenant' },
        user: { tenantId: 'minimal-tenant' },
      };

      mockContext.switchToHttp().getRequest.mockReturnValue(mockRequest);

      const result = guard.canActivate(mockContext);
      expect(result).toBe(true);
    });

    it('should throw when tenant IDs are different strings', () => {
      mockRequest.user = {
        tenantId: 'tenant-ABC',
        id: 'user-123',
      };
      mockRequest.tenantContext = {
        tenantId: 'tenant-abc',
      };

      expect(() => guard.canActivate(mockContext)).toThrow(
        UnauthorizedException
      );
    });

    it('should be case sensitive for tenant IDs', () => {
      mockRequest.user = {
        tenantId: 'Tenant-123',
        id: 'user-123',
      };
      mockRequest.tenantContext = {
        tenantId: 'tenant-123',
      };

      expect(() => guard.canActivate(mockContext)).toThrow(
        UnauthorizedException
      );
    });

    it('should handle both user and tenantContext being undefined', () => {
      mockRequest.user = undefined;
      mockRequest.tenantContext = undefined;

      const result = guard.canActivate(mockContext);
      expect(result).toBe(true);
    });

    it('should handle different UUID formats correctly', () => {
      const uuid1 = '550e8400-e29b-41d4-a716-446655440000';
      const uuid2 = '550e8400-e29b-41d4-a716-446655440001';

      mockRequest.user = {
        tenantId: uuid1,
        id: 'user-123',
      };
      mockRequest.tenantContext = {
        tenantId: uuid2,
      };

      expect(() => guard.canActivate(mockContext)).toThrow(
        UnauthorizedException
      );
    });

    it('should allow access when UUIDs match', () => {
      const uuid = '550e8400-e29b-41d4-a716-446655440000';

      mockRequest.user = {
        tenantId: uuid,
        id: 'user-123',
      };
      mockRequest.tenantContext = {
        tenantId: uuid,
      };

      const result = guard.canActivate(mockContext);
      expect(result).toBe(true);
    });
  });
});
