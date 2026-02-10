/**
 * Tenant Isolation Middleware Tests
 * S2 Protocol: Tenant Isolation
 */

import { UnauthorizedException } from '@nestjs/common';
import { NextFunction } from 'express';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  SuperAdminOrTenantGuard,
  TenantIsolationMiddleware,
  TenantScopedGuard,
} from './tenant-isolation.middleware.js';

// 🛡️ Stabilization: Use 'mock' prefix so Vitest hoists these variables
const mockDb = {
  select: vi.fn().mockReturnThis(),
  from: vi.fn().mockReturnThis(),
  where: vi.fn().mockReturnThis(),
  limit: vi.fn().mockResolvedValue([]),
};

vi.mock('@apex/db', () => ({
  publicDb: mockDb,
  tenants: {
    id: 'id-col',
    subdomain: 'sub-col',
    plan: 'plan-col',
    status: 'status-col',
  },
}));

describe('TenantIsolationMiddleware', () => {
  let middleware: TenantIsolationMiddleware;
  let req: any;
  let res: any;
  let next: NextFunction;

  beforeEach(() => {
    vi.clearAllMocks();
    middleware = new TenantIsolationMiddleware();
    req = {
      headers: { host: 'alpha.apex.localhost' },
      path: '/api/data',
    };
    res = {
      setHeader: vi.fn(),
    };
    next = vi.fn();
  });

  describe('Subdomain Extraction', () => {
    it('should resolve tenant for localhost subdomains', async () => {
      mockDb.limit.mockResolvedValueOnce([
        { id: 'uuid-1', subdomain: 'alpha', plan: 'pro', status: 'active' },
      ]);
      await middleware.use(req, res, next);
      expect(req.tenantContext.subdomain).toBe('alpha');
      expect(next).toHaveBeenCalled();
    });

    it('should bypass for root domain', async () => {
      req.headers.host = 'localhost';
      await middleware.use(req, res, next);
      expect(req.tenantContext).toBeUndefined();
      expect(next).toHaveBeenCalled();
    });

    it('should bypass for specific routes', async () => {
      req.path = '/health';
      await middleware.use(req, res, next);
      expect(next).toHaveBeenCalled();
      expect(mockDb.select).not.toHaveBeenCalled();
    });
  });

  describe('Tenant Validation', () => {
    it('should throw UnauthorizedException if tenant not found', async () => {
      mockDb.limit.mockResolvedValueOnce([]);
      await expect(middleware.use(req, res, next)).rejects.toThrow(
        UnauthorizedException
      );
    });

    it('should throw UnauthorizedException if tenant suspended', async () => {
      mockDb.limit.mockResolvedValueOnce([
        { id: 'u1', subdomain: 'a', status: 'suspended' },
      ]);
      await expect(middleware.use(req, res, next)).rejects.toThrow(
        UnauthorizedException
      );
    });
  });
});

describe('Guards', () => {
  describe('TenantScopedGuard', () => {
    const guard = new TenantScopedGuard();

    it('should allow active tenants', () => {
      const context = {
        switchToHttp: () => ({
          getRequest: () => ({ tenantContext: { isActive: true } }),
        }),
      } as any;
      expect(guard.canActivate(context)).toBe(true);
    });

    it('should block missing context', () => {
      const context = {
        switchToHttp: () => ({
          getRequest: () => ({}),
        }),
      } as any;
      expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
    });
  });

  describe('SuperAdminOrTenantGuard', () => {
    const guard = new SuperAdminOrTenantGuard();

    it('should block cross-tenant access for regular users', () => {
      const context = {
        switchToHttp: () => ({
          getRequest: () => ({
            user: { tenantId: 't1' },
            tenantContext: { tenantId: 't2', isActive: true },
          }),
        }),
      } as any;
      expect(() => guard.canActivate(context)).toThrow(
        'Cross-tenant access denied'
      );
    });

    it('should allow super admin access to any tenant', () => {
      const context = {
        switchToHttp: () => ({
          getRequest: () => ({
            user: { role: 'super_admin' },
            tenantContext: { tenantId: 't2', isActive: true },
          }),
        }),
      } as any;
      expect(guard.canActivate(context)).toBe(true);
    });
  });
});
