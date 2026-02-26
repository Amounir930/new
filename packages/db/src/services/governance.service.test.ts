import { describe, expect, it, mock, spyOn } from 'bun:test';

// 1. Mock drizzle-orm Natively in Bun
mock.module('drizzle-orm', () => {
  const sqlMock = (strings: unknown, ...values: unknown[]) => ({
    strings,
    values,
  });
  (sqlMock as { raw: (str: string) => string }).raw = (str: string) => str;
  return {
    sql: sqlMock,
    eq: () => ({}),
    and: () => ({}),
  };
});

// 2. Mock connection
mock.module('../connection.js', () => ({
  publicDb: {},
}));

// 3. Mock RedisService
mock.module('../redis.service.js', () => {
  return {
    RedisService: class {
      subscribe = async () => {};
      publish = async () => 0;
    },
    getGlobalRedis: async () => ({
      getClient: () => ({}),
    }),
  };
});

// 5. Mock schema modules
mock.module('../schema/governance.js', () => ({
  featureGates: {},
  subscriptionPlans: {},
  tenantQuotas: {},
  tenants: {},
}));

mock.module('../schema/index.js', () => ({}));

mock.module('../schema.js', () => ({
  getTenantTableName: (subdomain: string, resource: string) =>
    `tenant_${subdomain}.${resource}`,
}));

import type { EncryptionService } from '@apex/security';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import type { RedisService } from '../redis.service.js';
import type * as schema from '../schema/index.js';
import { GovernanceService } from './governance.service.js';

/**
 * Instantiate GovernanceService directly with mocked dependencies (no null stubs).
 */
function makeGovernanceService(): GovernanceService {
  const mockDb = {
    select: () => ({
      from: () => ({
        where: () => ({
          then: async (cb: (r: unknown[]) => unknown) => cb([]),
        }),
      }),
    }),
    execute: async () => ({ rows: [{ count: 0 }] }),
    insert: () => ({ values: () => ({}) }),
    update: () => ({ set: () => ({ where: () => ({}) }) }),
  } as unknown as NodePgDatabase<typeof schema>;

  const mockRedis = {
    subscribe: async () => {},
    publish: async () => 0,
  } as unknown as RedisService;

  const mockEncryption = {
    decrypt: (v: unknown) => (typeof v === 'string' ? v : JSON.stringify(v)),
    encrypt: (v: string) => v,
  } as unknown as EncryptionService;

  return new GovernanceService(mockDb, mockRedis, mockEncryption);
}

describe('GovernanceService Logic (Bun Native Mock)', () => {
  it('should verify Stage 2 logic: allowed = current < limit', async () => {
    const governanceService = makeGovernanceService();

    // We spy on the internal methods to simulate DB results
    const limitsSpy = spyOn(
      governanceService as unknown as {
        getTenantLimits: (...args: unknown[]) => unknown;
      },
      'getTenantLimits'
    );
    const countSpy = spyOn(
      governanceService as unknown as {
        getResourceCount: (...args: unknown[]) => unknown;
      },
      'getResourceCount'
    );

    // Case 1: Over/At Limit
    limitsSpy.mockResolvedValue({
      maxProducts: 5,
      maxOrders: 10,
      maxPages: 5,
      ownerEmail: 'admin@test.com',
    });
    countSpy.mockResolvedValue(5);
    let result = await governanceService.checkQuota('t1', 'products', 's1');
    expect(result.allowed).toBe(false);

    // Case 2: Under Limit
    countSpy.mockResolvedValue(3);
    result = await governanceService.checkQuota('t1', 'products', 's1');
    expect(result.allowed).toBe(true);

    // Case 3: Banned (Limit 0)
    limitsSpy.mockResolvedValue({
      maxProducts: 0,
      maxOrders: 10,
      maxPages: 5,
      ownerEmail: 'admin@test.com',
    });
    countSpy.mockResolvedValue(0);
    result = await governanceService.checkQuota('t1', 'products', 's1');
    expect(result.allowed).toBe(false);

    console.log('✅ Governance Logic (Stage 2) Verified via Isolated Mocking');
  });
});
