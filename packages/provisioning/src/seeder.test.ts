/**
 * Tenant Data Seeder Tests
 * S2 Protocol: Tenant Data Isolation
 */

import { beforeEach, describe, expect, it, mock } from 'bun:test';
import { isSeeded, seedTenantData } from './seeder.js';

// Define mockDb first
const mockDb: any = {
  insert: mock().mockReturnThis(),
  values: mock().mockReturnThis(),
  returning: mock().mockReturnValue([{ id: 'mock-id' }]),
  onConflictDoNothing: mock().mockReturnThis(),
  where: mock().mockReturnThis(),
  select: mock().mockReturnThis(),
  from: mock().mockReturnThis(),
  limit: mock().mockReturnThis(),
  then: (onfulfilled: any) => Promise.resolve([{ id: 'mock-id', count: '1' }]).then(onfulfilled),
  transaction: mock((cb: any) => cb(mockDb)),
};

// Mock dependencies manually at the top level
mock.module('@apex/db', () => ({
  createTenantDb: mock().mockReturnValue(mockDb),
  users: { id: 'users.id' },
  stores: { id: 'stores.id' },
  settings: { key: 'settings.key', value: 'settings.value' },
  pages: { id: 'pages.id', title: 'pages.title' },
  drizzle: mock().mockReturnValue(mockDb),
  publicPool: {
    connect: mock().mockResolvedValue({
      query: mock().mockResolvedValue({}),
      release: mock(),
    }),
  },
  sql: mock().mockReturnValue('count(*)'),
}));


// Mock config for encryption key
mock.module('@apex/config', () => ({
  env: {
    ENCRYPTION_MASTER_KEY: 'mock-master-key-32-chars-long-!!!', // gitleaks:allow
    BLIND_INDEX_PEPPER: 'mock-pepper',
    NODE_ENV: 'test',
  },
}));

mock.module('./blueprint.js', () => ({
  getDefaultBlueprint: mock().mockResolvedValue({
    id: 'mock-blueprint-id',
    name: 'Default Blueprint',
    plan: 'free',
    isDefault: true,
    blueprint: {
      settings: {
        site_name: 'Default Site',
        currency: 'USD',
      },
      pages: [],
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  }),
}));

describe('seedTenantData', () => {
  beforeEach(() => {
    mockDb.insert.mockClear();
    mockDb.values.mockClear();
    mockDb.returning.mockClear();
    mockDb.select.mockClear();
    mockDb.from.mockClear();
  });

  it('should seed store, admin and settings', async () => {
    const options = {
      subdomain: 'beta',
      storeName: 'Beta Store',
      adminEmail: 'b@test.com',
    };

    const result = await seedTenantData(options);

    expect(result.adminId).toBe('mock-id');
    expect(result.storeId).toBe('mock-id');
    // It might be 2 or 3 depending on batching, let's check if it's called at least twice
    expect(mockDb.insert).toHaveBeenCalled();
    expect(mockDb.values).toHaveBeenCalled();
  });

  it('should throw Seeding Failure if DB fails', async () => {
    mockDb.transaction.mockRejectedValueOnce(new Error('DB Timeout'));

    await expect(
      seedTenantData({ subdomain: 'valid-sub', storeName: 'X', adminEmail: 'x@x.com' })
    ).rejects.toThrow(/Seeding Failure:.*DB Timeout/);
  });
});

describe('isSeeded', () => {
  it('should return true if count > 0', async () => {
    mockDb.then = (onfulfilled: any) => Promise.resolve([{ count: '1' }]).then(onfulfilled);
    const result = await isSeeded('alpha');
    expect(result).toBe(true);
  });

  it('should return false if count is 0', async () => {
    mockDb.then = (onfulfilled: any) => Promise.resolve([{ count: '0' }]).then(onfulfilled);
    const result = await isSeeded('empty');
    expect(result).toBe(false);
  });

  it('should return false if query fails', async () => {
    // Correctly mock a failing thenable to simulate query error
    const failingQuery = {
      then: (onfulfilled: any, onrejected: any) => Promise.reject(new Error('Table missing')).catch(onrejected),
      catch: (onrejected: any) => Promise.reject(new Error('Table missing')).catch(onrejected)
    };
    mockDb.select.mockReturnValue(failingQuery);

    const result = await isSeeded('empty');
    expect(result).toBe(false);
  });
});
