import { describe, expect, it, mock, spyOn } from 'bun:test';

// 1. Mock drizzle-orm Natively in Bun
mock.module('drizzle-orm', () => {
  const sqlMock = (strings: any, ...values: any[]) => ({ strings, values });
  (sqlMock as any).raw = (str: string) => str;
  return {
    sql: sqlMock,
    eq: () => ({}),
    and: () => ({}),
  };
});

// 3. Mock RedisService
mock.module('../redis.service', () => {
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

// 4. Mock @apex/security
mock.module('@apex/security', () => {
  return {
    EncryptionService: class {
      decrypt = (v: any) => v;
    },
  };
});

import { governanceService } from './governance.service.js';

describe('GovernanceService Logic (Bun Native Mock)', () => {
  it('should verify Stage 2 logic: allowed = current < limit', async () => {
    // We spy on the internal methods to simulate DB results
    const limitsSpy = spyOn(governanceService as any, 'getTenantLimits');
    const countSpy = spyOn(governanceService as any, 'getResourceCount');

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
