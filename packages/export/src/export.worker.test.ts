/**
 * Export Worker Tests
 * S14: Comprehensive export processing validation
 * Rule 4.1: Test Coverage Mandate
 */

import type { Job } from 'bullmq';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ExportWorker } from './export.worker.js';

// Mock BullMQ
vi.mock('bullmq', () => ({
  Worker: class {
    on = vi.fn();
    close = vi.fn();
  },
  Queue: class {
    close = vi.fn();
    getJob = vi.fn();
  },
}));

// Mock AWS S3
vi.mock('@aws-sdk/client-s3', () => ({
  S3Client: class {
    send = vi.fn().mockResolvedValue({});
  },
  PutObjectCommand: class {},
  GetObjectCommand: class {},
  HeadBucketCommand: class {},
  CreateBucketCommand: class {},
  DeleteObjectCommand: class {},
}));

vi.mock('@aws-sdk/s3-request-presigner', () => ({
  getSignedUrl: vi.fn().mockResolvedValue('https://mock-presigned-url.com'),
}));

// Mock FS
vi.mock('fs/promises', () => ({
  readFile: vi.fn().mockResolvedValue(Buffer.from('test-data')),
  rm: vi.fn().mockResolvedValue(undefined),
}));

describe('ExportWorker', () => {
  let worker: ExportWorker;
  const mockAudit = { log: vi.fn() } as any;
  const mockStrategy = {
    export: vi.fn().mockResolvedValue({
      downloadUrl: '/tmp/test.tar.gz',
      sizeBytes: 1024,
      checksum: 'abc-123',
    }),
  };
  const mockFactory = {
    getStrategy: vi.fn().mockReturnValue(mockStrategy),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    worker = new ExportWorker(mockFactory as any, mockAudit);
    // @ts-expect-error - access private for testing
    worker.logger = { log: vi.fn(), error: vi.fn() } as any;
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
      updateProgress: vi.fn().mockResolvedValue(undefined),
      updateData: vi.fn().mockResolvedValue(undefined),
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
      updateProgress: vi.fn(),
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
      updateProgress: vi.fn(),
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
