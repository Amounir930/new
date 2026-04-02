/**
 * Export Worker Tests
 * S14: Comprehensive export processing validation
 * Rule 4.1: Test Coverage Mandate
 */

import { beforeEach, describe, expect, it, type Mock, mock } from 'bun:test';
import type { AuditService } from '@apex/audit';
import type { ConfigService } from '@apex/config/server';
import { type Mocked, MockFactory } from '@apex/test-utils';
import type { Job } from 'bullmq';
import { ExportWorker } from './export.worker';
import type { ExportStrategyFactory } from './export-strategy.factory';
import type { ExportManifest, ExportResult, ExportStrategy } from './types';

// Mock BullMQ
mock.module('bullmq', () => ({
  Worker: class {
    on = mock();
    close = mock();
  },
  Queue: class {
    close = mock();
    getJob = mock();
  },
}));

// Mock AWS S3
mock.module('@aws-sdk/client-s3', () => ({
  S3Client: class {
    send = mock().mockResolvedValue({});
  },
  PutObjectCommand: class {},
  GetObjectCommand: class {},
  HeadBucketCommand: class {},
  CreateBucketCommand: class {},
  DeleteObjectCommand: class {},
}));

mock.module('@aws-sdk/s3-request-presigner', () => ({
  getSignedUrl: mock().mockResolvedValue('https://mock-presigned-url.com'),
}));

// Mock FS
mock.module('fs/promises', () => ({
  readFile: mock().mockResolvedValue(Buffer.from('test-data')),
  rm: mock().mockResolvedValue(undefined),
}));

describe('ExportWorker', () => {
  let worker: ExportWorker;
  let mockAudit: Mocked<AuditService>;
  let mockStrategy: Mocked<ExportStrategy>;
  let mockFactory: Mocked<ExportStrategyFactory>;
  let mockConfig: Mocked<ConfigService>;

  const createMockManifest = (
    overrides: Partial<ExportManifest> = {}
  ): ExportManifest => ({
    version: '1.0',
    tenantId: 'tenant-1',
    exportedAt: new Date().toISOString(),
    profile: 'lite',
    database: { tables: [], rowCount: 0, format: 'json' },
    assets: { files: [], totalSize: 0 },
    ...overrides,
  });

  const isJob = (j: unknown): j is Job => true;

  beforeEach(() => {
    mockAudit = MockFactory.createAuditService();
    const strategyMock = {
      name: 'lite',
      validate: mock().mockResolvedValue(true),
      export: mock().mockResolvedValue({
        downloadUrl: '/tmp/test.tar.gz',
        sizeBytes: 1024,
        checksum: 'abc-123',
        manifest: createMockManifest(),
        expiresAt: new Date(),
      } as ExportResult),
    };
    const isStrategy = (s: unknown): s is Mocked<ExportStrategy> => true;
    mockStrategy = isStrategy(strategyMock)
      ? strategyMock
      : (() => {
          throw new Error('Unreachable');
        })();

    const factoryMock = {
      getStrategy: mock().mockReturnValue(mockStrategy),
      validateOptions: mock().mockResolvedValue(true),
    };
    const isFactory = (f: unknown): f is Mocked<ExportStrategyFactory> => true;
    mockFactory = isFactory(factoryMock)
      ? factoryMock
      : (() => {
          throw new Error('Unreachable');
        })();

    mockConfig = MockFactory.createConfigService();

    worker = new ExportWorker(mockAudit, mockFactory, mockConfig);

    // Silence logger and mock internal state
    // @ts-expect-error - accessing private member
    worker.logger = {
      log: mock(),
      error: mock(),
    };
  });

  it('should process a valid export job successfully', async () => {
    const jobMock = {
      id: 'job-123',
      data: {
        tenantId: 'tenant-1',
        profile: 'lite',
        requestedBy: 'user-1',
        includeAssets: true,
      },
      updateProgress: mock().mockResolvedValue(undefined),
      updateData: mock().mockResolvedValue(undefined),
    };
    const mockJob = isJob(jobMock)
      ? jobMock
      : (() => {
          throw new Error('Unreachable');
        })();

    // @ts-expect-error - accessing private member
    const result = await worker.processJob(mockJob);

    expect(result.downloadUrl).toBe('https://mock-presigned-url.com');
    expect(mockJob.updateProgress).toHaveBeenCalledWith(100);
    expect(mockAudit.log).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'EXPORT_COMPLETED',
        tenantId: 'tenant-1',
      })
    );
  });

  it('should handle export size limit violation', async () => {
    const jobLimitMock = {
      id: 'job-huge',
      data: { tenantId: 'tenant-1', profile: 'lite' },
      updateProgress: mock().mockResolvedValue(undefined),
    };
    const mockJob = isJob(jobLimitMock)
      ? jobLimitMock
      : (() => {
          throw new Error('Unreachable');
        })();

    (mockStrategy.export as Mock<any>).mockResolvedValueOnce({
      downloadUrl: '/tmp/huge.tar.gz',
      sizeBytes: 600 * 1024 * 1024, // 600MB
      checksum: 'big-file',
      manifest: createMockManifest(),
      expiresAt: new Date(),
    } as ExportResult);

    await expect(
      // @ts-expect-error - accessing private member
      worker.processJob(mockJob)
    ).rejects.toThrow(/exceeds limit/);
    expect(mockAudit.log).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'EXPORT_FAILED',
      })
    );
  });

  it('should cleanup local file on failure', async () => {
    const jobFailMock = {
      id: 'job-fail',
      data: { tenantId: 'tenant-1', profile: 'lite' },
      updateProgress: mock().mockResolvedValue(undefined),
    };
    const mockJob = isJob(jobFailMock)
      ? jobFailMock
      : (() => {
          throw new Error('Unreachable');
        })();

    (mockStrategy.export as Mock<any>).mockRejectedValueOnce(
      new Error('Export crash')
    );

    await expect(
      // @ts-expect-error - accessing private member
      worker.processJob(mockJob)
    ).rejects.toThrow('Export crash');
    expect(mockAudit.log).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'EXPORT_FAILED',
      })
    );
  });
});
