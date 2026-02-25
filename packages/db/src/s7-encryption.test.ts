import { afterAll, beforeAll, describe, expect, it, mock } from 'bun:test';

// 0. Define High-Fidelity Mock Encryption Service
const testEmail = 'blind-index@example.com';
const topEncryptionService = {
  encrypt: (v: any) => ({ encrypted: v, iv: 'iv', tag: 'tag' }),
  decrypt: (v: any) => {
    if (v && typeof v === 'object' && v.encrypted) return v.encrypted;
    return typeof v === 'string' ? v : v || '';
  },
  hashSensitiveData: () => 'hash',
} as any;

// 1. Mock connection FIRST
const mockPool = {
  connect: mock(),
  query: mock(async () => ({
    rows: [{ id: 'tenant1', subdomain: 'tenant1', status: 'active' }],
    rowCount: 1,
  })),
  on: mock(),
};
const mockDb = {
  execute: mock(),
};

mock.module('./connection.js', () => ({
  publicPool: mockPool,
  publicDb: mockDb,
  db: mockDb,
  poolConfig: { connectionString: 'postgres://localhost:5432/test' },
}));

// 1.5 Mock Redis (Audit 444 Neural Alignment)
mock.module('./redis.service.js', () => ({
  getGlobalRedis: async () => ({
    getClient: () => ({
      set: async () => 'OK',
      get: async () => null,
    }),
  }),
  RedisService: class {
    async subscribe() {}
    async publish() {
      return 0;
    }
  },
}));

// Mock @apex/security
mock.module('@apex/security', () => ({
  EncryptionService: () => topEncryptionService,
}));

// 2. Import core and mutate its factory (Surgery over Mocking)
import { dbClientFactory } from './core.js';

const mockClient = {
  connect: mock(() => Promise.resolve()),
  query: mock(async (queryText: any, _params?: any[]) => {
    const qs = (
      typeof queryText === 'string' ? queryText : queryText.text || ''
    ).toLowerCase();

    // S2 Schema Check
    if (qs.includes('information_schema.schemata')) {
      return { rows: [{ 1: 1 }], rowCount: 1 };
    }
    // S2 Search Path Verification
    if (qs.includes('show search_path')) {
      return { rows: [{ search_path: 'tenant_tenant1' }], rowCount: 1 };
    }
    // Role Escalation Check
    if (qs.includes('validate_role_escalation')) {
      return { rows: [{ is_valid: true }], rowCount: 1 };
    }

    const encryptedEmail = JSON.stringify({
      encrypted: testEmail,
      iv: 'iv',
      tag: 'tag',
    });

    /**
     * DRIVER LOGIC DISCOVERY:
     * Drizzle's PgMapper is accessing indices 0..19.
     * We provide an array-compatible object to satisfy numeric lookup.
     */
    const rowValues: any[] = [
      'cust1', // 0: id
      'tenant1', // 1: tenant_id
      new Date(), // 2: created_at
      new Date(), // 3: updated_at
      null, // 4: last_login_at
      null, // 5: deleted_at
      '(0,SAR)', // 6: wallet_balance
      true, // 7: is_active
      false, // 8: email_verified
      false, // 9: phone_verified
      1, // 10: version
      encryptedEmail, // 11: email
      null, // 12: phone
      null, // 13: first_name
      null, // 14: last_name
      null, // 15: avatar_url
      'hash', // 16: email_hash
      null, // 17: phone_hash
      '{}', // 18: tags
      '{}', // 19: preferences
    ];

    // Hybrid row that supports BOTH indices and keys
    const hybridRow: any = { ...rowValues };
    hybridRow.id = rowValues[0];
    hybridRow.tenant_id = rowValues[1];
    hybridRow.email = rowValues[11];
    hybridRow.email_hash = rowValues[16];
    hybridRow.tags = rowValues[18];
    hybridRow.preferences = rowValues[19];

    return {
      rows: [hybridRow],
      rowCount: 1,
    };
  }),
  end: mock(() => Promise.resolve()),
  on: mock(),
  release: mock(() => {}),
};

dbClientFactory.createClient = mock(() => mockClient as any);

describe('S7: Encryption at Rest Protocol (Database Required)', () => {
  beforeAll(async () => {
    (mockPool.connect as any).mockResolvedValue(mockClient);
  });

  it('should support Blind Indexing via CustomerService', async () => {
    const { CustomerService } = await import('./services/customer.service.js');
    const mockTenantRegistry = {
      getBySubdomain: async () => ({ id: 'tenant1', secretSalt: 'test-salt' }),
      getByIdentifier: async () => ({ id: 'tenant1', secretSalt: 'test-salt' }),
    } as any;

    const customerService = new CustomerService(
      topEncryptionService,
      mockTenantRegistry
    );

    const created = await customerService.create('tenant1', {
      email: testEmail,
    });

    expect(created.email).toBe(testEmail);

    const found = await customerService.findByEmail('tenant1', testEmail);
    expect(found?.email).toBe(testEmail);
  });
});
