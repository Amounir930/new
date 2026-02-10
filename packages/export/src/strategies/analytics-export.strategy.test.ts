/**
 * Analytics Export Strategy Tests
 * Verifies CSV export with date range filtering
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ExportOptions } from '../types.js';
import { AnalyticsExportStrategy } from './analytics-export.strategy.js';

// 🛡️ Stabilization: Use 'mock' prefix so Vitest hoists these variables
const mockClient = {
  query: vi.fn(),
  release: vi.fn(),
};

const mockShell = {
  spawn: vi.fn(),
  write: vi.fn(),
  file: vi.fn(() => ({
    arrayBuffer: vi.fn().mockResolvedValue(new ArrayBuffer(100)),
    stat: vi.fn().mockResolvedValue({ size: 512 }),
  })),
};

vi.mock('@apex/db', () => ({
  publicPool: {
    connect: vi.fn().mockResolvedValue(mockClient),
  },
}));

// Mock Bun (handled in vitest.setup.ts or via vi.stubGlobal if needed)

describe('AnalyticsExportStrategy', () => {
  let strategy: AnalyticsExportStrategy;

  beforeEach(() => {
    vi.clearAllMocks();
    mockClient.query.mockReset();
    mockClient.release.mockReset();

    // Default mock behavior for mockShell
    mockShell.spawn.mockReturnValue({
      exited: Promise.resolve(0),
      exitCode: 0,
    });
    mockShell.write.mockResolvedValue(undefined);
    // mockShell.file is already initialized with default mock behavior

    strategy = new AnalyticsExportStrategy(mockShell as any);
  });

  describe('validate', () => {
    it('should validate existing tenant', async () => {
      mockClient.query.mockResolvedValue({ rowCount: 1 });

      const options: ExportOptions = {
        tenantId: 'tenant-123',
        profile: 'analytics',
        requestedBy: 'user-456',
        dateRange: {
          from: new Date('2026-01-01'),
          to: new Date('2026-01-31'),
        },
      };

      const result = await strategy.validate(options);
      expect(result).toBe(true);
    });

    it('should require date range for analytics', async () => {
      mockClient.query.mockResolvedValue({ rowCount: 1 });

      const options: ExportOptions = {
        tenantId: 'tenant-123',
        profile: 'analytics',
        requestedBy: 'user-456',
        // Missing dateRange
      };

      const result = await strategy.validate(options);
      expect(result).toBe(false);
    });

    it('should accept valid date range', async () => {
      mockClient.query.mockResolvedValue({ rowCount: 1 });

      const options: ExportOptions = {
        tenantId: 'tenant-123',
        profile: 'analytics',
        requestedBy: 'user-456',
        dateRange: {
          from: new Date('2026-01-01'),
          to: new Date('2026-01-31'),
        },
      };

      const result = await strategy.validate(options);
      expect(result).toBe(true);
    });
  });

  describe('export', () => {
    it('should export analytics tables as CSV', async () => {
      mockClient.query
        .mockResolvedValueOnce({
          rows: [{ id: 1, total: 150, created_at: new Date() }],
          rowCount: 1, // Orders query result
        })
        .mockResolvedValueOnce({
          rows: [
            { id: 1, name: 'Product 1', price: 100 },
            { id: 2, name: 'Product 2', price: 200 },
          ],
          rowCount: 2, // Products query result
        });

      const options: ExportOptions = {
        tenantId: 'tenant-123',
        profile: 'analytics',
        requestedBy: 'user-456',
        dateRange: {
          from: new Date('2026-01-01'),
          to: new Date('2026-01-31'),
        },
      };

      const result = await strategy.export(options);

      expect(result).toBeDefined();
      expect(result.manifest.profile).toBe('analytics');
      expect(result.manifest.database.format).toBe('csv');
      expect(result.manifest.database.tables).toEqual([
        'orders_summary',
        'products_performance',
      ]);
    });

    it('should apply date range filter to orders', async () => {
      mockClient.query
        .mockResolvedValueOnce({ rows: [], rowCount: 0 })
        .mockResolvedValueOnce({ rows: [], rowCount: 0 })
        .mockResolvedValueOnce({ rows: [], rowCount: 0 });

      const options: ExportOptions = {
        tenantId: 'tenant-123',
        profile: 'analytics',
        requestedBy: 'user-456',
        dateRange: {
          from: new Date('2026-01-01'),
          to: new Date('2026-01-31'),
        },
      };

      await strategy.export(options);

      // Verify orders query includes date filter
      const queryCalls = mockClient.query.mock.calls;
      const ordersQuery = queryCalls.find(
        (call) => call[0].includes('orders') && call[0].includes('created_at')
      );
      expect(ordersQuery).toBeDefined();
      expect(ordersQuery?.[0]).toContain('created_at BETWEEN $1 AND $2');
    });

    it('should enforce S2 tenant isolation', async () => {
      mockClient.query
        .mockResolvedValueOnce({ rows: [], rowCount: 0 })
        .mockResolvedValueOnce({ rows: [], rowCount: 0 })
        .mockResolvedValueOnce({ rows: [], rowCount: 0 });

      const options: ExportOptions = {
        tenantId: 'tenant-456',
        profile: 'analytics',
        requestedBy: 'user-789',
        dateRange: {
          from: new Date('2026-01-01'),
          to: new Date('2026-01-31'),
        },
      };

      await strategy.export(options);

      // Verify all queries use tenant schema
      const queryCalls = mockClient.query.mock.calls;
      for (const call of queryCalls) {
        if (call[0].includes('SELECT')) {
          expect(call[0]).toContain('tenant_tenant-456');
        }
      }
    });

    it('should convert rows to CSV format', async () => {
      mockClient.query
        .mockResolvedValueOnce({
          rows: [], // Orders query
          rowCount: 0,
        })
        .mockResolvedValueOnce({
          rows: [
            {
              name: 'Item 1',
              sku: 'SKU1',
              times_ordered: 10,
              total_quantity: 100,
            },
          ],
          rowCount: 1, // Products query
        });

      const options: ExportOptions = {
        tenantId: 'tenant-123',
        profile: 'analytics',
        requestedBy: 'user-456',
        dateRange: {
          from: new Date('2026-01-01'),
          to: new Date('2026-01-31'),
        },
      };

      await strategy.export(options);

      // Verify CSV write
      const writeCalls = mockShell.write.mock.calls;
      const csvWrite = writeCalls.find((call) =>
        call[0].toString().includes('products_performance.csv')
      );
      expect(csvWrite).toBeDefined();
      expect(csvWrite?.[1]).toContain('name,sku,times_ordered,total_quantity');
      expect(csvWrite?.[1]).toContain('Item 1,SKU1,10,100');
    });

    it('should handle empty result sets', async () => {
      mockClient.query
        .mockResolvedValueOnce({ rows: [], rowCount: 0 })
        .mockResolvedValueOnce({ rows: [], rowCount: 0 })
        .mockResolvedValueOnce({ rows: [], rowCount: 0 });

      const options: ExportOptions = {
        tenantId: 'tenant-123',
        profile: 'analytics',
        requestedBy: 'user-456',
        dateRange: {
          from: new Date('2026-01-01'),
          to: new Date('2026-01-31'),
        },
      };

      const result = await strategy.export(options);

      expect(result.manifest.database.rowCount).toBe(0);
    });

    it('should create manifest with date range metadata', async () => {
      mockClient.query
        .mockResolvedValueOnce({ rows: [], rowCount: 0 })
        .mockResolvedValueOnce({ rows: [], rowCount: 0 })
        .mockResolvedValueOnce({ rows: [], rowCount: 0 });

      const dateRange = {
        from: new Date('2026-01-01'),
        to: new Date('2026-01-31'),
      };

      const options: ExportOptions = {
        tenantId: 'tenant-123',
        profile: 'analytics',
        requestedBy: 'user-456',
        dateRange,
      };

      const result = await strategy.export(options);

      expect(result.manifest).toMatchObject({
        tenantId: 'tenant-123',
        profile: 'analytics',
        database: {
          format: 'csv',
          tables: ['orders_summary', 'products_performance'],
        },
      });
    });

    it('should calculate checksum', async () => {
      mockClient.query
        .mockResolvedValueOnce({ rows: [], rowCount: 0 })
        .mockResolvedValueOnce({ rows: [], rowCount: 0 })
        .mockResolvedValueOnce({ rows: [], rowCount: 0 });

      const options: ExportOptions = {
        tenantId: 'tenant-123',
        profile: 'analytics',
        requestedBy: 'user-456',
        dateRange: {
          from: new Date('2026-01-01'),
          to: new Date('2026-01-31'),
        },
      };

      const result = await strategy.export(options);

      expect(result.checksum).toMatch(/^[a-f0-9]{64}$/);
    });

    it('should cleanup on error', async () => {
      mockClient.query.mockRejectedValue(new Error('Query failed'));

      const options: ExportOptions = {
        tenantId: 'tenant-123',
        profile: 'analytics',
        requestedBy: 'user-456',
        dateRange: {
          from: new Date('2026-01-01'),
          to: new Date('2026-01-31'),
        },
      };

      await expect(strategy.export(options)).rejects.toThrow('Query failed');

      // Verify cleanup
      const spawnCalls = mockShell.spawn.mock.calls;
      const cleanupCall = spawnCalls.find(
        (call) => Array.isArray(call[0]) && call[0].includes('rm')
      );
      expect(cleanupCall).toBeDefined();
      expect(mockClient.release).toHaveBeenCalled();
    });

    it('should set 24h expiry', async () => {
      mockClient.query
        .mockResolvedValueOnce({ rows: [], rowCount: 0 })
        .mockResolvedValueOnce({ rows: [], rowCount: 0 })
        .mockResolvedValueOnce({ rows: [], rowCount: 0 });

      const options: ExportOptions = {
        tenantId: 'tenant-123',
        profile: 'analytics',
        requestedBy: 'user-456',
        dateRange: {
          from: new Date('2026-01-01'),
          to: new Date('2026-01-31'),
        },
      };

      const result = await strategy.export(options);

      const now = Date.now();
      const expiryTime = result.expiresAt.getTime();
      const expectedExpiry = now + 24 * 60 * 60 * 1000;

      expect(expiryTime).toBeGreaterThan(now);
      expect(expiryTime).toBeLessThanOrEqual(expectedExpiry + 1000);
    });
  });
});
