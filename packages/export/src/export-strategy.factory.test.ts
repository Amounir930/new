/**
 * Export Strategy Factory Tests
 * Verifies strategy selection and validation
 */

import { beforeEach, describe, expect, it, mock } from 'bun:test';
import { ExportStrategyFactory } from './export-strategy.factory';
import type { ExportOptions } from './types';

describe('ExportStrategyFactory', () => {
  let factory: ExportStrategyFactory;

  // Mock strategies
  const mockLiteStrategy = {
    name: 'lite',
    validate: mock().mockResolvedValue(true),
    export: mock(),
  } as any;
  const mockNativeStrategy = {
    name: 'native',
    validate: mock().mockResolvedValue(true),
    export: mock(),
  } as any;
  const mockAnalyticsStrategy = {
    name: 'analytics',
    validate: mock().mockResolvedValue(true),
    export: mock(),
  } as any;

  beforeEach(() => {
    factory = new ExportStrategyFactory(
      mockLiteStrategy,
      mockNativeStrategy,
      mockAnalyticsStrategy
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
      expect(() => factory.getStrategy('invalid' as any)).toThrow(
        'Unknown export profile'
      );
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
