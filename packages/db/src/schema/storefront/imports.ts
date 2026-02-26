/**
 * Storefront Imports Schema — V5
 *
 * Tracking for bulk product imports per tenant.
 *
 * @module @apex/db/schema/storefront/imports
 */

import { sql } from 'drizzle-orm';
import {
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';
import { storefrontSchema, ulidId } from '../v5-core';

/**
 * Import Jobs Table
 * Column alignment: UUID → TIMESTAMPTZ → INT → TEXT
 */
export const importJobs = storefrontSchema.table(
  'import_jobs',
  {
    // ── Fixed (Alignment) ──
    id: ulidId(),
    tenantId: uuid('tenant_id').notNull(),
    adminId: uuid('admin_id').notNull(),
    startedAt: timestamp('started_at', { withTimezone: true }),
    completedAt: timestamp('completed_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),

    // ── Integer ──
    fileSize: integer('file_size').notNull(),
    totalRows: integer('total_rows').default(0),
    processedRows: integer('processed_rows').default(0),
    successRows: integer('success_rows').default(0),
    errorRows: integer('error_rows').default(0),

    // ── Scalar ──
    status: text('status').default('pending').notNull(),
    filename: text('filename').notNull(),
    fileHash: text('file_hash').notNull(),
    errorReportUrl: text('error_report_url'),
  },
  (table) => ({
    idxImportTenant: index('idx_import_jobs_tenant').on(
      table.tenantId,
      table.createdAt
    ),
    statusCheck: sql`CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'partial'))`,
    progressCheck: sql`CHECK (processed_rows <= total_rows)`,
  })
);

/**
 * Import Errors Table
 */
export const importErrors = storefrontSchema.table(
  'import_errors',
  {
    // ── Fixed ──
    id: ulidId(),
    jobId: uuid('job_id').references(() => importJobs.id, {
      onDelete: 'cascade',
    }),

    // ── Integer ──
    rowNumber: integer('row_number').notNull(),

    // ── Scalar ──
    errorMessage: text('error_message').notNull(),
    errorType: text('error_type'),

    // ── JSONB (S7 Encrypted) ──
    rowData: jsonb('row_data'),
  },
  (table) => ({
    idxImportErrJob: index('idx_import_errors_job').on(table.jobId),
  })
);

// ─── Type Exports ───────────────────────────────────────────
export type ImportJob = typeof importJobs.$inferSelect;
export type ImportError = typeof importErrors.$inferSelect;
