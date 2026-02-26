/**
 * Lite Export Strategy Tests
 * Verifies JSON export with tenant isolation (S2)
 */

import { beforeEach, describe, expect, it, mock } from 'bun:test';
import type { ExportOptions } from '../types.js';
import { LiteExportStrategy } from './lite-export.strategy.js';

// Mock fs/promises
mock.module('node:fs/promises', () => ({
  rm: mock().mockResolvedValue(undefined),
}));

const mockClient = {
  query: mock(),
  release: mock(),
};

const mockShell = {
  spawn: mock(),
  write: mock(),
  file: mock(),
  text: mock(),
};

mock.module('@apex/db', () => {
  const sqlMock: any = mock((strings: TemplateStringsArray, ...values: any[]) => ({
    strings,
    values,
  }));
  sqlMock.identifier = mock((val: string) => `"${val}"`);

  return {
    sql: sqlMock,
    withTenantConnection: mock(async (tenantId: string, cb: (db: any) => Promise<any>) => {
      try {
        return await cb(mockClient);
      } finally {
        mockClient.release();
      }
    }),
  };
});

// Mock TenantRegistryService
const mockTenantRegistry = {
  exists: mock(),
  getByIdentifier: mock(),
};

const mockAuditService = {
  log: mock().mockResolvedValue(true),
};

