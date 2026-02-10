/**
 * Audit Service Tests
 * S4 Protocol: Immutable Audit Logs
 * S2: Public Schema Isolation
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  type AuditLogEntry,
  AuditService,
  initializeAuditTable,
  logProvisioning,
  logSecurityEvent,
  query,
} from './audit.service.js';

const { mockClient } = vi.hoisted(() => ({
  mockClient: {
    query: vi.fn().mockResolvedValue({ rows: [] }),
    release: vi.fn(),
  },
}));

vi.mock('@apex/db', () => ({
  publicPool: {
    connect: vi.fn().mockResolvedValue(mockClient),
  },
}));

// Mock Middleware to avoid circular dependency or context issues
vi.mock('@apex/middleware', () => ({
  getCurrentTenantId: vi.fn().mockReturnValue('mock-tenant'),
}));

describe('AuditService & Helpers', () => {
  let service: AuditService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new AuditService();
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

      await service.log(entry);

      // Verify S2 protection
      expect(mockClient.query).toHaveBeenCalledWith(
        'SET search_path TO public'
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
      await service.log({
        action: 'SYS_EVENT',
        entityType: 'system',
        entityId: 'sys-1',
      });
      expect(mockClient.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO public.audit_logs'),
        expect.arrayContaining(['mock-tenant'])
      );
    });

    it('should throw "Audit Persistence Failure" if query fails', async () => {
      mockClient.query.mockRejectedValueOnce(new Error('DB Crash'));

      await expect(
        service.log({ action: 'A', entityType: 'B', entityId: 'C' })
      ).rejects.toThrow('Audit Persistence Failure');
    });
  });

  describe('Standalone Helpers', () => {
    it('logProvisioning should log tenant provisioned event', async () => {
      await logProvisioning('test-store', 'pro', 'u1', '1.1.1.1', true);
      expect(mockClient.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO public.audit_logs'),
        expect.arrayContaining(['TENANT_PROVISIONED'])
      );
    });

    it('logSecurityEvent should log critical failure', async () => {
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
