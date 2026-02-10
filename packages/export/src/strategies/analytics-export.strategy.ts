/**
 * Analytics Export Strategy
 * Exports aggregated data to CSV/Excel for business intelligence
 * Best for: Reporting, data analysis, BI tools
 */

import { publicPool } from '@apex/db';
import { Injectable, Logger } from '@nestjs/common';
import type {
  ExportManifest,
  ExportOptions,
  ExportResult,
  ExportStrategy,
} from '../types.js';
import { BunShell } from '../utils/bun-shell.js';

@Injectable()
export class AnalyticsExportStrategy implements ExportStrategy {
  readonly name = 'analytics' as const;
  private readonly logger = new Logger(AnalyticsExportStrategy.name);

  constructor(private readonly shell: BunShell) { }

  async validate(options: ExportOptions): Promise<boolean> {
    return !!options.dateRange; // Requires date range
  }

  async export(options: ExportOptions): Promise<ExportResult> {
    this.logger.log(
      `Starting analytics export for tenant: ${options.tenantId}`
    );

    const schemaName = `tenant_${options.tenantId}`;
    const workDir = `/tmp/export-${options.tenantId}-${Date.now()}`;
    await this.shell.spawn(['mkdir', '-p', `${workDir}/analytics`]).exited;

    const client = await publicPool.connect();
    const exportedFiles: string[] = [];

    try {
      // Export orders summary
      const ordersQuery = `
        SELECT 
          DATE(created_at) as date,
          COUNT(*) as order_count,
          SUM(total_amount) as total_revenue,
          AVG(total_amount) as avg_order_value
        FROM ${schemaName}.orders
        WHERE created_at BETWEEN $1 AND $2
        GROUP BY DATE(created_at)
        ORDER BY date
      `;

      const ordersResult = await client.query(ordersQuery, [
        options.dateRange?.from,
        options.dateRange?.to,
      ]);

      await this.writeCSV(
        `${workDir}/analytics/orders_summary.csv`,
        ordersResult.rows,
        ['date', 'order_count', 'total_revenue', 'avg_order_value']
      );
      exportedFiles.push('orders_summary.csv');

      // Export products performance
      const productsQuery = `
        SELECT 
          p.name,
          p.sku,
          COUNT(oi.id) as times_ordered,
          SUM(oi.quantity) as total_quantity
        FROM ${schemaName}.products p
        LEFT JOIN ${schemaName}.order_items oi ON p.id = oi.product_id
        WHERE oi.created_at BETWEEN $1 AND $2
        GROUP BY p.id
        ORDER BY times_ordered DESC
      `;

      const productsResult = await client.query(productsQuery, [
        options.dateRange?.from,
        options.dateRange?.to,
      ]);

      await this.writeCSV(
        `${workDir}/analytics/products_performance.csv`,
        productsResult.rows,
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
      const outputFile = `${workDir}.tar.gz`;
      const proc = this.shell.spawn(['tar', '-czf', outputFile, '-C', workDir, '.']);
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
      client.release();
      await this.shell.spawn(['rm', '-rf', workDir]).exited.catch(() => { });
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
