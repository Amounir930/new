/**
 * Migration Runner Tests
 * S2 Protocol: Tenant Migrations
 */

import { beforeEach, describe, expect, it, mock } from 'bun:test';
import { runTenantMigrations } from './runner';

// Mock DB
const mockDb = {
  query: mock().mockResolvedValue({ rows: [], rowCount: 0 }),
  release: mock(),
};

mock.module('@apex/db', () => ({
  adminPool: {
    connect: mock().mockResolvedValue(mockDb),
  },
  createTenantDb: mock().mockReturnValue(mockDb),
}));

mock.module('drizzle-orm/postgres-js/migrator', () => ({
  migrate: mock().mockResolvedValue(undefined),
}));

mock.module('node:fs/promises', () => ({
  readFile: mock().mockResolvedValue('SELECT 1;'),
}));

mock.module('node:fs', () => ({
  default: {
    readFileSync: mock().mockReturnValue('SELECT 1;'),
    readdirSync: mock().mockReturnValue(['0000_nervous_landau.sql']),
    existsSync: mock().mockReturnValue(true),
  },
  readFileSync: mock().mockReturnValue('SELECT 1;'),
  readdirSync: mock().mockReturnValue(['0000_nervous_landau.sql']),
  existsSync: mock().mockReturnValue(true),
  promises: {
    readFile: mock().mockResolvedValue('SELECT 1;'),
  },
}));

// We will use explicit mocks if needed, but avoiding global module mocking for node:fs
// as it breaks other tests that rely on real file system operations.

describe('runTenantMigrations', () => {
  beforeEach(() => {
    mock.restore();
  });

  it('should execute migrations for the given tenant', async () => {
    const subdomain = 'alpha';
    const result = await runTenantMigrations(subdomain);

    expect(result.schemaName).toBe(`tenant_${subdomain}`);
    expect(result.appliedCount).toBeGreaterThan(0);
    // The Drizzle migrate function is skipped in favor of the manual client.query raw sql fallback
  });

  it('should throw and log if migration fails', async () => {
    mockDb.query.mockRejectedValueOnce(new Error('Migration Crash'));
    await expect(runTenantMigrations('fail')).rejects.toThrow(
      'Migration Crash'
    );
  });
});
