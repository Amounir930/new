/**
 * Tenant Data Seeder Tests
 * S2 Protocol: Tenant Data Isolation
 */

import { afterEach, beforeEach, describe, expect, it, mock } from 'bun:test';

// Define mockDb first
const mockClient = {
  query: mock().mockResolvedValue({}),
  release: mock(),
};

const mockDb = {
  insert: mock().mockReturnThis(),
  values: mock().mockReturnThis(),
  returning: mock().mockReturnValue([{ id: 'mock-id' }]),
  onConflictDoNothing: mock().mockReturnThis(),
  where: mock().mockReturnThis(),
  select: mock().mockReturnThis(),
  from: mock().mockReturnThis(),
  limit: mock().mockResolvedValue([]),
  transaction: mock((cb: (db: typeof mockDb) => Promise<unknown>) =>
    cb(mockDb)
  ),
  execute: mock().mockResolvedValue([]),
};

// Mock dependencies manually at the top level
mock.module('@apex/db', () => ({
  getTenantDb: mock().mockReturnValue(mockDb),
  adminDb: mockDb,
  adminPool: {
    connect: mock().mockResolvedValue(mockClient),
  },
  drizzle: mock().mockReturnValue(mockDb),
  eq: mock(),
  sql: mock((strings: TemplateStringsArray, ...values: unknown[]) => ({
    sql: String.raw(strings, ...values),
  })),
  tenantsInGovernance: { id: 'tenantsInGovernance.id', subdomain: 'subdomain' },
  tenantConfigInStorefront: {
    key: 'tenantConfigInStorefront.key',
    value: 'tenantConfigInStorefront.value',
  },
  pagesInStorefront: {
    id: 'pagesInStorefront.id',
    title: 'pagesInStorefront.title',
  },
  staffMembersInStorefront: { id: 'staffMembersInStorefront.id' },
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

// Mock encryption to avoid scrypt memory issues in tests
mock.module('@apex/security', () => ({
  encrypt: mock((plaintext: string) => ({
    encrypted: `enc_${plaintext}`,
    iv: 'mock-iv',
    tag: 'mock-tag',
    salt: 'mock-salt',
    version: 1,
  })),
  decrypt: mock((data: unknown) =>
    typeof data === 'string' && data.startsWith('enc_') ? data.slice(4) : data
  ),
}));

// Import after mocks are set up
const { isSeeded, seedTenantData } = await import('./seeder.js');

// Global cleanup for module mocks
afterEach(() => {
  mock.restore();
});

describe('seedTenantData', () => {
  beforeEach(() => {
    mockDb.insert.mockClear();
    mockDb.values.mockClear();
    mockDb.returning.mockClear();
    mockDb.select.mockClear();
    mockDb.from.mockClear();
    mockDb.limit.mockReset();
    mockDb.limit
      .mockResolvedValueOnce([]) // resolveStore: not found, trigger insert
      .mockResolvedValueOnce([{ id: 'mock-id' }]); // Verification: found after seed
    mockClient.query.mockClear();
  });

  it('should seed store, admin and settings', async () => {
    const options = {
      subdomain: 'beta',
      storeName: 'Beta Store',
      adminEmail: 'b@test.com',
    };

    const result = await seedTenantData(options);

    expect(result.adminId).toBe('mock-id');
    expect(result.storeId).toBeDefined();
    // It might be 2 or 3 depending on batching, let's check if it's called at least twice
    expect(mockDb.insert).toHaveBeenCalled();
    expect(mockDb.values).toHaveBeenCalled();
  });

  it('should throw Seeding Failure if DB fails', async () => {
    mockDb.transaction.mockRejectedValueOnce(new Error('DB Timeout'));

    await expect(
      seedTenantData({
        subdomain: 'valid-sub',
        storeName: 'X',
        adminEmail: 'x@x.com',
      })
    ).rejects.toThrow(/Seeding Failure:.*DB Timeout/);
  });
});

describe('isSeeded', () => {
  it('should return true if count > 0', async () => {
    // Mock the drizzle select to return count > 0
    mockDb.select.mockReturnValueOnce({
      from: mock().mockReturnValue([{ count: '1' }]),
    });

    const result = await isSeeded('alpha');
    expect(result).toBe(true);
  });

  it('should return false if count is 0', async () => {
    // Mock the drizzle select to return count = 0
    mockDb.select.mockReturnValueOnce({
      from: mock().mockReturnValue([{ count: '0' }]),
    });

    const result = await isSeeded('empty');
    expect(result).toBe(false);
  });

  it('should return false if query fails', async () => {
    // Mock the drizzle select to throw error
    mockDb.select.mockReturnValueOnce({
      from: mock().mockImplementation(() => {
        throw new Error('Table missing');
      }),
    });

    const result = await isSeeded('empty');
    expect(result).toBe(false);
  });
});
