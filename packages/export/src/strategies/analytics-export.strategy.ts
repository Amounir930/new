import { rm } from 'node:fs/promises';
import path from 'node:path';
// biome-ignore lint/style/useImportType: Dependency Injection requires value import (S1-S15 Compliance)
import { AuditService } from '@apex/audit';
import { getTenantDb, sql } from '@apex/db';
import { Inject, Injectable, Logger } from '@nestjs/common';
import type {
  ExportManifest,
  ExportOptions,
  ExportResult,
  ExportStrategy,
} from '../types.js';
// biome-ignore lint/style/useImportType: Dependency Injection requires value import (S1-S15 Compliance)
import { BunShell } from '../utils/bun-shell.js';

@Injectable()
export class AnalyticsExportStrategy implements ExportStrategy {
  readonly name = 'analytics' as const;
  private readonly logger = new Logger(AnalyticsExportStrategy.name);

  constructor(
    private readonly shell: BunShell,
    @Inject('AUDIT_SERVICE') private readonly audit: AuditService
  ) {}

  async validate(options: ExportOptions): Promise<boolean> {
    return !!options.dateRange; // Requires date range
  }

  async export(options: ExportOptions): Promise<ExportResult> {
    this.logger.log(
      `Starting analytics export for tenant: ${options.tenantId}`
    );

    const workDir = path.resolve(
      `/tmp/export-${options.tenantId}-${Date.now()}`
    );
    const outputFile = `${workDir}.tar.gz`;

    try {
      await this.shell.spawn(['mkdir', '-p', `${workDir}/analytics`]).exited;

      const { db, release } = await getTenantDb(options.tenantId);
      try {
        // S2: Hard Isolation. search_path is already set.
        const exportedFiles: string[] = [];

        // Export orders summary
        const ordersResult: any = await db.execute(sql`
          SELECT 
            DATE(created_at) as date,
            COUNT(*) as order_count,
            SUM(total_amount) as total_revenue,
            AVG(total_amount) as avg_order_value
          FROM orders
          WHERE created_at BETWEEN ${options.dateRange?.from} AND ${options.dateRange?.to}
          GROUP BY DATE(created_at)
          ORDER BY date
        `);

        await this.writeCSV(
          `${workDir}/analytics/orders_summary.csv`,
          ordersResult.rows || [],
          ['date', 'order_count', 'total_revenue', 'avg_order_value']
        );
        exportedFiles.push('orders_summary.csv');

        // Export products performance
        const productsResult: any = await db.execute(sql`
          SELECT 
            p.name,
            p.sku,
            COUNT(oi.id) as times_ordered,
            SUM(oi.quantity) as total_quantity
          FROM products p
          LEFT JOIN order_items oi ON p.id = oi.product_id
          WHERE oi.created_at BETWEEN ${options.dateRange?.from} AND ${options.dateRange?.to}
          GROUP BY p.id, p.name, p.sku
          ORDER BY times_ordered DESC
        `);

        await this.writeCSV(
          `${workDir}/analytics/products_performance.csv`,
          productsResult.rows || [],
          ['name', 'sku', 'times_ordered', 'total_quantity']
        );
        exportedFiles.push('products_performance.csv');

        // Create manifest
        const manifest: ExportManifest = {
          tenantId: options.tenantId,
          exportedAt: new Date().toISOString(),
          profile: this.name,
          database: {
            tables: ['orders_summary', 'products_performance'],
            rowCount:
              (ordersResult.rowCount ?? 0) + (productsResult.rowCount ?? 0),
            format: 'csv',
          },
          assets: {
            files: exportedFiles,
            totalSize: 0,
          },
          version: '1.0.0',
        };

        await this.shell.write(
          `${workDir}/manifest.json`,
          JSON.stringify(manifest, null, 2)
        );

        // Compress
        const proc = this.shell.spawn([
          'tar',
          '-czf',
          outputFile,
          '-C',
          workDir,
          '.',
        ]);
        await proc.exited;

        const stat = await this.shell.file(outputFile).stat();
        const fileData = await this.shell.file(outputFile).arrayBuffer();
        const hashBuffer = await crypto.subtle.digest('SHA-256', fileData);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const checksumHex = hashArray
          .map((b) => b.toString(16).padStart(2, '0'))
          .join('');

        this.logger.log(`Analytics export completed: ${outputFile}`);

        return {
          downloadUrl: outputFile,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
          sizeBytes: stat.size,
          checksum: checksumHex,
          manifest,
        };
      } finally {
        release();
      }
    } catch (error) {
      // Cleanup on error
      await this.secureCleanup(workDir);
      await this.secureCleanup(outputFile);
      throw error;
    } finally {
      // 🧹 Cleanup: Remove work directory after tarball is created
      await this.secureCleanup(workDir);
    }
  }

  /**
   * S14: Secure Cleanup with Path Validation
   * Prevents Command Injection and Traversal
   */
  private async secureCleanup(targetPath: string): Promise<void> {
    try {
      const resolvedPath = path.resolve(targetPath);
      const tempRoot = path.resolve('/tmp');
      const relative = path.relative(tempRoot, resolvedPath);

      if (relative.startsWith('..') || path.isAbsolute(relative) || !relative) {
        this.logger.error(
          `S14 Security Violation: Blocked attempt to delete outside /tmp: ${targetPath}`
        );
        return;
      }

      if (!path.basename(resolvedPath).startsWith('export-')) {
        this.logger.error(
          `S14 Security Violation: Blocked attempt to delete non-export file: ${targetPath}`
        );
        return;
      }

      await rm(resolvedPath, { recursive: true, force: true });

      await this.audit.log({
        action: 'EXPORT_CLEANUP',
        entityType: 'FILE_SYSTEM',
        entityId: targetPath,
        metadata: { success: true },
        severity: 'INFO',
      });
    } catch (err) {
      this.logger.error(`Audit/Cleanup Failure: ${targetPath}`, err);
    }
  }

  private async writeCSV(
    filePath: string,
    rows: any[],
    headers: string[]
  ): Promise<void> {
    const csvLines = [headers.join(',')];

    for (const row of rows) {
      const values = headers.map((h) => {
        const val = row[h];
        if (val === null || val === undefined) return '';
        // Escape quotes and wrap in quotes if contains comma
        const str = String(val).replace(/"/g, '""');
        return str.includes(',') ? `"${str}"` : str;
      });
      csvLines.push(values.join(','));
    }

    const csv = csvLines.join('\n');
    await this.shell.write(filePath, csv);
  }
}
