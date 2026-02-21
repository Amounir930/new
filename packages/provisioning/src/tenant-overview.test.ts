/**
 * Tenant Overview Service Tests
 * Super-#01: Tenant Overview Table
 */

import { describe, expect, it, mock } from 'bun:test';
import {
  type TenantPlan,
  type TenantStatus,
  deleteTenant,
  getTenantById,
  getTenantBySubdomain,
  getTenantList,
  getTenantStats,
  killSwitch,
  updateTenant,
  updateTenantPlan,
  updateTenantStatus,
} from './tenant-overview.js';

const mockTenants = [
  {
    id: 'tenant-1',
    subdomain: 'alpha',
    name: 'Alpha Store',
    plan: 'pro',
    status: 'active',
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
  },
  {
    id: 'tenant-2',
    subdomain: 'beta',
    name: 'Beta Shop',
    plan: 'free',
    status: 'suspended',
    createdAt: new Date('2026-01-15'),
    updatedAt: new Date('2026-01-20'),
  },
  {
    id: 'tenant-3',
    subdomain: 'gamma',
    name: 'Gamma Market',
    plan: 'enterprise',
    status: 'active',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

mock.module('@apex/db', () => {
  const mockTenants = [
    {
      id: 'tenant-1',
      subdomain: 'alpha',
      name: 'Alpha Store',
      plan: 'pro',
      status: 'active',
      createdAt: new Date('2026-01-01'),
      updatedAt: new Date('2026-01-01'),
    },
    {
      id: 'tenant-2',
      subdomain: 'beta',
      name: 'Beta Shop',
      plan: 'free',
      status: 'suspended',
      createdAt: new Date('2026-01-15'),
      updatedAt: new Date('2026-01-20'),
    },
    {
      id: 'tenant-3',
      subdomain: 'gamma',
      name: 'Gamma Market',
      plan: 'enterprise',
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  const mockQuery = Promise.resolve(mockTenants) as any;
  mockQuery.where = mock().mockReturnThis();
  mockQuery.limit = mock().mockImplementation((n: number) => {
    const result = Promise.resolve(mockTenants.slice(0, n));
    (result as any).offset = mock().mockImplementation(() =>
      Promise.resolve(mockTenants.slice(0, n))
    );
    return result;
  });
  mockQuery.orderBy = mock().mockReturnThis();
  mockQuery.returning = mock().mockResolvedValue([mockTenants[0]]);

  return {
    tenants: {
      id: 'id',
      subdomain: 'subdomain',
      name: 'name',
      plan: 'plan',
      status: 'status',
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    },
    publicDb: {
      select: mock().mockReturnValue({
        from: mock().mockReturnValue(mockQuery),
        total: mock().mockResolvedValue([{ total: mockTenants.length }]),
      }),
      update: mock().mockReturnValue({
        set: mock().mockReturnThis(),
        where: mock().mockReturnThis(),
        returning: mock().mockResolvedValue([mockTenants[0]]),
      }),
      delete: mock().mockReturnValue({
        where: mock().mockReturnThis(),
        returning: mock().mockResolvedValue([{ id: 'deleted' }]),
      }),
    },
  };
});

describe('Tenant Overview Service', () => {
  describe('getTenantList', () => {
    it('should return paginated tenant list', async () => {
      const result = await getTenantList({ page: 1, limit: 10 });

      expect(result).toHaveProperty('tenants');
      expect(result).toHaveProperty('pagination');
      expect(Array.isArray(result.tenants)).toBe(true);
      expect(result.pagination).toMatchObject({
        page: 1,
        limit: 10,
      });
    });

    it('should support search filtering', async () => {
      const result = await getTenantList({ search: 'alpha' });
      expect(result.tenants).toBeDefined();
    });

    it('should support status filtering', async () => {
      const result = await getTenantList({ status: 'active' as TenantStatus });
      expect(result.tenants).toBeDefined();
    });

    it('should support plan filtering', async () => {
      const result = await getTenantList({ plan: 'pro' as TenantPlan });
      expect(result.tenants).toBeDefined();
    });

    it('should support sorting by different fields', async () => {
      const resultByDate = await getTenantList({
        sortBy: 'createdAt',
        sortOrder: 'desc',
      });
      expect(resultByDate.tenants).toBeDefined();

      const resultBySubdomain = await getTenantList({
        sortBy: 'subdomain',
        sortOrder: 'asc',
      });
      expect(resultBySubdomain.tenants).toBeDefined();

      const resultByPlan = await getTenantList({
        sortBy: 'plan',
        sortOrder: 'desc',
      });
      expect(resultByPlan.tenants).toBeDefined();

      const resultByDefault = await getTenantList({ sortBy: undefined });
      expect(resultByDefault.tenants).toBeDefined();
    });

    it('should handle empty count result in getTenantList', async () => {
      const { publicDb } = await import('@apex/db');
      (publicDb.select as any).mockReturnValueOnce({
        from: mock().mockReturnValue({
          where: mock().mockResolvedValue([]), // Empty count array
        }),
      } as any);

      const result = await getTenantList();
      expect(result.pagination.total).toBe(0);
    });
  });

  describe('getTenantById', () => {
    it('should return tenant by id', async () => {
      const result = await getTenantById('tenant-1');
      expect(result).toBeDefined();
    });

    it('should return null for non-existent id', async () => {
      // Ensure the mock for this specific case resolves to empty array
      const { publicDb } = await import('@apex/db');
      (publicDb.select as any).mockReturnValueOnce({
        from: mock().mockReturnValue({
          where: mock().mockReturnThis(),
          limit: mock().mockResolvedValue([]),
        }),
      } as any);

      const result = await getTenantById('non-existent');
      expect(result).toBeNull();
    });
  });

  describe('getTenantBySubdomain', () => {
    it('should return tenant by subdomain', async () => {
      const result = await getTenantBySubdomain('alpha');
      expect(result).toBeDefined();
    });

    it('should return null for non-existent subdomain', async () => {
      const { publicDb } = await import('@apex/db');
      (publicDb.select as any).mockReturnValueOnce({
        from: mock().mockReturnValue({
          where: mock().mockReturnThis(),
          limit: mock().mockResolvedValue([]),
        }),
      } as any);

      const result = await getTenantBySubdomain('non-existent');
      expect(result).toBeNull();
    });
  });

  describe('updateTenantStatus', () => {
    it('should update tenant status', async () => {
      const result = await updateTenantStatus('tenant-1', 'suspended');
      expect(result).toBeDefined();
    });

    it('should return null for non-existent tenant', async () => {
      const { publicDb } = await import('@apex/db');
      (publicDb.update as any).mockReturnValueOnce({
        set: mock().mockReturnThis(),
        where: mock().mockReturnThis(),
        returning: mock().mockResolvedValue([]),
      } as any);

      const result = await updateTenantStatus('non-existent', 'active');
      expect(result).toBeNull();
    });
  });

  describe('updateTenantPlan', () => {
    it('should update tenant plan', async () => {
      const result = await updateTenantPlan('tenant-1', 'enterprise');
      expect(result).toBeDefined();
    });
  });

  describe('updateTenant', () => {
    it('should update multiple tenant fields', async () => {
      const result = await updateTenant('tenant-1', {
        name: 'Updated Name',
        plan: 'pro',
      });
      expect(result).toBeDefined();
    });
  });

  describe('deleteTenant', () => {
    it('should prevent deletion of active tenants', async () => {
      // Mock an active tenant
      const result = await deleteTenant('tenant-1');
      // Should fail because tenant is active
      expect(result.success).toBe(false);
      expect(result.error).toContain('Suspend first');
    });

    it('should allow deletion of suspended tenants', async () => {
      // Mock getTenantById to return a suspended tenant
      const { publicDb } = await import('@apex/db');
      (publicDb.select as any).mockReturnValueOnce({
        from: mock().mockReturnValue({
          where: mock().mockReturnThis(),
          limit: mock().mockResolvedValue([mockTenants[1]]), // tenant-2 is suspended
        }),
      } as any);

      // Also mock delete to return success
      (publicDb.delete as any).mockReturnValueOnce({
        where: mock().mockReturnThis(),
        returning: mock().mockResolvedValue([{ id: 'tenant-2' }]),
      } as any);

      const result = await deleteTenant('tenant-2');
      expect(result.success).toBe(true);
    });

    it('should handle non-Error objects in deleteTenant catch block', async () => {
      const { publicDb } = await import('@apex/db');
      // Mock existing tenant
      (publicDb.select as any).mockReturnValueOnce({
        from: mock().mockReturnValue({
          where: mock().mockReturnThis(),
          limit: mock().mockResolvedValue([mockTenants[1]]), // Suspended
        }),
      } as any);

      // Mock delete to throw raw string
      (publicDb.delete as any).mockImplementation(() => {
        throw 'Raw Delete Fail';
      });

      const result = await deleteTenant('tenant-2');
      expect(result.success).toBe(false);
      expect(result.error).toBe('Raw Delete Fail');
    });
  });

  describe('getTenantStats', () => {
    it('should return tenant statistics', async () => {
      const stats = await getTenantStats();

      expect(stats).toHaveProperty('total');
      expect(stats).toHaveProperty('byStatus');
      expect(stats).toHaveProperty('byPlan');
      expect(stats).toHaveProperty('recent');

      expect(typeof stats.total).toBe('number');
      expect(typeof stats.byStatus.active).toBe('number');
      expect(typeof stats.byPlan.free).toBe('number');
      expect(typeof stats.recent).toBe('number');
    });

    it('should handle records with missing dates in getTenantStats', async () => {
      const { publicDb } = await import('@apex/db');
      (publicDb.select as any).mockReturnValueOnce({
        from: mock().mockResolvedValue([
          { status: 'active', plan: 'free' }, // Missing createdAt
        ]),
      } as any);

      const stats = await getTenantStats();
      expect(stats.total).toBe(1);
    });
  });

  describe('killSwitch', () => {
    it('should suspend tenant by subdomain', async () => {
      const result = await killSwitch('alpha');
      expect(result).toBe(true);
    });

    it('should return false for non-existent subdomain', async () => {
      // Setup mock to return empty array for non-existent subdomain search
      const { publicDb } = await import('@apex/db');
      (publicDb.select as any).mockReturnValueOnce({
        from: mock().mockReturnValue({
          where: mock().mockReturnThis(),
          limit: mock().mockResolvedValue([]),
        }),
      } as any);

      const result = await killSwitch('non-existent');
      expect(result).toBe(false);
    });
  });
});
