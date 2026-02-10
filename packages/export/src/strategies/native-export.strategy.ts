/**
 * Native Export Strategy
 * Creates PostgreSQL binary dump (pg_dump -Fc)
 * Best for: Backup/restore within PostgreSQL ecosystem
 */

import { Injectable, Logger } from '@nestjs/common';
import type {
  ExportManifest,
  ExportOptions,
  ExportResult,
  ExportStrategy,
} from '../types.js';
import { BunShell } from '../utils/bun-shell.js';

@Injectable()
export class NativeExportStrategy implements ExportStrategy {
  readonly name = 'native' as const;
  private readonly logger = new Logger(NativeExportStrategy.name);

  constructor(private readonly shell: BunShell) {}

  async validate(_options: ExportOptions): Promise<boolean> {
    // Check pg_dump availability
    try {
      const proc = this.shell.spawn(['pg_dump', '--version']);
      await proc.exited;
      return proc.exitCode === 0;
    } catch {
      return false;
    }
  }

  async export(options: ExportOptions): Promise<ExportResult> {
    this.logger.log(`Starting native export for tenant: ${options.tenantId}`);

    const schemaName = `tenant_${options.tenantId}`;
    const outputFile = `/tmp/export-${options.tenantId}-${Date.now()}.dump`;

    // Run pg_dump for specific schema
    const proc = this.shell.spawn([
      'pg_dump',
      '-Fc', // Custom format (compressed)
      '-n',
      schemaName, // Specific schema only
      '-f',
      outputFile,
      process.env.DATABASE_URL || '',
    ]);

    const exitCode = await proc.exited;

    if (exitCode !== 0) {
      const error = await new Response(proc.stderr).text();
      throw new Error(`pg_dump failed: ${error}`);
    }

    // Get file stats
    const stat = await this.shell.file(outputFile).stat();

    // Calculate checksum
    const fileData = await this.shell.file(outputFile).arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', fileData);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const checksumHex = hashArray
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');

    const manifest: ExportManifest = {
      tenantId: options.tenantId,
      exportedAt: new Date().toISOString(),
      profile: this.name,
      database: {
        tables: [], // Will be populated during import
        rowCount: 0,
        format: 'sql',
      },
      assets: { files: [], totalSize: 0 },
      version: '1.0.0',
    };

    this.logger.log(`Native export completed: ${outputFile}`);

    return {
      downloadUrl: outputFile,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      sizeBytes: stat.size,
      checksum: checksumHex,
      manifest,
    };
  }
}
