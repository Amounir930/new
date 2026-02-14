/**
 * Lite Export Strategy
 * Exports to portable formats (JSON, MySQL-compatible SQL)
 * Best for: Migration to other platforms, backups
 */

import { rm } from 'node:fs/promises';
import path from 'node:path';
import type { AuditService } from '@apex/audit';
import { publicPool, type TenantRegistryService } from '@apex/db';
import { Inject, Injectable, Logger } from '@nestjs/common';
import type {
  ExportManifest,
  ExportOptions,
  ExportResult,
  ExportStrategy,
} from '../types.js';
import type { BunShell } from '../utils/bun-shell.js';

@Injectable()
export class LiteExportStrategy implements ExportStrategy {
  readonly name = 'lite' as const;
  private readonly logger = new Logger(LiteExportStrategy.name);

  constructor(
    private readonly tenantRegistry: TenantRegistryService,
    private readonly shell: BunShell,
    @Inject('AUDIT_SERVICE') private readonly audit: AuditService
  ) { }

  async validate(options: ExportOptions): Promise<boolean> {
    return this.tenantRegistry.exists(options.tenantId);
  }

  private readonly MAX_ROWS_PER_TABLE = 100000; // 100K rows limit

  async export(options: ExportOptions): Promise<ExportResult> {
    this.logger.log(`Starting lite export for tenant: ${options.tenantId}`);

    // S2 Unified Identity: Use subdomain for schema name
    const tenant = await this.tenantRegistry.getByIdentifier(options.tenantId);
    if (!tenant) {
      throw new Error(`Tenant ${options.tenantId} not found`);
    }

    const schemaName = `tenant_${tenant.subdomain.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
    const workDir = `/tmp/export-${options.tenantId}-${Date.now()}`;
    const tarPath = `${workDir}.tar.gz`;
    // Create work directory
    await this.shell.spawn(['mkdir', '-p', `${workDir}/database`]).exited;

    const client = await publicPool.connect();
    try {
      // 🔒 S3: Secure SQL Identifiers (Anti SQL Injection)
      const pgEscape = (id: string) => {
        if (!/^[a-z0-9_]+$/.test(id)) {
          throw new Error(`S3 Violation: Invalid SQL identifier '${id}'`);
        }
        return `"${id}"`;
      };

      const safeSchema = pgEscape(schemaName);

      // S2: Get tables from tenant schema only
      const tablesResult = await client.query(
        `SELECT table_name FROM information_schema.tables 
         WHERE table_schema = $1 AND table_type = 'BASE TABLE'`,
        [schemaName]
      );

      const tables = tablesResult.rows.map(
        (r: { table_name: string }) => r.table_name
      );
      let totalRows = 0;

      // Export each table as JSON
      for (const table of tables) {
        const safeTable = pgEscape(table);
        this.logger.debug(`Exporting table: ${safeSchema}.${safeTable}`);

        // Check row count limit
        const countQuery = 'SELECT COUNT(*) FROM ' + safeSchema + '.' + safeTable;
        const countResult = await client.query({ text: countQuery });
        const rowCount = Number(countResult.rows[0].count);

        if (rowCount > this.MAX_ROWS_PER_TABLE) {
          throw new Error(
            `Table ${table} exceeds max rows (${rowCount} > ${this.MAX_ROWS_PER_TABLE})`
          );
        }

        const dataQuery = 'SELECT * FROM ' + safeSchema + '.' + safeTable;
        const dataResult = await client.query({ text: dataQuery });

        totalRows += dataResult.rowCount || 0;

        // Write to JSON file
        await this.writeTableToFile(
          `${workDir}/database/${table}.json`,
          dataResult.rows
        );
      }

      // Create manifest
      const manifest: ExportManifest = {
        tenantId: options.tenantId,
        exportedAt: new Date().toISOString(),
        profile: this.name,
        database: { tables, rowCount: totalRows, format: 'json' },
        assets: { files: [], totalSize: 0 },
        version: '1.0.0',
      };

      await this.shell.write(
        `${workDir}/manifest.json`,
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
    } catch (error) {
      // Cleanup even on error
      await this.secureCleanup(workDir);
      await this.secureCleanup(tarPath);
      throw error;
    } finally {
      client.release();
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

      if (!resolvedPath.startsWith(tempRoot) || resolvedPath === tempRoot) {
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

  private async writeTableToFile(filePath: string, data: any[]): Promise<void> {
    const json = JSON.stringify(data, null, 2);
    await this.shell.write(filePath, json);
  }
}
