/**
 * Audit Service Tests
 * S4 Protocol: Immutable Audit Logs
 * S2: Public Schema Isolation
 */

import { beforeEach, describe, expect, it, mock } from 'bun:test';
import { runWithTenantContext } from '@apex/middleware';
import {
  type AuditLogEntry,
  AuditService,
  initializeAuditTable,
  logProvisioning,
  logSecurityEvent,
  query,
} from './audit.service.js';

// Mocks will be injected directly into the service instance to avoid global leakage.
const mockClient = {
  query: mock().mockResolvedValue({ rows: [] }),
  release: mock(),
};

const mockPool = {
  connect: mock().mockResolvedValue(mockClient),
  query: mockClient.query,
};

mock.module('@apex/db', () => ({
  publicPool: mockPool,
}));

describe('AuditService & Helpers', () => {
  let service: AuditService;
  const mockEncryption = {
    encrypt: mock().mockReturnValue({ encrypted: 'encrypted-data' }),
    decrypt: mock().mockReturnValue('decrypted-data'),
    validateMasterKey: mock(),
  };

  beforeEach(() => {
    mockClient.query.mockClear();
    mockClient.release.mockClear();
    // Inject mock pool and encryption directly
    service = new AuditService(mockPool, mockEncryption as any);
  });

  describe('AuditService.log', () => {
    it('should log an entry to the database with S2 search_path protection', async () => {
      const entry: AuditLogEntry = {
        action: 'TEST_ACTION',
        entityType: 'test',
        entityId: 'id-123',
        userId: 'user-1',
        metadata: { key: 'value' },
      };

      await runWithTenantContext(
        { tenantId: 'mock-tenant' } as any,
        async () => {
          await service.log(entry);
        }
      );

      // Verify persistence
      expect(mockClient.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO public.audit_logs'),
        expect.arrayContaining([
          'mock-tenant',
          'user-1',
          'TEST_ACTION',
          'id-123',
        ])
      );

      // Verify release
      expect(mockClient.release).toHaveBeenCalled();
    });

    it('should handle missing tenantId by falling back to context', async () => {
      await runWithTenantContext(
        { tenantId: 'fallback-tenant' } as any,
        async () => {
          await service.log({
            action: 'SYS_EVENT',
            entityType: 'system',
            entityId: 'sys-1',
          });
        }
      );
      expect(mockClient.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO public.audit_logs'),
        expect.arrayContaining(['fallback-tenant'])
      );
    });

    it('should throw "Audit Persistence Failure" if query fails', async () => {
      mockClient.query.mockRejectedValueOnce(new Error('DB Crash'));

      let error: any;
      try {
        await service.log({ action: 'A', entityType: 'B', entityId: 'C' });
      } catch (e) {
        error = e;
      }
      expect(error).toBeDefined();
      expect(error.message).toBe('Audit Persistence Failure');
    });
  });

  describe('Standalone Helpers', () => {
    it('logProvisioning should log tenant provisioned event', async () => {
      process.env.ENCRYPTION_MASTER_KEY = 'ValidTestKey32CharsWith1$!Abc1234';
      await logProvisioning('test-store', 'pro', 'u1', '1.1.1.1', true);
      expect(mockClient.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO public.audit_logs'),
        expect.arrayContaining(['TENANT_PROVISIONED'])
      );
    });

    it('logSecurityEvent should log critical failure', async () => {
      process.env.ENCRYPTION_MASTER_KEY = 'ValidTestKey32CharsWith1$!Abc1234';
      await logSecurityEvent('SQLI_ATTEMPT', 'actor', 'target', '2.2.2.2');
      expect(mockClient.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO public.audit_logs'),
        expect.arrayContaining(['SQLI_ATTEMPT'])
      );
    });

    it('query should execute select with filters', async () => {
      await query({ tenantId: 't1', action: 'LOGIN' });
      expect(mockClient.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM public.audit_logs'),
        expect.arrayContaining(['t1', 'LOGIN'])
      );
    });

    it('initializeAuditTable should run S4 initialization', async () => {
      await initializeAuditTable();
      expect(mockClient.query).toHaveBeenCalledWith(
        expect.stringContaining('CREATE TABLE IF NOT EXISTS')
      );
    });
  });
});
