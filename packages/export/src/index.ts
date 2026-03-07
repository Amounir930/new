/**
 * @apex/export - Tenant Data Export System
 *
 * Features:
 * - Strategy Pattern for multiple export formats (lite/native/analytics)
 * - BullMQ queue with Redis for background processing
 * - S2: Strict tenant isolation
 * - S4: Comprehensive audit logging
 * - S7: Secure presigned URLs with 24h TTL
 */

export { ExportController } from './export.controller';
export { ExportModule } from './export.module';
export { ExportService } from './export.service';
export { ExportWorker } from './export.worker';
export { ExportStrategyFactory } from './export-strategy.factory';
export { AnalyticsExportStrategy } from './strategies/analytics-export.strategy';

export { LiteExportStrategy } from './strategies/lite-export.strategy';
export { NativeExportStrategy } from './strategies/native-export.strategy';
export type {
  ExportJob,
  ExportManifest,
  ExportOptions,
  ExportProfile,
  ExportResult,
  ExportStrategy,
} from './types';
export { BunShell } from './utils/bun-shell';
