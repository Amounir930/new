/**
 * Audit Service Tests
 * S4 Protocol: Immutable Audit Logs
 * S2: Public Schema Isolation
 */

import { beforeEach, describe, expect, it, mock } from 'bun:test';
import { runWithTenantContext } from '@apex/middleware';
import type { EncryptionService } from '@apex/security';
import { type Mocked, MockFactory } from '@apex/test-utils';
import type { Pool, PoolClient } from 'pg';
import {
  type AuditLogEntry,
  AuditService,
  logProvisioning,
  logSecurityEvent,
  query,
} from './audit.service';

// Mocks will be injected directly into the service instance to avoid global leakage.
const mockClient = {
  query: mock().mockResolvedValue({ rows: [] }),
  release: mock(),
} as Mocked<PoolClient>;

const mockPool = {
  connect: mock().mockResolvedValue(mockClient),
  query: mockClient.query,
} as Mocked<Pool>;

mock.module('@apex/db', () => ({
  adminPool: mockPool,
}));

describe('AuditService & Helpers', () => {
  let service: AuditService;
  let mockEncryption: Mocked<EncryptionService>;

  beforeEach(() => {
    mockClient.query.mockClear();
    mockClient.release.mockClear();

    mockEncryption = {
      encrypt: mock().mockReturnValue({
        encrypted: 'encrypted-data',
        iv: 'iv',
        tag: 'tag',
        salt: 'salt',
      }),
      decrypt: mock().mockReturnValue('decrypted-data'),
    } as Mocked<EncryptionService>;

    service = new AuditService(mockPool, mockEncryption);
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
        MockFactory.createTenantContext({ tenantId: 'mock-tenant' }),
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
        MockFactory.createTenantContext({ tenantId: 'fallback-tenant' }),
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
      (mockClient.query as ReturnType<typeof mock>).mockRejectedValueOnce(
        new Error('DB Crash')
      );

      let error: Error | undefined;
      try {
        await service.log({ action: 'A', entityType: 'B', entityId: 'C' });
      } catch (e) {
        error = e as Error;
      }
      expect(error).toBeDefined();
      expect(error?.message).toBe('Audit Persistence Failure');
    });
  });

  describe('Standalone Helpers', () => {
    it('logProvisioning should log tenant provisioned event', async () => {
      process.env['ENCRYPTION_MASTER_KEY'] = 'T3st_Mock_K3y_32_Ch@rs_L0ng_1234'; // gitleaks:allow
      await logProvisioning('test-store', 'pro', 'u1', '1.1.1.1', true);
      expect(mockClient.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO public.audit_logs'),
        expect.arrayContaining(['TENANT_PROVISIONED'])
      );
    });

    it('logSecurityEvent should log critical failure', async () => {
      process.env['ENCRYPTION_MASTER_KEY'] = 'T3st_Mock_K3y_32_Ch@rs_L0ng_1234'; // gitleaks:allow
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
  });
});
