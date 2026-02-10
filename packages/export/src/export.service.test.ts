/**
 * Export Service Tests
 * Validates export functionality and security compliance
 */

import { publicPool } from '@apex/db';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ExportService } from './export.service.js';

// Mock DB
vi.mock('@apex/db', () => ({
  publicPool: {
    connect: vi.fn(),
    query: vi.fn(),
  },
  publicDb: {
    select: vi.fn(),
  },
}));

// Mock BullMQ
vi.mock('bullmq', () => ({
  Queue: vi.fn().mockImplementation(() => ({
    add: vi.fn(),
    getJobs: vi.fn(),
    getJob: vi.fn(),
    on: vi.fn(),
    close: vi.fn(),
  })),
}));

// Mock strategies and factory
const mockStrategy = {
  validate: vi.fn().mockResolvedValue(true),
  export: vi
    .fn()
    .mockResolvedValue({ checksum: 'mock-checksum', expiresAt: new Date() }),
};

const mockFactory = {
  create: vi.fn(() => mockStrategy),
  validateOptions: vi.fn().mockResolvedValue(true),
};

describe('ExportService', () => {
  let service: ExportService;
  const mockAudit = { log: vi.fn() } as any;

  beforeEach(() => {
    vi.clearAllMocks();

    // Default mock behavior for database
    (publicPool as any).connect.mockResolvedValue({
      query: vi.fn().mockResolvedValue({ rows: [], rowCount: 0 }),
      release: vi.fn(),
    } as any);

    // Reset factory mocks
    mockFactory.validateOptions.mockResolvedValue(true);
    mockFactory.create.mockReturnValue(mockStrategy);

    // Instantiate service with mock factory
    service = new ExportService(mockFactory as any, mockAudit);

    // Silence logger for tests
    (service as any).logger = { log: vi.fn(), error: vi.fn(), debug: vi.fn() };
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('S14: Export Job Creation (Table-Driven)', () => {
    it.each([
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
    ])(
      '$name',
      async ({
        options,
        factoryValid,
        activeJobs,
        recentJobs,
        error,
        expectedStatus,
      }) => {
        mockFactory.validateOptions.mockResolvedValue(factoryValid);
        (service as any).exportQueue.getJobs = vi
          .fn()
          .mockImplementation(async (types) => {
            if (types.includes('active')) return activeJobs;
            if (types.includes('completed')) return recentJobs;
            return [];
          });
        (service as any).exportQueue.add = vi
          .fn()
          .mockResolvedValue({ id: 'new-job' });

        if (error) {
          await expect(service.createExportJob(options as any)).rejects.toThrow(
            error
          );
        } else {
          const result = await service.createExportJob(options as any);
          expect(result.status).toBe(expectedStatus);
          expect(mockAudit.log).toHaveBeenCalledWith(
            expect.objectContaining({ action: 'EXPORT_REQUESTED' })
          );
        }
      }
    );
  });

  describe('Utility Methods', () => {
    it('should map BullMQ states correctly', () => {
      expect((service as any).mapJobState('active')).toBe('processing');
      expect((service as any).mapJobState('completed')).toBe('completed');
      expect((service as any).mapJobState('failed')).toBe('failed');
      expect((service as any).mapJobState('waiting')).toBe('pending');
      expect((service as any).mapJobState('other')).toBe('pending');
    });
  });
});
