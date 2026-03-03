/**
 * Export Module
 * Tenant Data Export System
 * S2 Compliant with full audit trail
 */

import { AuditModule } from '@apex/audit';
import { ConfigModule } from '@apex/config';
import { Module } from '@nestjs/common';
import { ExportController } from './export.controller';
import { ExportService } from './export.service';
import { ExportWorker } from './export.worker';
import { ExportStrategyFactory } from './export-strategy.factory';
import { AnalyticsExportStrategy } from './strategies/analytics-export.strategy';
import { LiteExportStrategy } from './strategies/lite-export.strategy';
import { NativeExportStrategy } from './strategies/native-export.strategy';
import { BunShell } from './utils/bun-shell';

@Module({
  imports: [ConfigModule, AuditModule],
  controllers: [ExportController],
  providers: [
    BunShell,
    ExportWorker,
    ExportStrategyFactory,
    ExportService,
    LiteExportStrategy,
    NativeExportStrategy,
    AnalyticsExportStrategy,
  ],
  exports: [ExportService],
})
export class ExportModule {}
