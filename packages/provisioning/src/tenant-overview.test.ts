/**
 * Tenant Overview Service Tests
 * Super-#01: Tenant Overview Table
 */

import { beforeEach, describe, expect, it, mock } from 'bun:test';
import {
  deleteTenant,
  getTenantById,
  getTenantBySubdomain,
  getTenantList,
  getTenantStats,
  killSwitch,
  updateTenant,
  updateTenantPlan,
  updateTenantStatus,
} from './tenant-overview';

interface Tenant {
  id: string;
  subdomain: string;
  name: string;
  plan: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

const mockTenants: Tenant[] = [
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

import { type DrizzleMock, type Mocked, MockFactory } from '@apex/test-utils';

mock.module('@apex/db', () => {
  const drizzleMock = MockFactory.createDrizzleMock(mockTenants);
  return {
    tenantsInGovernance: {
      id: 'id',
      subdomain: 'subdomain',
      name: 'name',
      plan: 'plan',
      status: 'status',
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    },
    adminDb: drizzleMock,
    adminPool: {
      connect: mock().mockResolvedValue({
        query: mock().mockResolvedValue({ rows: [] }),
        release: mock(),
      }),
    },
    sql: mock().mockImplementation(
      (_strings: TemplateStringsArray, ..._values: unknown[]) => ({
        mapWith: mock().mockReturnThis(),
      })
    ),
    and: mock().mockImplementation((...args: unknown[]) => args),
    eq: mock().mockImplementation((_a: unknown, _b: unknown) => ({})),
    asc: mock().mockImplementation((_a: unknown) => ({})),
    desc: mock().mockImplementation((_a: unknown) => ({})),
    count: mock().mockReturnValue({}),
  };
});

// Mock sql.raw
const sqlMock = { raw: mock() };
sqlMock.raw.mockImplementation((s: string) => s);

describe('Tenant Overview Service', () => {
  beforeEach(async () => {
    const { adminDb } = (await import('@apex/db')) as {
      adminDb: Mocked<DrizzleMock>;
    };
    // Setup fresh builders for each call to ensure isolation
    adminDb.select.mockImplementation(() =>
      MockFactory.createQueryBuilder(mockTenants)
    );
    adminDb.update.mockImplementation(() =>
      MockFactory.createQueryBuilder(mockTenants)
    );
    adminDb.delete.mockImplementation(() =>
      MockFactory.createQueryBuilder(mockTenants)
    );
  });

  describe('getTenantList', () => {
    it('should return paginated tenant list', async () => {
      const { adminDb } = (await import('@apex/db')) as {
        adminDb: Mocked<DrizzleMock>;
      };
      const countBuilder = MockFactory.createQueryBuilder([
        { total: mockTenants.length },
      ]);
      const selectBuilder = MockFactory.createQueryBuilder(mockTenants);
      adminDb.select
        .mockReturnValueOnce(countBuilder)
        .mockReturnValueOnce(selectBuilder);

      const result = await getTenantList({ page: 1, limit: 10 });
      expect(result.pagination.total).toBe(mockTenants.length);
      expect(result.tenants).toHaveLength(mockTenants.length);
    });

    it('should support search filtering', async () => {
      const { adminDb } = (await import('@apex/db')) as {
        adminDb: Mocked<DrizzleMock>;
      };
      const countBuilder = MockFactory.createQueryBuilder([{ total: 1 }]);
      const selectBuilder = MockFactory.createQueryBuilder([mockTenants[0]]);
      adminDb.select
        .mockReturnValueOnce(countBuilder)
        .mockReturnValueOnce(selectBuilder);

      const result = await getTenantList({ search: 'alpha' });
      expect(result.tenants).toHaveLength(1);
      expect(result.tenants[0].name).toBe('Alpha Store');
    });

    it('should support status filtering', async () => {
      const { adminDb } = (await import('@apex/db')) as {
        adminDb: Mocked<DrizzleMock>;
      };
      const countBuilder = MockFactory.createQueryBuilder([{ total: 1 }]);
      const selectBuilder = MockFactory.createQueryBuilder([mockTenants[1]]);
      adminDb.select
        .mockReturnValueOnce(countBuilder)
        .mockReturnValueOnce(selectBuilder);

      const result = await getTenantList({ status: 'suspended' });
      expect(result.tenants).toHaveLength(1);
      expect(result.tenants[0].status).toBe('suspended');
    });

    it('should support plan filtering', async () => {
      const { adminDb } = (await import('@apex/db')) as {
        adminDb: Mocked<DrizzleMock>;
      };
      const countBuilder = MockFactory.createQueryBuilder([{ total: 1 }]);
      const selectBuilder = MockFactory.createQueryBuilder([mockTenants[0]]);
      adminDb.select
        .mockReturnValueOnce(countBuilder)
        .mockReturnValueOnce(selectBuilder);

      const result = await getTenantList({ plan: 'pro' });
      expect(result.tenants).toHaveLength(1);
      expect(result.tenants[0].plan).toBe('pro');
    });

    it('should support sorting by different fields', async () => {
      const { adminDb } = (await import('@apex/db')) as {
        adminDb: Mocked<DrizzleMock>;
      };
      const countBuilder = MockFactory.createQueryBuilder([
        { total: mockTenants.length },
      ]);
      const selectBuilder = MockFactory.createQueryBuilder(mockTenants);
      adminDb.select
        .mockReturnValueOnce(countBuilder)
        .mockReturnValueOnce(selectBuilder);

      const result = await getTenantList({ sortBy: 'name', sortOrder: 'asc' });
      expect(result.tenants).toHaveLength(mockTenants.length);
    });

    it('should handle empty count result in getTenantList', async () => {
      const { adminDb } = (await import('@apex/db')) as {
        adminDb: Mocked<DrizzleMock>;
      };
      const countBuilder = MockFactory.createQueryBuilder([]);
      const selectBuilder = MockFactory.createQueryBuilder([]);
      adminDb.select
        .mockReturnValueOnce(countBuilder)
        .mockReturnValueOnce(selectBuilder);

      const result = await getTenantList();
      expect(result.pagination.total).toBe(0);
    });
  });

  describe('getTenantById', () => {
    it('should return tenant by id', async () => {
      const { adminDb } = (await import('@apex/db')) as {
        adminDb: Mocked<DrizzleMock>;
      };
      const builder = MockFactory.createQueryBuilder([mockTenants[0]]);
      adminDb.select.mockReturnValue(builder);

      const result = await getTenantById('tenant-1');
      expect(result).toBeDefined();
      expect(result?.id).toBe('tenant-1');
    });

    it('should return null for non-existent id', async () => {
      const { adminDb } = (await import('@apex/db')) as {
        adminDb: Mocked<DrizzleMock>;
      };
      const builder = MockFactory.createQueryBuilder([]);
      adminDb.select.mockReturnValue(builder);

      const result = await getTenantById('non-existent');
      expect(result).toBeNull();
    });
  });

  describe('getTenantBySubdomain', () => {
    it('should return tenant by subdomain', async () => {
      const { adminDb } = (await import('@apex/db')) as {
        adminDb: Mocked<DrizzleMock>;
      };
      const builder = MockFactory.createQueryBuilder([mockTenants[0]]);
      adminDb.select.mockReturnValue(builder);

      const result = await getTenantBySubdomain('alpha');
      expect(result).toBeDefined();
      expect(result?.subdomain).toBe('alpha');
    });

    it('should return null for non-existent subdomain', async () => {
      const { adminDb } = (await import('@apex/db')) as {
        adminDb: Mocked<DrizzleMock>;
      };
      const builder = MockFactory.createQueryBuilder([]);
      adminDb.select.mockReturnValue(builder);

      const result = await getTenantBySubdomain('non-existent');
      expect(result).toBeNull();
    });
  });

  describe('updateTenantStatus', () => {
    it('should update tenant status', async () => {
      const { adminDb } = (await import('@apex/db')) as {
        adminDb: Mocked<DrizzleMock>;
      };
      const builder = MockFactory.createQueryBuilder([
        { ...mockTenants[0], status: 'suspended' },
      ]);
      adminDb.update.mockReturnValue(builder);

      const result = await updateTenantStatus('tenant-1', 'suspended');
      expect(result?.status).toBe('suspended');
    });

    it('should return null for non-existent tenant', async () => {
      const { adminDb } = (await import('@apex/db')) as {
        adminDb: Mocked<DrizzleMock>;
      };
      const builder = MockFactory.createQueryBuilder([]);
      adminDb.update.mockReturnValue(builder);

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
      const { adminDb } = (await import('@apex/db')) as {
        adminDb: Mocked<DrizzleMock>;
      };

      const selectBuilder = MockFactory.createQueryBuilder([mockTenants[1]]);
      adminDb.select.mockReturnValue(selectBuilder);

      const deleteBuilder = MockFactory.createQueryBuilder([
        { id: 'tenant-2' },
      ]);
      adminDb.delete.mockReturnValue(deleteBuilder);

      const result = await deleteTenant('tenant-2');
      expect(result.success).toBe(true);
    });

    it('should handle non-Error objects in deleteTenant catch block', async () => {
      const { adminDb } = (await import('@apex/db')) as {
        adminDb: Mocked<DrizzleMock>;
      };

      const selectBuilder = MockFactory.createQueryBuilder([mockTenants[1]]);
      adminDb.select.mockReturnValue(selectBuilder);

      const deleteBuilder = MockFactory.createQueryBuilder([]);
      deleteBuilder.where.mockImplementation(() => {
        throw 'Raw Delete Fail';
      });
      adminDb.delete.mockReturnValue(deleteBuilder);

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
      const { adminDb } = (await import('@apex/db')) as {
        adminDb: Mocked<DrizzleMock>;
      };
      const builder = MockFactory.createQueryBuilder([
        // @ts-expect-error - testing legacy data without createdAt
        { status: 'active', plan: 'free' } as Tenant,
      ]);
      adminDb.select.mockReturnValue(builder);

      const stats = await getTenantStats();
      expect(stats.total).toBe(1);
    });
  });

  describe('killSwitch', () => {
    it('should suspend tenant by subdomain', async () => {
      const { adminDb } = (await import('@apex/db')) as {
        adminDb: Mocked<DrizzleMock>;
      };
      const selectBuilder = MockFactory.createQueryBuilder([mockTenants[0]]);
      const updateBuilder = MockFactory.createQueryBuilder([
        { ...mockTenants[0], status: 'suspended' },
      ]);

      adminDb.select.mockReturnValue(selectBuilder);
      adminDb.update.mockReturnValue(updateBuilder);

      const result = await killSwitch('alpha');
      expect(result).toBe(true);
    });

    it('should return false for non-existent subdomain', async () => {
      const { adminDb } = (await import('@apex/db')) as {
        adminDb: Mocked<DrizzleMock>;
      };
      const selectBuilder = MockFactory.createQueryBuilder([]);
      adminDb.select.mockReturnValue(selectBuilder);

      const result = await killSwitch('non-existent');
      expect(result).toBe(false);
    });
  });
});
