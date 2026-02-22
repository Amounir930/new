import {
    pgTable,
    uuid,
    varchar,
    integer,
    timestamp,
    text,
    jsonb,
    index,
    check,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

/**
 * S2: Import Jobs Table
 * Tracking for bulk product imports per tenant
 */
export const importJobs = pgTable(
    'import_jobs',
    {
        id: uuid('id').defaultRandom().primaryKey(),
        tenantId: uuid('tenant_id').notNull(),
        adminId: uuid('admin_id').notNull(),
        filename: varchar('filename', { length: 255 }).notNull(),
        fileSize: integer('file_size').notNull(),
        fileHash: varchar('file_hash', { length: 64 }).notNull(),
        status: varchar('status', { length: 20 })
            .default('pending')
            .notNull(),
        totalRows: integer('total_rows').default(0),
        processedRows: integer('processed_rows').default(0),
        successRows: integer('success_rows').default(0),
        errorRows: integer('error_rows').default(0),
        errorReportUrl: text('error_report_url'),
        startedAt: timestamp('started_at', { withTimezone: true }),
        completedAt: timestamp('completed_at', { withTimezone: true }),
        createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    },
    (table) => ({
        idxImportTenant: index('idx_import_jobs_tenant').on(table.tenantId, table.createdAt),
        statusCheck: sql`CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'partial'))`,
        progressCheck: sql`CHECK (processed_rows <= total_rows)`,
    })
);

/**
 * S7: Import Errors Table
 * Stores row-level validation errors. PII in rowData is encrypted.
 */
export const importErrors = pgTable(
    'import_errors',
    {
        id: uuid('id').defaultRandom().primaryKey(),
        jobId: uuid('job_id').references(() => importJobs.id, { onDelete: 'cascade' }),
        rowNumber: integer('row_number').notNull(),
        rowData: jsonb('row_data'), // Encrypted PII (S7)
        errorMessage: text('error_message').notNull(),
        errorType: varchar('error_type', { length: 50 }),
    },
    (table) => ({
        idxImportErrJob: index('idx_import_errors_job').on(table.jobId),
    })
);
