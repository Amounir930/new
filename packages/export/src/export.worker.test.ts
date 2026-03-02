/**
 * Export Worker Tests
 * S14: Comprehensive export processing validation
 * Rule 4.1: Test Coverage Mandate
 */

import { beforeEach, describe, expect, it, mock } from 'bun:test';
import type { Job } from 'bullmq';
import { ExportWorker } from './export.worker.js';

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
  const mockAudit = { log: mock() } as any;
  const mockStrategy = {
    export: mock().mockResolvedValue({
      downloadUrl: '/tmp/test.tar.gz',
      sizeBytes: 1024,
      checksum: 'abc-123',
    }),
  };
  const mockFactory = {
    getStrategy: mock().mockReturnValue(mockStrategy),
  };

  beforeEach(() => {
    // mock.restore() removed as it breaks module mocks defined at top-level
    const mockConfig = {
      getWithDefault: mock().mockReturnValue('http://localhost:9000'),
      get: mock().mockReturnValue('mock'),
      getOrThrow: mock().mockReturnValue('mock'),
    };
    worker = new ExportWorker(mockAudit, mockFactory as any, mockConfig as any);
    // @ts-expect-error - access private for testing
    (worker as any).logger = { log: mock(), error: mock() } as any;
  });

  it('should process a valid export job successfully', async () => {
    const mockJob = {
      id: 'job-123',
      data: {
        tenantId: 'tenant-1',
        profile: 'lite',
        requestedBy: 'user-1',
        includeAssets: true,
      },
      updateProgress: mock().mockResolvedValue(undefined),
      updateData: mock().mockResolvedValue(undefined),
    } as unknown as Job;

    // @ts-expect-error - access private to trigger processJob
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
    const mockJob = {
      id: 'job-huge',
      data: { tenantId: 'tenant-1', profile: 'lite' },
      updateProgress: mock(),
    } as any;

    mockStrategy.export.mockResolvedValueOnce({
      downloadUrl: '/tmp/huge.tar.gz',
      sizeBytes: 600 * 1024 * 1024, // 600MB
      checksum: 'big-file',
    });

    // @ts-expect-error
    await expect(worker.processJob(mockJob)).rejects.toThrow(/exceeds limit/);
    expect(mockAudit.log).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'EXPORT_FAILED',
      })
    );
  });

  it('should cleanup local file on failure', async () => {
    const mockJob = {
      id: 'job-fail',
      data: { tenantId: 'tenant-1', profile: 'lite' },
      updateProgress: mock(),
    } as any;

    mockStrategy.export.mockRejectedValueOnce(new Error('Export crash'));

    // @ts-expect-error
    await expect(worker.processJob(mockJob)).rejects.toThrow('Export crash');
    expect(mockAudit.log).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'EXPORT_FAILED',
      })
    );
  });
});
