/**
 * Lite Export Strategy
 * Exports to portable formats (JSON, MySQL-compatible SQL)
 * Best for: Migration to other platforms, backups
 */

import { rm } from 'node:fs/promises';
import path from 'node:path';
// biome-ignore lint/style/useImportType: Dependency Injection requires value import (S1-S15 Compliance)
import { AuditService } from '@apex/audit';
import { adminDb, eq, getTenantDb, sql, tenantsInGovernance } from '@apex/db';
import { Inject, Injectable, Logger } from '@nestjs/common';
import type {
  ExportManifest,
  ExportOptions,
  ExportResult,
  ExportStrategy,
} from '../types';
import type { BunShell } from '../utils/bun-shell';

@Injectable()
export class LiteExportStrategy implements ExportStrategy {
  readonly name = 'lite' as const;
  private readonly logger = new Logger(LiteExportStrategy.name);

  constructor(
    private readonly shell: BunShell,
    @Inject('AUDIT_SERVICE') private readonly audit: AuditService
  ) {}

  async validate(options: ExportOptions): Promise<boolean> {
    const tenants = await adminDb
      .select({ id: tenantsInGovernance.id })
      .from(tenantsInGovernance)
      .where(eq(tenantsInGovernance.id, options.tenantId))
      .limit(1);
    return tenants.length > 0;
  }

  private readonly MAX_ROWS_PER_TABLE = 100000; // 100K rows limit

  async export(options: ExportOptions): Promise<ExportResult> {
    this.logger.log(`Starting lite export for tenant: ${options.tenantId}`);

    const workDir = path.resolve(
      `/tmp/export-${options.tenantId}-${Date.now()}`
    );
    const tarPath = `${workDir}.tar.gz`;

    try {
      // Create work directory
      await this.shell.spawn(['mkdir', '-p', `${workDir}/database`]).exited;

      const { db, release } = await getTenantDb(options.tenantId);
      try {
        // S2: Hard Isolation. Using the scoped tenant db.

        // 1. Get tables from current schema (which is forced to the tenant's exact schema)
        const tablesResult = await db.execute(sql`
          SELECT table_name FROM information_schema.tables
          WHERE table_schema = current_schema() AND table_type = 'BASE TABLE'
        `);

        // S1 FIX 3B: Explicitly access rows property from Node pg
        const tables = (tablesResult.rows || []).map(
          (r) => r.table_name as string
        );
        let totalRows = 0;

        // 2. Export each table as JSON
        for (const table of tables) {
          // S3: Secure SQL Identifiers
          if (!/^[a-z0-9_]+$/.test(table)) {
            throw new Error(`S3 Violation: Invalid table name '${table}'`);
          }
          const safeTable = sql.identifier(table);

          this.logger.debug(`Exporting table: ${table}`);

          // Check row count limit
          const countResult = await db.execute(
            sql`SELECT COUNT(*) FROM ${safeTable}`
          );
          const rowCount = Number(
            (countResult.rows[0] as { count: string }).count
          );

          if (rowCount > this.MAX_ROWS_PER_TABLE) {
            throw new Error(
              `Table ${table} exceeds max rows (${rowCount} > ${this.MAX_ROWS_PER_TABLE})`
            );
          }

          const dataResult = await db.execute<Record<string, unknown>>(
            sql`SELECT * FROM ${safeTable}`
          );
          totalRows += dataResult.rowCount || 0;

          // Write to JSON file
          await this.writeTableToFile(
            `${workDir}/database/${table}on`,
            dataResult.rows || []
          );
        }

        // 3. Create manifest
        const manifest: ExportManifest = {
          tenantId: options.tenantId,
          exportedAt: new Date().toISOString(),
          profile: this.name,
          database: { tables, rowCount: totalRows, format: 'json' },
          assets: { files: [], totalSize: 0 },
          version: '1.0.0',
        };

        await this.shell.write(
          `${workDir}/manifeston`,
          JSON.stringify(manifest, null, 2)
        );

        // 4. Create tarball
        const proc = this.shell.spawn([
          'tar',
          '-czf',
          tarPath,
          '-C',
          workDir,
          '.',
        ]);
        await proc.exited;

        // 5. Finalize Result
        const stat = await this.shell.file(tarPath).stat();
        const fileData = await this.shell.file(tarPath).arrayBuffer();
        const hashBuffer = await crypto.subtle.digest('SHA-256', fileData);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const checksumHex = hashArray
          .map((b) => b.toString(16).padStart(2, '0'))
          .join('');

        this.logger.log(`Lite export completed: ${tarPath}`);

        return {
          downloadUrl: tarPath,
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
      await this.secureCleanup(tarPath);
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
      // 1. Path Normalization and Validation
      const resolvedPath = path.resolve(targetPath);
      const tempRoot = path.resolve('/tmp');

      const relative = path.relative(tempRoot, resolvedPath);

      // S14 FIX: Ensure the path is strictly inside /tmp and not /tmp itself
      if (relative.startsWith('..') || path.isAbsolute(relative) || !relative) {
        this.logger.error(
          `S14 Security Violation: Blocked attempt to delete outside /tmp: ${targetPath}`
        );
        return;
      }

      // 2. Strict Pattern Verification
      if (!path.basename(resolvedPath).startsWith('export-')) {
        this.logger.error(
          `S14 Security Violation: Blocked attempt to delete non-export file: ${targetPath}`
        );
        return;
      }

      // 3. Native FS Cleanup (No Shell Spawn)
      await rm(resolvedPath, { recursive: true, force: true });

      // 4. Audit Log
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

  private async writeTableToFile(
    filePath: string,
    data: unknown[]
  ): Promise<void> {
    const json = JSON.stringify(data, null, 2);
    await this.shell.write(filePath, json);
  }
}
