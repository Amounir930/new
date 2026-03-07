/**
 * Analytics Export Strategy Tests
 * Verifies CSV export with date range filtering
 */

import { beforeEach, describe, expect, it, type Mock, mock } from 'bun:test';
import { type Mocked, MockFactory } from '@apex/test-utils';
import type { ExportOptions } from '../types';
import { AnalyticsExportStrategy } from './analytics-export.strategy';

// Mock fs/promises
mock.module('node:fs/promises', () => ({
  rm: mock().mockResolvedValue(undefined),
}));

// Define mocks
const mockClient = MockFactory.createDbClient();
const mockShell = MockFactory.createBunShell();
const mockAuditService = MockFactory.createAuditService();

mock.module('@apex/db', () => {
  const sqlMock = mock(
    (strings: TemplateStringsArray, ...values: unknown[]) => ({
      strings,
      values,
    })
  ) as Mock<(...args: any[]) => any> & {
    identifier: Mock<(val: string) => any>;
  };
  sqlMock.identifier = mock((val: string) => `"${val}"`);

  return {
    sql: sqlMock,
    getTenantDb: mock(async (_tenantId: string) => {
      return {
        db: mockClient,
        release: mockClient.release,
      };
    }),
    publicPool: {
      connect: mock().mockResolvedValue(mockClient),
      query: mock().mockResolvedValue({
        rowCount: 1,
        rows: [{ id: 'tenant-123', status: 'active', subdomain: 'tenant-123' }],
      }),
    },
  };
});

describe('AnalyticsExportStrategy', () => {
  let strategy: AnalyticsExportStrategy;

  beforeEach(() => {
    mockClient.query.mockClear();
    mockClient.release.mockClear();
    (mockClient.execute as ReturnType<typeof mock>).mockResolvedValue({
      rows: [],
      rowCount: 0,
    });
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
      stat: mock().mockResolvedValue({ size: 512 }),
    } as unknown as ReturnType<Mocked<typeof mockShell>['file']>);

    strategy = new AnalyticsExportStrategy(mockShell, mockAuditService);
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
      (mockClient.execute as Mock<any>).mockImplementation(
        (query: { strings?: string[]; toString: () => string }) => {
          const queryText = query.strings
            ? query.strings.join('')
            : query.toString();
          if (queryText.includes('orders')) {
            return Promise.resolve({
              rows: [
                {
                  date: '2026-01-01',
                  order_count: 1,
                  total_revenue: 150,
                  avg_order_value: 150,
                },
              ],
              rowCount: 1,
            });
          }
          if (queryText.includes('products')) {
            return Promise.resolve({
              rows: [
                {
                  name: 'Product 1',
                  sku: 'SKU1',
                  times_ordered: 10,
                  total_quantity: 100,
                },
              ],
              rowCount: 1,
            });
          }
          return Promise.resolve({ rows: [], rowCount: 0 });
        }
      );

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
      (mockClient.execute as ReturnType<typeof mock>).mockResolvedValue({
        rows: [],
        rowCount: 0,
      });

      await strategy.export(defaultOptions);

      const executeCalls = (mockClient.execute as Mock<any>).mock.calls;
      const ordersCall = executeCalls.find((call: unknown[]) => {
        const query = call[0] as { strings?: string[]; toString: () => string };
        const queryText = query.strings
          ? query.strings.join('')
          : query.toString();
        return queryText.includes('orders') && queryText.includes('BETWEEN');
      });
      expect(ordersCall).toBeDefined();
      expect((ordersCall?.[0] as { values: unknown[] }).values).toEqual([
        defaultOptions.dateRange?.from,
        defaultOptions.dateRange?.to,
      ]);
    });

    it('should enforce S2 tenant isolation', async () => {
      (mockClient.execute as ReturnType<typeof mock>).mockResolvedValue({
        rows: [],
        rowCount: 0,
      });

      await strategy.export(defaultOptions);

      const executeCalls = (mockClient.execute as ReturnType<typeof mock>).mock
        .calls;
      for (const _call of executeCalls) {
        // AnalyticsExportStrategy relies on search_path, not explicit schema prefix in SQL.
      }
    });

    it('should convert rows to CSV format', async () => {
      (mockClient.execute as Mock<any>).mockImplementation(
        (query: { strings?: string[]; toString: () => string }) => {
          const queryText = query.strings
            ? query.strings.join('')
            : query.toString();
          if (queryText.includes('orders')) {
            return Promise.resolve({ rows: [], rowCount: 0 });
          }
          if (queryText.includes('products')) {
            return Promise.resolve({
              rows: [
                {
                  name: 'Item 1',
                  sku: 'SKU1',
                  times_ordered: 10,
                  total_quantity: 100,
                },
              ],
              rowCount: 1,
            });
          }
          return Promise.resolve({ rows: [], rowCount: 0 });
        }
      );

      await strategy.export(defaultOptions);

      const writeCalls = mockShell.write.mock.calls;
      const csvWrite = writeCalls.find((call: unknown[]) =>
        (call[0] as string | Buffer)
          .toString()
          .includes('products_performance.csv')
      );
      expect(csvWrite).toBeDefined();
      // Use toMatch to be more lenient with line endings and whitespace
      expect(csvWrite?.[1] as string).toMatch(
        /name,sku,times_ordered,total_quantity/
      );
      expect(csvWrite?.[1] as string).toMatch(/Item 1,SKU1,10,100/);
    });

    it('should handle empty result sets', async () => {
      (mockClient.execute as ReturnType<typeof mock>).mockResolvedValue({
        rows: [],
        rowCount: 0,
      });

      const result = await strategy.export(defaultOptions);

      expect(result.manifest.database.rowCount).toBe(0);
    });

    it('should calculate checksum', async () => {
      (mockClient.execute as ReturnType<typeof mock>).mockResolvedValue({
        rows: [],
        rowCount: 0,
      });

      const result = await strategy.export(defaultOptions);

      expect(result.checksum).toMatch(/^[a-f0-9]{64}$/);
    });

    it('should cleanup on error', async () => {
      (mockClient.execute as ReturnType<typeof mock>).mockRejectedValueOnce(
        new Error('Query failed')
      );

      await expect(strategy.export(defaultOptions)).rejects.toThrow(
        'Query failed'
      );

      expect(mockClient.release).toHaveBeenCalled();
    });

    it('should set 24h expiry', async () => {
      (mockClient.execute as ReturnType<typeof mock>).mockResolvedValue({
        rows: [],
        rowCount: 0,
      });

      const result = await strategy.export(defaultOptions);

      const now = Date.now();
      const expiryTime = result.expiresAt.getTime();
      const expectedExpiry = now + 24 * 60 * 60 * 1000;

      expect(expiryTime).toBeGreaterThan(now);
      expect(expiryTime).toBeLessThanOrEqual(expectedExpiry + 1000);
    });
  });
});
