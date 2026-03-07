import { beforeEach, describe, expect, it, mock } from 'bun:test';
import type { AuditService } from '@apex/audit';
import { adminPool } from '@apex/db';
import { type Mocked, MockFactory } from '@apex/test-utils';
import type { Queue } from 'bullmq';
import { ExportService } from './export.service';
import type { ExportStrategyFactory } from './export-strategy.factory';
import type { ExportOptions } from './types';

// Mock DB
mock.module('@apex/db', () => ({
  adminPool: {
    connect: mock(),
  },
  publicPool: {
    connect: mock(),
    query: mock(),
  },
  publicDb: {
    select: mock(),
  },
}));

// 🛡️ Stabilization: Use Class-based mock for BullMQ Queue
mock.module('bullmq', () => {
  return {
    Queue: class {
      on = mock();
      add = mock();
      getJobs = mock();
      getJob = mock();
      close = mock();
    },
  };
});

describe('ExportService', () => {
  let service: ExportService;
  const mockAudit = MockFactory.createAuditService();

  interface PrivateExportService {
    logger: {
      log: ReturnType<typeof mock>;
      error: ReturnType<typeof mock>;
      debug: ReturnType<typeof mock>;
    };
    exportQueue: Mocked<Queue>;
    mapJobState(state: string): string;
  }

  const asPrivate = (s: ExportService) => s as unknown as PrivateExportService;

  const mockFactory: Mocked<ExportStrategyFactory> = {
    getStrategy: mock(),
    validateOptions: mock().mockResolvedValue(true),
  } as Mocked<ExportStrategyFactory>;

  beforeEach(() => {
    mock.restore();

    // Default mock behavior for database
    (adminPool.connect as ReturnType<typeof mock>).mockResolvedValue({
      query: mock().mockResolvedValue({ rows: [], rowCount: 0 }),
      release: mock(),
    });

    // Reset factory mocks
    mockFactory.validateOptions.mockResolvedValue(true);

    // Instantiate service with mock factory
    service = new ExportService(
      mockFactory as ExportStrategyFactory,
      mockAudit as AuditService
    );

    // Silence logger for tests
    asPrivate(service).logger = {
      log: mock(),
      error: mock(),
      debug: mock(),
    };
  });

  describe('S14: Export Job Creation (Table-Driven)', () => {
    const testCases: Array<{
      name: string;
      options: Record<string, unknown>;
      factoryValid: boolean;
      recentJobs: any[];
      activeJobs: any[]; // Order matches usage below
      error?: string;
      expectedStatus?: string;
    }> = [
      {
        name: 'Happy Path: Valid Lite Export',
        options: { tenantId: 't1', profile: 'lite', requestedBy: 'u1' },
        factoryValid: true,
        activeJobs: [],
        recentJobs: [],
        expectedStatus: 'pending',
      },
      {
        name: 'Error: Invalid Profile',
        options: { tenantId: 't1', profile: 'invalid', requestedBy: 'u1' },
        factoryValid: false,
        activeJobs: [],
        recentJobs: [],
        error: 'Invalid export options',
      },
      {
        name: 'Error: Concurrent Job Restriction',
        options: { tenantId: 't-active', profile: 'lite', requestedBy: 'u1' },
        factoryValid: true,
        activeJobs: [{ data: { tenantId: 't-active' }, id: 'active-1' }],
        recentJobs: [],
        error: 'Export already in progress',
      },
      {
        name: 'Error: Duplicate within 1 minute',
        options: { tenantId: 't-dup', profile: 'lite', requestedBy: 'u1' },
        factoryValid: true,
        activeJobs: [],
        recentJobs: [
          {
            data: { tenantId: 't-dup', profile: 'lite' },
            processedOn: Date.now() - 30000,
          },
        ],
        error: 'Duplicate export request',
      },
    ];

    for (const {
      name,
      options,
      factoryValid,
      activeJobs,
      recentJobs,
      error,
      expectedStatus,
    } of testCases) {
      it(name, async () => {
        mockFactory.validateOptions.mockResolvedValue(factoryValid);
        asPrivate(service).exportQueue.getJobs = mock(
          async (types?: string[]) => {
            if (types?.includes('active')) return activeJobs;
            if (types?.includes('completed')) return recentJobs;
            return [];
          }
        ) as Mock<(...args: any[]) => Promise<any[]>>;
        asPrivate(service).exportQueue.add = mock().mockResolvedValue({
          id: 'new-job',
        }) as Mock<(...args: any[]) => Promise<any>>;

        if (error) {
          await expect(
            service.createExportJob(options as ExportOptions)
          ).rejects.toThrow(error);
        } else {
          const result = await service.createExportJob(
            options as ExportOptions
          );
          expect(result.status).toBe(expectedStatus as ExportJob['status']);
          expect(mockAudit.log).toHaveBeenCalledWith(
            expect.objectContaining({ action: 'EXPORT_REQUESTED' })
          );
        }
      });
    }
  });

  describe('Utility Methods', () => {
    it('should map BullMQ states correctly', () => {
      expect(asPrivate(service).mapJobState('active')).toBe('processing');
      expect(asPrivate(service).mapJobState('completed')).toBe('completed');
      expect(asPrivate(service).mapJobState('failed')).toBe('failed');
      expect(asPrivate(service).mapJobState('waiting')).toBe('pending');
      expect(asPrivate(service).mapJobState('other')).toBe('pending');
    });
  });
});
