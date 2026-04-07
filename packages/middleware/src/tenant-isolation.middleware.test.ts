import { beforeEach, describe, expect, it, mock } from 'bun:test';
import { type Mocked, MockFactory } from '@apex/test-utils';
import type { Response } from 'express';
import type { TenantIsolationMiddleware } from './tenant-isolation.middleware';
import { SYSTEM_TENANT_ID } from '@apex/db';

// MUST be before any other imports
mock.module('@apex/config', () => ({
  env: {
    APP_ROOT_DOMAIN: 'apex.localhost',
    INTERNAL_API_SECRET: 'test-secret',
    NODE_ENV: 'test',
  },
}));

const mockDb = MockFactory.createQueryBuilder();

mock.module('@apex/db', () => ({
  adminDb: mockDb,
  adminPool: {
    connect: mock().mockResolvedValue({
      query: mock().mockResolvedValue(undefined),
      release: mock(),
    }),
  },
  SYSTEM_TENANT_ID: '00000000-0000-0000-0000-000000000000',
  tenantsInGovernance: {
    id: 'id-col',
    subdomain: 'sub-col',
    plan: 'plan-col',
    status: 'status-col',
  },
  eq: mock((col: unknown, val: unknown) => ({ type: 'eq', col, val })),
  or: mock((...conditions: unknown[]) => ({ type: 'or', conditions })),
  sql: mock((strings: TemplateStringsArray, ...values: unknown[]) => ({
    sql: String.raw(strings, ...values),
  })),
}));

mock.module('./security.service', () => ({
  SecurityService: class SecurityService {
    getTenantLock = mock().mockResolvedValue(null);
  },
}));

mock.module('./connection-context', () => ({
  tenantStorage: {
    run: mock((_ctx: unknown, cb: () => unknown) => cb()),
    getStore: mock(() => ({})),
    setContext: mock(() => { }),
  },
}));

const {
  TenantIsolationMiddleware: TenantIsolationMiddlewareClass,
  TenantScopedGuard: TenantScopedGuardClass,
  SuperAdminOrTenantGuard: SuperAdminOrTenantGuardClass,
} = (await import(
  './tenant-isolation.middleware'
)) as typeof import('./tenant-isolation.middleware');

import { type ExecutionContext, UnauthorizedException } from '@nestjs/common';
import type { TenantRequest } from './tenant-isolation.middleware';

describe('TenantIsolationMiddleware', () => {
  let middleware: TenantIsolationMiddleware;
  let req: Mocked<TenantRequest>;
  let res: Mocked<Response>;
  let next: () => void;

  beforeEach(() => {
    mockDb.mockReset();
    middleware = new TenantIsolationMiddlewareClass();
    req = MockFactory.createRequest({
      headers: { host: 'alpha.apex.localhost' },
    }) as Mocked<TenantRequest>;
    res = MockFactory.createResponse();
    next = mock();
  });

  describe('Subdomain Extraction', () => {
    it('should resolve tenant for localhost subdomains', async () => {
      mockDb.limit.mockResolvedValueOnce([
        {
          id: 'uuid-1',
          subdomain: 'alpha',
          plan: 'pro',
          status: 'active',
        },
      ]);

      await middleware.use(req, res, next);
      expect(req.tenantContext).toBeDefined();
      expect(req.tenantContext?.subdomain).toBe('alpha');
      expect(next).toHaveBeenCalled();
    });

    it('should assign system context for root domain', async () => {
      req = MockFactory.createRequest({
        headers: { host: 'apex.localhost' },
      }) as Mocked<TenantRequest>;
      await middleware.use(req, res, next);
      expect(req.tenantContext).toBeDefined();
      expect(req.tenantContext?.tenantId).toBe(SYSTEM_TENANT_ID);
      expect(next).toHaveBeenCalled();
    });

    it('should bypass for specific routes', async () => {
      req = MockFactory.createRequest({
        path: '/health',
        originalUrl: '/health',
      }) as Mocked<TenantRequest>;
      await middleware.use(req, res, next);
      expect(next).toHaveBeenCalled();
      expect(mockDb.select).not.toHaveBeenCalled();
    });
  });

  describe('Tenant Validation', () => {
    it('should throw UnauthorizedException if tenant not found', async () => {
      mockDb.returning.mockResolvedValueOnce([]);
      await middleware.use(req, res, next);
      expect(res.status).toHaveBeenCalledWith(403);
    });

    it('should throw UnauthorizedException if tenant suspended', async () => {
      mockDb.returning.mockResolvedValueOnce([
        {
          id: 'u1',
          subdomain: 'alpha',
          status: 'suspended',
          plan: 'pro',
        },
      ]);
      await middleware.use(req, res, next);
      expect(res.status).toHaveBeenCalledWith(403);
    });
  });
});

describe('Guards', () => {
  describe('TenantScopedGuard', () => {
    const guard = new TenantScopedGuardClass();

    it('should allow active tenants', () => {
      const context = MockFactory.createExecutionContext({
        tenantContext: { isActive: true },
      });
      const isExecutionContext = (c: unknown): c is ExecutionContext => true;
      expect(
        guard.canActivate(
          isExecutionContext(context)
            ? context
            : (() => {
              throw new Error('Unreachable');
            })()
        )
      ).toBe(true);
    });

    it('should block missing context', () => {
      const context = MockFactory.createExecutionContext({});
      const isExecutionContext = (c: unknown): c is ExecutionContext => true;
      expect(() =>
        guard.canActivate(
          isExecutionContext(context)
            ? context
            : (() => {
              throw new Error('Unreachable');
            })()
        )
      ).toThrow(UnauthorizedException);
    });
  });

  describe('SuperAdminOrTenantGuard', () => {
    const guard = new SuperAdminOrTenantGuardClass();

    it('should block cross-tenant access for regular users', () => {
      const context = MockFactory.createExecutionContext({
        user: { tenantId: 't1' },
        tenantContext: { tenantId: 't2', isActive: true },
      });
      const isExecutionContext = (c: unknown): c is ExecutionContext => true;
      expect(() =>
        guard.canActivate(
          isExecutionContext(context)
            ? context
            : (() => {
              throw new Error('Unreachable');
            })()
        )
      ).toThrow('Cross-tenant access denied');
    });

    it('should allow super admin access to all tenants', () => {
      const context = MockFactory.createExecutionContext({
        user: { role: 'super_admin' },
        tenantContext: { tenantId: 't2', isActive: true },
      });
      const isExecutionContext = (c: unknown): c is ExecutionContext => true;
      expect(
        guard.canActivate(
          isExecutionContext(context)
            ? context
            : (() => {
              throw new Error('Unreachable');
            })()
        )
      ).toBe(true);
    });
  });
});
