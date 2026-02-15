/**
 * Analytics Export Strategy Tests
 * Verifies CSV export with date range filtering
 */

import { beforeEach, describe, expect, it, mock } from 'bun:test';
import type { ExportOptions } from '../types.js';
import { AnalyticsExportStrategy } from './analytics-export.strategy.js';

// Define mocks
const mockClient = {
  query: mock(),
  release: mock(),
};

const mockShell = {
  spawn: mock(),
  write: mock(),
  file: mock(),
};

mock.module('@apex/db', () => ({
  publicPool: {
    connect: mock().mockResolvedValue(mockClient),
  },
}));

describe('AnalyticsExportStrategy', () => {
  let strategy: AnalyticsExportStrategy;

  beforeEach(() => {
    mockClient.query.mockClear();
    mockClient.release.mockClear();
    mockShell.spawn.mockClear();
    mockShell.write.mockClear();

    // Default mock behavior for mockShell
    mockShell.spawn.mockReturnValue({
      exited: Promise.resolve(0),
      exitCode: 0,
    });
    mockShell.write.mockResolvedValue(undefined);
    mockShell.file.mockReturnValue({
      arrayBuffer: mock().mockResolvedValue(new ArrayBuffer(100)),
      stat: mock().mockResolvedValue({ size: 512 }),
    });

    strategy = new AnalyticsExportStrategy(mockShell as any);
  });

  describe('validate', () => {
    it('should validate existing tenant', async () => {
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
      const options: ExportOptions = {
        tenantId: 'tenant-123',
        profile: 'analytics',
        requestedBy: 'user-456',
        // Missing dateRange
      };

      const result = await strategy.validate(options);
      expect(result).toBe(false);
    });
  });

  describe('export', () => {
    const defaultOptions: ExportOptions = {
      tenantId: 'tenant-123',
      profile: 'analytics',
      requestedBy: 'user-456',
      dateRange: {
        from: new Date('2026-01-01'),
        to: new Date('2026-01-31'),
      },
    };

    it('should export analytics tables as CSV', async () => {
      mockClient.query.mockImplementation((query: string) => {
        if (query.includes('orders')) {
          return Promise.resolve({
            rows: [{ date: '2026-01-01', order_count: 1, total_revenue: 150, avg_order_value: 150 }],
            rowCount: 1,
          });
        }
        if (query.includes('products')) {
          return Promise.resolve({
            rows: [
              { name: 'Product 1', sku: 'SKU1', times_ordered: 10, total_quantity: 100 },
            ],
            rowCount: 1,
          });
        }
        return Promise.resolve({ rows: [], rowCount: 0 });
      });

      const result = await strategy.export(defaultOptions);

      expect(result).toBeDefined();
      expect(result.manifest.profile).toBe('analytics');
      expect(result.manifest.database.format).toBe('csv');
      expect(result.manifest.database.tables).toEqual([
        'orders_summary',
        'products_performance',
      ]);
      expect(result.manifest.database.rowCount).toBe(2);
    });

    it('should apply date range filter to orders', async () => {
      mockClient.query.mockResolvedValue({ rows: [], rowCount: 0 });

      await strategy.export(defaultOptions);

      const queryCalls = mockClient.query.mock.calls;
      const ordersQuery = queryCalls.find(
        (call: any) => call[0].includes('orders') && call[0].includes('BETWEEN')
      );
      expect(ordersQuery).toBeDefined();
      expect(ordersQuery?.[1]).toEqual([defaultOptions.dateRange?.from, defaultOptions.dateRange?.to]);
    });

    it('should enforce S2 tenant isolation', async () => {
      mockClient.query.mockResolvedValue({ rows: [], rowCount: 0 });

      await strategy.export(defaultOptions);

      const queryCalls = mockClient.query.mock.calls;
      for (const call of queryCalls) {
        if ((call[0] as string).includes('SELECT')) {
          expect(call[0] as string).toContain('tenant_tenant-123');
        }
      }
    });

    it('should convert rows to CSV format', async () => {
      mockClient.query.mockImplementation((query: string) => {
        if (query.includes('orders')) {
          return Promise.resolve({ rows: [], rowCount: 0 });
        }
        if (query.includes('products')) {
          return Promise.resolve({
            rows: [
              { name: 'Item 1', sku: 'SKU1', times_ordered: 10, total_quantity: 100 },
            ],
            rowCount: 1,
          });
        }
        return Promise.resolve({ rows: [], rowCount: 0 });
      });

      await strategy.export(defaultOptions);

      const writeCalls = mockShell.write.mock.calls;
      const csvWrite = writeCalls.find((call: any) =>
        call[0].toString().includes('products_performance.csv')
      );
      expect(csvWrite).toBeDefined();
      // Use toMatch to be more lenient with line endings and whitespace
      expect(csvWrite?.[1] as string).toMatch(/name,sku,times_ordered,total_quantity/);
      expect(csvWrite?.[1] as string).toMatch(/Item 1,SKU1,10,100/);
    });

    it('should handle empty result sets', async () => {
      mockClient.query.mockResolvedValue({ rows: [], rowCount: 0 });

      const result = await strategy.export(defaultOptions);

      expect(result.manifest.database.rowCount).toBe(0);
    });

    it('should calculate checksum', async () => {
      mockClient.query.mockResolvedValue({ rows: [], rowCount: 0 });

      const result = await strategy.export(defaultOptions);

      expect(result.checksum).toMatch(/^[a-f0-9]{64}$/);
    });

    it('should cleanup on error', async () => {
      mockClient.query.mockRejectedValue(new Error('Query failed'));

      await expect(strategy.export(defaultOptions)).rejects.toThrow('Query failed');

      // Verify cleanup (mkdir, tar, rm)
      const spawnCalls = mockShell.spawn.mock.calls;
      const cleanupCall = spawnCalls.find(
        (call: any) => Array.isArray(call[0]) && call[0].includes('rm')
      );
      expect(cleanupCall).toBeDefined();
      expect(mockClient.release).toHaveBeenCalled();
    });

    it('should set 24h expiry', async () => {
      mockClient.query.mockResolvedValue({ rows: [], rowCount: 0 });

      const result = await strategy.export(defaultOptions);

      const now = Date.now();
      const expiryTime = result.expiresAt.getTime();
      const expectedExpiry = now + 24 * 60 * 60 * 1000;

      expect(expiryTime).toBeGreaterThan(now);
      expect(expiryTime).toBeLessThanOrEqual(expectedExpiry + 1000);
    });
  });
});
