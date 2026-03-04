/**
 * Export Service Tests
 * Validates export functionality and security compliance
 */

import { beforeEach, describe, expect, it, mock } from 'bun:test';
import { publicPool } from '@apex/db';
import { ExportService } from './export.service';

// Mock DB
mock.module('@apex/db', () => ({
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

// Mock strategies and factory
const mockStrategy = {
  validate: mock().mockResolvedValue(true),
  export: mock().mockResolvedValue({
    checksum: 'mock-checksum',
    expiresAt: new Date(),
  }),
};

const mockFactory = {
  create: mock(() => mockStrategy),
  validateOptions: mock().mockResolvedValue(true),
};

describe('ExportService', () => {
  let service: ExportService;
  const mockAudit = { log: mock().mockResolvedValue(true) } as never;

  beforeEach(() => {
    mock.restore();

    // Default mock behavior for database
    (publicPool as never).connect.mockResolvedValue({
      query: mock().mockResolvedValue({ rows: [], rowCount: 0 }),
      release: mock(),
    } as never);

    // Reset factory mocks
    mockFactory.validateOptions.mockResolvedValue(true);
    mockFactory.create.mockReturnValue(mockStrategy);

    // Instantiate service with mock factory
    service = new ExportService(mockFactory as never, mockAudit);

    // Silence logger for tests
    (service as never).logger = {
      log: mock(),
      error: mock(),
      debug: mock(),
    };
  });

  describe('S14: Export Job Creation (Table-Driven)', () => {
    const testCases = [
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
        (service as never).exportQueue.getJobs = mock(
          async (types: string[]) => {
            if (types.includes('active')) return activeJobs;
            if (types.includes('completed')) return recentJobs;
            return [];
          }
        );
        (service as never).exportQueue.add = mock().mockResolvedValue({
          id: 'new-job',
        });

        if (error) {
          await expect(
            service.createExportJob(options as never)
          ).rejects.toThrow(error);
        } else {
          const result = await service.createExportJob(options as never);
          expect(result.status).toBe(expectedStatus);
          expect(mockAudit.log).toHaveBeenCalledWith(
            expect.objectContaining({ action: 'EXPORT_REQUESTED' })
          );
        }
      });
    }
  });

  describe('Utility Methods', () => {
    it('should map BullMQ states correctly', () => {
      expect((service as never).mapJobState('active')).toBe('processing');
      expect((service as never).mapJobState('completed')).toBe('completed');
      expect((service as never).mapJobState('failed')).toBe('failed');
      expect((service as never).mapJobState('waiting')).toBe('pending');
      expect((service as never).mapJobState('other')).toBe('pending');
    });
  });
});
