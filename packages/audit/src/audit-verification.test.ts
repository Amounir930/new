import { beforeEach, describe, expect, it, mock } from 'bun:test';

// --- MOCK EVERYTHING ---

// 1. Mock @nestjs/common comprehensively to stop DbModule crashing
mock.module('@nestjs/common', () => ({
  Injectable: () => (target: any) => target,
  Inject: () => (_target: any) => {},
  Global: () => (target: any) => target,
  Module: () => (target: any) => target,
  Controller: () => (target: any) => target,
  Logger: class {
    log() {}
    error() {}
    static log() {}
  },
}));

// 2. Mock DB Connection
const mockClient = {
  query: mock().mockResolvedValue({ rowCount: 1, rows: [] }),
  release: mock(),
};
const mockPool = {
  connect: mock(() => Promise.resolve(mockClient)),
};

mock.module('@apex/db', () => ({
  publicPool: mockPool,
  DbModule: class {}, // Stub DbModule
}));

mock.module('../../../packages/db/src/connection', () => ({
  publicPool: mockPool,
}));

// 3. Mock Middleware
mock.module('@apex/middleware', () => ({
  getCurrentTenantId: () => 'mock-tenant-id',
}));

// 4. Mock Security
mock.module('@apex/security', () => {
  return {
    EncryptionService: class {
      encrypt(val: any) {
        return { encrypted: `ENC_${val}`, iv: 'iv', tag: 'tag' };
      }
      decrypt(val: any) {
        return `DEC_${val}`;
      }
    },
  };
});

// --- IMPORTS AFTER MOCKS ---
import { AuditService } from './audit.service';

describe('Arch-S8 Audit Logging Logic Verification', () => {
  let auditService: AuditService;

  beforeEach(() => {
    mockClient.query.mockClear();
    mockClient.release.mockClear();

    // Create service - it should use the mocked imports
    auditService = new AuditService();
    (auditService as any).logger = { log: mock(), error: mock() };
  });

  it('should encrypt PII and persist to DB', async () => {
    const testEmail = 'spy@example.com';
    const action = 'MOCK_AUDIT_ACTION';

    await auditService.log({
      tenantId: 'mock_tenant',
      action,
      entityType: 'mock_entity',
      entityId: '123',
      userEmail: testEmail,
      metadata: { sensitive: 'yes' },
    });

    // Verification
    expect(mockPool.connect).toHaveBeenCalled();
    expect(mockClient.query).toHaveBeenCalledWith('SET search_path TO public');

    // Find the insert query
    const calls = mockClient.query.mock.calls.map((c) => c[0] as string);
    const insertCallIndex = calls.findIndex((c) =>
      c?.includes('INSERT INTO public.audit_logs')
    );
    expect(insertCallIndex).toBeGreaterThan(-1);

    // Verify Encryption
    const params = mockClient.query.mock.calls[insertCallIndex][1] as any[];
    // [tenantId, userId, userEmail, action, entityType, entityId, metadata, ip, ua, severity, result, createdAt]
    expect(params[2]).toBe(`ENC_${testEmail}`); // Email
    expect(params[6].encrypted).toBeDefined(); // Metadata

    expect(mockClient.release).toHaveBeenCalled();
  });
});