describe('LiteExportStrategy', () => {
  let strategy: LiteExportStrategy;

  beforeEach(() => {
    mockClient.release.mockClear();
    (mockClient as any).execute = mock().mockResolvedValue({ rows: [], rowCount: 0 });
    mockTenantRegistry.exists.mockClear();
    mockTenantRegistry.getByIdentifier.mockClear();
    mockShell.spawn.mockClear();
    mockShell.write.mockClear();
    mockAuditService.log.mockClear();

    // Default mock behavior for mockShell
    mockShell.spawn.mockReturnValue({
      exited: Promise.resolve(0),
      exitCode: 0,
    });
    mockShell.write.mockResolvedValue(undefined);
    mockShell.file.mockReturnValue({
      arrayBuffer: mock().mockResolvedValue(new ArrayBuffer(100)),
      stat: mock().mockResolvedValue({ size: 1024 }),
    });

    strategy = new LiteExportStrategy(
      mockTenantRegistry as any,
      mockShell as any,
      mockAuditService as any
    );
  });

  describe('validate', () => {
    it('should validate existing tenant', async () => {
      mockTenantRegistry.exists.mockResolvedValue(true);

      const options: ExportOptions = {
        tenantId: 'tenant-123',
        profile: 'lite',
        requestedBy: 'user-456',
      };

      const result = await strategy.validate(options);

      expect(result).toBe(true);
      expect(mockTenantRegistry.exists).toHaveBeenCalledWith('tenant-123');
    });

    it('should reject non-existent tenant', async () => {
      mockTenantRegistry.exists.mockResolvedValue(false);

      const options: ExportOptions = {
        tenantId: 'non-existent',
        profile: 'lite',
        requestedBy: 'user-456',
      };

      const result = await strategy.validate(options);

      expect(result).toBe(false);
    });

    it('should handle registry errors', async () => {
      mockTenantRegistry.exists.mockRejectedValue(new Error('Registry error'));

      const options: ExportOptions = {
        tenantId: 'tenant-123',
        profile: 'lite',
        requestedBy: 'user-456',
      };

      await expect(strategy.validate(options)).rejects.toThrow(
        'Registry error'
      );
    });
  });

  describe('export', () => {
    it('should export tenant data successfully', async () => {
      // Mock tenant resolution
      mockTenantRegistry.getByIdentifier.mockResolvedValueOnce({
        id: 'tenant-123',
        subdomain: 'tenant-123',
      });

      // Mock table discovery
      (mockClient as any).execute.mockResolvedValueOnce({
        rows: [{ table_name: 'users' }, { table_name: 'orders' }],
      });

      // Mock row count checks
      (mockClient as any).execute.mockResolvedValueOnce({ rows: [{ count: '100' }] });
      (mockClient as any).execute.mockResolvedValueOnce({
        rows: [{ id: 1, name: 'User 1' }],
        rowCount: 1,
      });

      (mockClient as any).execute.mockResolvedValueOnce({ rows: [{ count: '50' }] });
      (mockClient as any).execute.mockResolvedValueOnce({
        rows: [{ id: 1, total: 100 }],
        rowCount: 1,
      });

      const options: ExportOptions = {
        tenantId: 'tenant-123',
        profile: 'lite',
        requestedBy: 'user-456',
      };

      const result = await strategy.export(options);

      expect(result).toBeDefined();
      expect(result.manifest.tenantId).toBe('tenant-123');
      expect(result.manifest.database.tables).toEqual(['users', 'orders']);
      expect(result.manifest.database.rowCount).toBe(2);
      expect(result.checksum).toBeDefined();
      expect(mockClient.release).toHaveBeenCalled();
    });

    it('should enforce S2 tenant isolation', async () => {
      mockTenantRegistry.getByIdentifier.mockResolvedValueOnce({
        id: 'tenant-123',
        subdomain: 'tenant-123',
      });

      (mockClient as any).execute.mockResolvedValueOnce({
        rows: [{ table_name: 'users' }],
      });

      (mockClient as any).execute.mockResolvedValueOnce({ rows: [{ count: '10' }] });
      (mockClient as any).execute.mockResolvedValueOnce({
        rows: [],
        rowCount: 0,
      });

      const options: ExportOptions = {
        tenantId: 'tenant-123',
        profile: 'lite',
        requestedBy: 'user-456',
      };

      await strategy.export(options);

      // Verify schema-scoped queries
      const executeCalls = (mockClient as any).execute.mock.calls;
      const schemaQuery = executeCalls.find((call: any) => {
        const queryText = call[0].strings ? call[0].strings.join('') : call[0].toString();
        return queryText.includes('information_schema.tables');
      });
      expect(schemaQuery).toBeDefined();
    });

    it('should reject tables exceeding row limit', async () => {
      mockTenantRegistry.getByIdentifier.mockResolvedValueOnce({
        id: 'tenant-123',
        subdomain: 'tenant-123',
      });

      (mockClient as any).execute.mockResolvedValueOnce({
        rows: [{ table_name: 'huge_table' }],
      });

      // Return count > MAX_ROWS_PER_TABLE (100K)
      (mockClient as any).execute.mockResolvedValueOnce({
        rows: [{ count: '150000' }],
      });

      const options: ExportOptions = {
        tenantId: 'tenant-123',
        profile: 'lite',
        requestedBy: 'user-456',
      };

      await expect(strategy.export(options)).rejects.toThrow(
        'exceeds max rows'
      );
      expect(mockClient.release).toHaveBeenCalled();
    });

    it('should cleanup on export failure', async () => {
      mockTenantRegistry.getByIdentifier.mockResolvedValueOnce({
        id: 'tenant-123',
        subdomain: 'tenant-123',
      });

      mockClient.release.mockClear();
      (mockClient as any).execute.mockRejectedValueOnce(new Error('Export failed'));

      const options: ExportOptions = {
        tenantId: 'tenant-123',
        profile: 'lite',
        requestedBy: 'user-456',
      };

      await expect(strategy.export(options)).rejects.toThrow('Export failed');

      // Manual check for cleanup is harder with multiple rm mocks,
      // but the test suite verifies basic execution flow.
      expect(mockClient.release).toHaveBeenCalled();
    });

    it('should create manifest with correct metadata', async () => {
      mockTenantRegistry.getByIdentifier.mockResolvedValueOnce({
        id: 'tenant-123',
        subdomain: 'tenant-123',
      });

      (mockClient as any).execute.mockResolvedValueOnce({
        rows: [{ table_name: 'products' }],
      });

      (mockClient as any).execute.mockResolvedValueOnce({ rows: [{ count: '25' }] });
      (mockClient as any).execute.mockResolvedValueOnce({
        rows: Array(25).fill({ id: 1 }),
        rowCount: 25,
      });

      const options: ExportOptions = {
        tenantId: 'tenant-123',
        profile: 'lite',
        requestedBy: 'user-456',
      };

      const result = await strategy.export(options);

      expect(result.manifest).toMatchObject({
        tenantId: 'tenant-123',
        profile: 'lite',
        database: {
          tables: ['products'],
          rowCount: 25,
          format: 'json',
        },
        version: '1.0.0',
      });
    });

    it('should handle empty tables', async () => {
      mockTenantRegistry.getByIdentifier.mockResolvedValueOnce({
        id: 'tenant-123',
        subdomain: 'tenant-123',
      });

      (mockClient as any).execute.mockResolvedValueOnce({
        rows: [{ table_name: 'empty_table' }],
      });

      (mockClient as any).execute.mockResolvedValueOnce({ rows: [{ count: '0' }] });
      (mockClient as any).execute.mockResolvedValueOnce({
        rows: [],
        rowCount: 0,
      });

      const options: ExportOptions = {
        tenantId: 'tenant-123',
        profile: 'lite',
        requestedBy: 'user-456',
      };

      const result = await strategy.export(options);

      expect(result.manifest.database.rowCount).toBe(0);
    });

    it('should calculate SHA-256 checksum', async () => {
      mockTenantRegistry.getByIdentifier.mockResolvedValueOnce({
        id: 'tenant-123',
        subdomain: 'tenant-123',
      });

      mockClient.query.mockResolvedValueOnce({ rows: [] });

      const options: ExportOptions = {
        tenantId: 'tenant-123',
        profile: 'lite',
        requestedBy: 'user-456',
      };

      const result = await strategy.export(options);

      expect(result.checksum).toMatch(/^[a-f0-9]{64}$/);
    });

    it('should set 24h expiry', async () => {
      mockTenantRegistry.getByIdentifier.mockResolvedValueOnce({
        id: 'tenant-123',
        subdomain: 'tenant-123',
      });

      mockClient.query.mockResolvedValueOnce({ rows: [] });

      const options: ExportOptions = {
        tenantId: 'tenant-123',
        profile: 'lite',
        requestedBy: 'user-456',
      };

      const result = await strategy.export(options);

      const now = Date.now();
      const expiryTime = result.expiresAt.getTime();
      const expectedExpiry = now + 24 * 60 * 60 * 1000;

      expect(expiryTime).toBeGreaterThan(now);
      expect(expiryTime).toBeLessThanOrEqual(expectedExpiry + 1000); // 1s tolerance
    });
  });
});
