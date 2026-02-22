/**
 * Export Strategy Factory
 * Implements Strategy Pattern for different export types
 */

import { Injectable } from '@nestjs/common';
// biome-ignore lint/style/useImportType: Dependency Injection requires value import (S1-S15 Compliance)
import { AnalyticsExportStrategy } from './strategies/analytics-export.strategy.js';
// biome-ignore lint/style/useImportType: Dependency Injection requires value import (S1-S15 Compliance)
import { LiteExportStrategy } from './strategies/lite-export.strategy.js';
// biome-ignore lint/style/useImportType: Dependency Injection requires value import (S1-S15 Compliance)
import { NativeExportStrategy } from './strategies/native-export.strategy.js';
import type { ExportOptions, ExportProfile, ExportStrategy } from './types.js';

@Injectable()
export class ExportStrategyFactory {
  private strategies: Map<ExportProfile, ExportStrategy>;

  constructor(
    readonly liteStrategy: LiteExportStrategy,
    readonly nativeStrategy: NativeExportStrategy,
    readonly analyticsStrategy: AnalyticsExportStrategy
  ) {
    this.strategies = new Map<ExportProfile, ExportStrategy>([
      ['lite', liteStrategy],
      ['native', nativeStrategy],
      ['analytics', analyticsStrategy],
    ]);
  }

  getStrategy(profile: ExportProfile): ExportStrategy {
    const strategy = this.strategies.get(profile);
    if (!strategy) {
      throw new Error(`Unknown export profile: ${profile}`);
    }
    return strategy;
  }

  async validateOptions(options: ExportOptions): Promise<boolean> {
    const strategy = this.getStrategy(options.profile);
    return strategy.validate(options);
  }
}
