/**
 * Tenant Isolation Middleware Tests
 * S2 Protocol: Tenant Isolation
 */

import { beforeEach, describe, expect, it, mock } from 'bun:test';
import { UnauthorizedException } from '@nestjs/common';
import type { NextFunction } from 'express';
import {
  SuperAdminOrTenantGuard,
  TenantIsolationMiddleware,
  TenantScopedGuard,
} from './tenant-isolation.middleware.js';

// Setup Mocks
const mockDb = {
  select: mock().mockReturnThis(),
  from: mock().mockReturnThis(),
  where: mock().mockReturnThis(),
  limit: mock().mockResolvedValue([]),
};

const mockClient = {
  query: mock().mockResolvedValue(undefined),
  release: mock(),
};

const mockPool = {
  connect: mock().mockResolvedValue(mockClient),
};

mock.module('@apex/db', () => ({
  adminDb: mockDb,
  adminPool: mockPool,
  redis: {
    exists: mock().mockResolvedValue(0),
  },
  tenantsInGovernance: {
    id: 'id-col',
    subdomain: 'sub-col',
    plan: 'plan-col',
    status: 'status-col',
  },
  eq: mock(),
  or: mock(),
}));

mock.module('@apex/config', () => ({
  env: {
    APP_ROOT_DOMAIN: 'apex.localhost',
    INTERNAL_API_SECRET: 'test-secret',
  },
}));

// Mock security service
mock.module('./security.service.js', () => ({
  SecurityService: class SecurityService {
    getTenantLock = mock().mockResolvedValue(null);
  },
}));

// Mock connection context
mock.module('./connection-context.js', () => ({
  tenantStorage: {
    run: mock((_ctx, cb) => cb()),
  },
}));

describe('TenantIsolationMiddleware', () => {
  let middleware: TenantIsolationMiddleware;
  let req: any;
  let res: any;
  let next: NextFunction;

  beforeEach(() => {
    mockDb.limit.mockReset().mockResolvedValue([]);
    mockDb.select.mockClear();
    mockDb.from.mockClear();
    mockDb.where.mockClear();
    mockClient.query.mockClear();
    middleware = new TenantIsolationMiddleware();
    req = {
      headers: { host: 'alpha.apex.localhost' },
      path: '/api/data',
      originalUrl: '/api/data',
    };
    res = {
      setHeader: mock(),
      status: mock().mockReturnValue({ json: mock() }),
      once: mock(),
    };
    next = mock();
  });

  describe('Subdomain Extraction', () => {
    it('should resolve tenant for localhost subdomains', async () => {
      // Mock tenant lookup to return valid tenant
      mockDb.limit
        .mockResolvedValueOnce([]) // maintenance mode check
        .mockResolvedValueOnce([
          {
            id: 'uuid-1',
            subdomain: 'alpha',
            plan: 'pro',
            status: 'active',
            custom_domain: null,
          },
        ]);

      await middleware.use(req, res, next);
      expect(req.tenantContext).toBeDefined();
      expect(req.tenantContext?.subdomain).toBe('alpha');
      expect(next).toHaveBeenCalled();
    });

    it('should assign system context for root domain', async () => {
      req.headers.host = 'apex.localhost';
      await middleware.use(req, res, next);
      expect(req.tenantContext).toBeDefined();
      expect(req.tenantContext?.tenantId).toBe('system');
      expect(next).toHaveBeenCalled();
    });

    it('should bypass for specific routes', async () => {
      req.path = '/health';
      req.originalUrl = '/health';
      await middleware.use(req, res, next);
      expect(next).toHaveBeenCalled();
      expect(mockDb.select).not.toHaveBeenCalled();
    });
  });

  describe('Tenant Validation', () => {
    it('should throw UnauthorizedException if tenant not found', async () => {
      mockDb.limit.mockResolvedValueOnce([]); // maintenance mode check
      mockDb.limit.mockResolvedValueOnce([]); // tenant lookup - empty result

      await expect(middleware.use(req, res, next)).rejects.toThrow(
        UnauthorizedException
      );
    });

    it('should throw UnauthorizedException if tenant suspended', async () => {
      mockDb.limit
        .mockResolvedValueOnce([]) // maintenance mode check
        .mockResolvedValueOnce([
          {
            id: 'u1',
            subdomain: 'alpha',
            status: 'suspended',
            plan: 'pro',
            custom_domain: null,
          },
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
