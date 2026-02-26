import { beforeAll, describe, expect, it, mock } from 'bun:test';

// 0. Define High-Fidelity Mock Encryption Service
const testEmail = 'blind-index@example.com';
const topEncryptionService = {
  encrypt: (v: any) => ({ encrypted: v, iv: 'iv', tag: 'tag' }),
  decrypt: (v: any) => {
    if (v && typeof v === 'object' && v.encrypted) return v.encrypted;
    return typeof v === 'string' ? v : v || '';
  },
  hashSensitiveData: (data: string, salt: string) => `hash-${data}-${salt}`,
} as any;

import { spyOn } from 'bun:test';
import { publicPool } from './connection.js';

// 1.5 Mock Redis & Security
mock.module('./redis.service.js', () => ({
  getGlobalRedis: async () => ({
    getClient: () => ({ exists: async () => 0, set: async () => 'OK' }),
  }),
}));

// 2. Import the real logic we want to test
mock.module('drizzle-orm/node-postgres', () => ({
  drizzle: mock().mockImplementation(() => ({
    insert: mock().mockImplementation(() => ({
      values: mock().mockImplementation(() => ({
        returning: mock().mockImplementation(() => {
          // HYBRID ROW DISCOVERY:
          // Drizzle's PgMapper accesses indices 0..19.
          const rowValues: any[] = [
            'cust1', // 0
            'tenant1', // 1
            new Date(), // 2
            new Date(), // 3
            null, // 4
            null, // 5
            0, // 6
            true, // 7
            false, // 8
            false, // 9
            1, // 10
            JSON.stringify(topEncryptionService.encrypt(testEmail)), // 11
            null, // 12
            null, // 13
            null, // 14
            null, // 15
            'hash', // 16
            null, // 17
            [], // 18: tags
            {}, // 19: preferences
          ];
          const hybridRow: any = { ...rowValues };
          hybridRow.email = rowValues[11];
          return [hybridRow];
        }),
      })),
    })),
    select: mock().mockImplementation(() => ({
      from: mock().mockImplementation(() => ({
        where: mock().mockImplementation(() => ({
          limit: mock().mockResolvedValue([]),
        })),
      })),
    })),
  })),
}));

import { withTenantConnection } from './core.js';

const mockClient = {
  query: mock(async (queryText: any) => {
    const qs = (
      typeof queryText === 'string' ? queryText : queryText.text || ''
    ).toLowerCase();

    // S2/System Queries
    if (
      qs.includes('from tenants') ||
      qs.includes('information_schema.schemata') ||
      qs.includes('show search_path')
    ) {
      return {
        rows: [
          {
            id: 'tenant1',
            subdomain: 'tenant1',
            status: 'active',
            search_path: 'tenant_tenant1',
          },
        ],
        rowCount: 1,
      };
    }

    // Customer Operations
    if (qs.includes('insert into') || qs.includes('from customers')) {
      /**
       * HYBRID ROW DISCOVERY:
       * Drizzle's PgMapper accesses indices 0..19.
       * 0: id, 1: tenant_id, 2: created_at, 3: updated_at, 4: last_login_at, 5: deleted_at
       * 6: wallet_balance, 7: is_active, 8: email_verified, 9: phone_verified, 10: version
       * 11: email, 12: phone, 13: first_name, 14: last_name, 15: avatar_url
       * 16: email_hash, 17: phone_hash, 18: tags, 19: preferences
       */
      const rowValues: any[] = [
        'cust1', // 0
        'tenant1', // 1
        new Date(), // 2
        new Date(), // 3
        null, // 4
        null, // 5
        0, // 6
        true, // 7
        false, // 8
        false, // 9
        1, // 10
        JSON.stringify(topEncryptionService.encrypt(testEmail)), // 11
        null, // 12
        null, // 13
        null, // 14
        null, // 15
        'hash', // 16
        null, // 17
        [], // 18: tags (Critical Array)
        {}, // 19: preferences
      ];

      const hybridRow: any = { ...rowValues };
      // Map keys as well for compatibility
      hybridRow.id = rowValues[0];
      hybridRow.tenant_id = rowValues[1];
      hybridRow.created_at = rowValues[2];
      hybridRow.updated_at = rowValues[3];
      hybridRow.wallet_balance = rowValues[6];
      hybridRow.is_active = rowValues[7];
      hybridRow.version = rowValues[10];
      hybridRow.email = rowValues[11];
      hybridRow.email_hash = rowValues[16];
      hybridRow.tags = rowValues[18];
      hybridRow.preferences = rowValues[19];

      return {
        rows: [hybridRow],
        rowCount: 1,
      };
    }

    return { rows: [], rowCount: 0 };
  }),
  release: mock(),
};

describe('S7: Encryption at Rest Protocol (Database Required)', () => {
  beforeAll(() => {
    spyOn(publicPool, 'connect').mockResolvedValue(mockClient as any);
    spyOn(publicPool, 'query').mockImplementation(mockClient.query as any);
  });

  it('should support Blind Indexing via CustomerService', async () => {
    const { CustomerService } = await import('./services/customer.service.js');
    const mockTenantRegistry = {
      getByIdentifier: async () => ({ id: 'tenant1', secretSalt: 'test-salt' }),
    } as any;

    const customerService = new CustomerService(
      topEncryptionService,
      mockTenantRegistry
    );

    // This calls withTenantConnection internally.
    const created = await customerService.create('tenant1', {
      email: testEmail,
    });

    expect(created.email).toBe(testEmail); // Decrypted value
    expect(mockClient.query).toHaveBeenCalledWith(
      expect.stringMatching(/BEGIN/i)
    );
    expect(mockClient.query).toHaveBeenCalledWith(
      expect.stringMatching(/SET LOCAL search_path TO "tenant_tenant1"/i)
    );
  });
});
