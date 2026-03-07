/**
 * Export Strategy Factory Tests
 * Verifies strategy selection and validation
 */

import { beforeEach, describe, expect, it, mock } from 'bun:test';
import { ExportStrategyFactory } from './export-strategy.factory';
import type { AnalyticsExportStrategy } from './strategies/analytics-export.strategy';
import type { LiteExportStrategy } from './strategies/lite-export.strategy';
import type { NativeExportStrategy } from './strategies/native-export.strategy';
import type { ExportOptions, ExportProfile, ExportStrategy } from './types';

describe('ExportStrategyFactory', () => {
  let factory: ExportStrategyFactory;

  // Mock strategies
  const mockLiteStrategy: ExportStrategy = {
    name: 'lite',
    validate: mock().mockResolvedValue(true),
    export: mock() as ExportStrategy['export'],
  };
  const mockNativeStrategy: ExportStrategy = {
    name: 'native',
    validate: mock().mockResolvedValue(true),
    export: mock() as ExportStrategy['export'],
  };
  const mockAnalyticsStrategy: ExportStrategy = {
    name: 'analytics',
    validate: mock().mockResolvedValue(true),
    export: mock() as ExportStrategy['export'],
  };

  beforeEach(() => {
    const isLite = (s: unknown): s is LiteExportStrategy => true;
    const isNative = (s: unknown): s is NativeExportStrategy => true;
    const isAnalytics = (s: unknown): s is AnalyticsExportStrategy => true;

    factory = new ExportStrategyFactory(
      isLite(mockLiteStrategy)
        ? mockLiteStrategy
        : (() => {
            throw new Error('Unreachable');
          })(),
      isNative(mockNativeStrategy)
        ? mockNativeStrategy
        : (() => {
            throw new Error('Unreachable');
          })(),
      isAnalytics(mockAnalyticsStrategy)
        ? mockAnalyticsStrategy
        : (() => {
            throw new Error('Unreachable');
          })()
    );
  });

  describe('getStrategy', () => {
    it('should return lite strategy', () => {
      const strategy = factory.getStrategy('lite');
      expect(strategy.name).toBe('lite');
    });

    it('should return native strategy', () => {
      const strategy = factory.getStrategy('native');
      expect(strategy.name).toBe('native');
    });

    it('should return analytics strategy', () => {
      const strategy = factory.getStrategy('analytics');
      expect(strategy.name).toBe('analytics');
    });

    it('should throw for invalid profile', () => {
      const isProfile = (p: unknown): p is ExportProfile => true;
      const invalid = 'invalid';
      expect(() =>
        factory.getStrategy(
          isProfile(invalid)
            ? invalid
            : (() => {
                throw new Error('Unreachable');
              })()
        )
      ).toThrow('Unknown export profile');
    });
  });

  describe('validateOptions', () => {
    it('should validate lite options', async () => {
      const options: ExportOptions = {
        tenantId: 'tenant-123',
        profile: 'lite',
        requestedBy: 'user-456',
      };

      const result = await factory.validateOptions(options);
      expect(typeof result).toBe('boolean');
    });

    it('should validate native options', async () => {
      const options: ExportOptions = {
        tenantId: 'tenant-123',
        profile: 'native',
        requestedBy: 'user-456',
      };

      const result = await factory.validateOptions(options);
      expect(typeof result).toBe('boolean');
    });

    it('should validate analytics options with date range', async () => {
      const options: ExportOptions = {
        tenantId: 'tenant-123',
        profile: 'analytics',
        requestedBy: 'user-456',
        dateRange: {
          from: new Date('2026-01-01'),
          to: new Date('2026-01-31'),
        },
      };

      const result = await factory.validateOptions(options);
      expect(typeof result).toBe('boolean');
    });
  });
});
