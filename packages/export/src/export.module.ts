/**
 * Export Module
 * Tenant Data Export System
 * S2 Compliant with full audit trail
 */

import { Module } from '@nestjs/common';
import { ExportStrategyFactory } from './export-strategy.factory.js';
import { ExportController } from './export.controller.js';
import { ExportService } from './export.service.js';
import { ExportWorker } from './export.worker.js';
import { AnalyticsExportStrategy } from './strategies/analytics-export.strategy.js';
import { LiteExportStrategy } from './strategies/lite-export.strategy.js';
import { NativeExportStrategy } from './strategies/native-export.strategy.js';

import { BunShell } from './utils/bun-shell.js';

@Module({
  imports: [],
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
export class ExportModule { }
