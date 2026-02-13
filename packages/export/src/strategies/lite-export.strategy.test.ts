/**
 * Lite Export Strategy Tests
 * Verifies JSON export with tenant isolation (S2)
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ExportOptions } from '../types.js';
import { LiteExportStrategy } from './lite-export.strategy.js';

// 🛡️ Stabilization: Standard mock definitions for compatibility
const mockClient = {
  query: vi.fn(),
  release: vi.fn(),
};

const mockShell = {
  spawn: vi.fn(),
  write: vi.fn(),
  file: vi.fn(),
  text: vi.fn(),
};

vi.mock('@apex/db', () => ({
  publicPool: {
    connect: vi.fn().mockResolvedValue(mockClient),
  },
}));

// Mock Bun (handled in vitest.setup.ts or via vi.stubGlobal if needed)

// Mock TenantRegistryService
const mockTenantRegistry = {
  exists: vi.fn(),
  getByIdentifier: vi.fn(),
};

describe('LiteExportStrategy', () => {
  let strategy: LiteExportStrategy;

  beforeEach(() => {
    vi.clearAllMocks();

    // Default mock behavior for mockShell
    mockShell.spawn.mockReturnValue({
      exited: Promise.resolve(0),
      exitCode: 0,
    });
    mockShell.write.mockResolvedValue(undefined);
    mockShell.file.mockReturnValue({
      arrayBuffer: vi.fn().mockResolvedValue(new ArrayBuffer(100)),
      stat: vi.fn().mockResolvedValue({ size: 1024 }),
    });

    strategy = new LiteExportStrategy(
      mockTenantRegistry as any,
      mockShell as any
    );
  });

  afterEach(() => {
    vi.clearAllMocks();
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
      mockClient.query.mockResolvedValueOnce({
        rows: [{ table_name: 'users' }, { table_name: 'orders' }],
      });

      // Mock row count checks
      mockClient.query.mockResolvedValueOnce({ rows: [{ count: '100' }] });
      mockClient.query.mockResolvedValueOnce({
        rows: [{ id: 1, name: 'User 1' }],
        rowCount: 1,
      });

      mockClient.query.mockResolvedValueOnce({ rows: [{ count: '50' }] });
      mockClient.query.mockResolvedValueOnce({
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

      mockClient.query.mockResolvedValueOnce({
        rows: [{ table_name: 'users' }],
      });

      mockClient.query.mockResolvedValueOnce({ rows: [{ count: '10' }] });
      mockClient.query.mockResolvedValueOnce({
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
      const queryCalls = mockClient.query.mock.calls;
      const schemaQuery = queryCalls.find((call) =>
        call[0].includes('table_schema = $1')
      );
      expect(schemaQuery).toBeDefined();
      expect(schemaQuery?.[1]).toEqual(['tenant_tenant_123']);
    });

    it('should reject tables exceeding row limit', async () => {
      mockTenantRegistry.getByIdentifier.mockResolvedValueOnce({
        id: 'tenant-123',
        subdomain: 'tenant-123',
      });

      mockClient.query.mockResolvedValueOnce({
        rows: [{ table_name: 'huge_table' }],
      });

      // Return count > MAX_ROWS_PER_TABLE (100K)
      mockClient.query.mockResolvedValueOnce({
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

      mockClient.query.mockRejectedValue(new Error('Export failed'));

      const options: ExportOptions = {
        tenantId: 'tenant-123',
        profile: 'lite',
        requestedBy: 'user-456',
      };

      await expect(strategy.export(options)).rejects.toThrow('Export failed');

      // Verify cleanup was called
      expect(mockShell.spawn).toHaveBeenCalledWith(
        expect.arrayContaining(['rm', '-rf'])
      );
      expect(mockClient.release).toHaveBeenCalled();
    });

    it('should create manifest with correct metadata', async () => {
      mockTenantRegistry.getByIdentifier.mockResolvedValueOnce({
        id: 'tenant-123',
        subdomain: 'tenant-123',
      });

      mockClient.query.mockResolvedValueOnce({
        rows: [{ table_name: 'products' }],
      });

      mockClient.query.mockResolvedValueOnce({ rows: [{ count: '25' }] });
      mockClient.query.mockResolvedValueOnce({
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

      mockClient.query.mockResolvedValueOnce({
        rows: [{ table_name: 'empty_table' }],
      });

      mockClient.query.mockResolvedValueOnce({ rows: [{ count: '0' }] });
      mockClient.query.mockResolvedValueOnce({
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

    it('should cleanup work directory after success', async () => {
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

      await strategy.export(options);

      // Verify work directory cleanup (but not tar.gz)
      const spawnCalls = mockShell.spawn.mock.calls;
      const cleanupCall = spawnCalls.find(
        (call) =>
          Array.isArray(call[0]) &&
          call[0].includes('rm') &&
          call[0].includes('-rf') &&
          !call[0].some((arg: any) => arg.includes('.tar.gz'))
      );
      expect(cleanupCall).toBeDefined();
    });
  });
});
