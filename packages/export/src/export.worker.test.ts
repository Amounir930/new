/**
 * Export Worker Tests
 * Verifies BullMQ worker processing and S3 upload
 */

import type { Job } from 'bullmq';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ExportWorker } from './export.worker.js';

// Mock BullMQ
vi.mock('bullmq', () => ({
  Worker: vi.fn().mockImplementation((_name, _processor, _options) => {
    return {
      on: vi.fn(),
      close: vi.fn().mockResolvedValue(undefined),
    };
  }),
  Queue: vi.fn().mockImplementation(() => ({
    getJob: vi.fn(),
    add: vi.fn(),
    close: vi.fn().mockResolvedValue(undefined),
  })),
}));

// Mock S3 Client
const mockS3Send = vi.fn().mockResolvedValue({});
vi.mock('@aws-sdk/client-s3', () => ({
  S3Client: vi.fn().mockImplementation(() => ({
    send: mockS3Send,
  })),
  PutObjectCommand: vi.fn(),
  GetObjectCommand: vi.fn(),
  DeleteObjectCommand: vi.fn(),
  HeadBucketCommand: vi.fn(),
  CreateBucketCommand: vi.fn(),
  PutBucketLifecycleConfigurationCommand: vi.fn(),
}));

vi.mock('@aws-sdk/s3-request-presigner', () => ({
  getSignedUrl: vi.fn().mockResolvedValue('https://presigned-url.example.com'),
}));

// Mock audit service
const mockAudit = {
  log: vi.fn().mockResolvedValue(undefined),
};

// Mock strategy
const mockStrategy = {
  name: 'lite',
  validate: vi.fn().mockResolvedValue(true),
  export: vi.fn().mockResolvedValue({
    downloadUrl: '/tmp/export.tar.gz',
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    sizeBytes: 1024,
    checksum: 'abc123',
    manifest: {
      tenantId: 'tenant-123',
      exportedAt: new Date().toISOString(),
      profile: 'lite',
      database: { tables: ['users'], rowCount: 10, format: 'json' },
      assets: { files: [], totalSize: 0 },
      version: '1.0.0',
    },
  }),
};

const mockFactory = {
  getStrategy: vi.fn().mockReturnValue(mockStrategy),
} as any;

// Mock fs
vi.mock('fs/promises', () => ({
  readFile: vi.fn().mockResolvedValue(Buffer.from('test data')),
  rm: vi.fn().mockResolvedValue(undefined),
}));

describe('ExportWorker', () => {
  let worker: ExportWorker;

  beforeEach(() => {
    vi.clearAllMocks();
    mockS3Send.mockReset();
    mockS3Send.mockResolvedValue({});
    vi.stubGlobal('Bun', {
      spawn: vi.fn().mockReturnValue({
        exited: Promise.resolve(),
      }),
      write: vi.fn().mockResolvedValue(undefined),
      file: vi.fn().mockReturnValue({
        arrayBuffer: vi.fn().mockResolvedValue(new ArrayBuffer(100)),
        stat: vi.fn().mockResolvedValue({ size: 1024 }),
      }),
    });
    worker = new ExportWorker(mockFactory, mockAudit as any);
    vi.mocked((worker as any).exportQueue.getJob).mockResolvedValue(null);
  });

  afterEach(async () => {
    await worker.onModuleDestroy();
    vi.unstubAllGlobals();
  });

  describe('processJob', () => {
    it('should process export job successfully', async () => {
      const job = {
        id: 'job-123',
        data: {
          tenantId: 'tenant-123',
          profile: 'lite',
          requestedBy: 'user-456',
        },
        updateProgress: vi.fn().mockResolvedValue(undefined),
        updateData: vi.fn().mockResolvedValue(undefined),
      } as unknown as Job;

      const result = await (worker as any).processJob(job);

      expect(result).toBeDefined();
      expect(result.downloadUrl).toBe('https://presigned-url.example.com');
      expect(mockStrategy.export).toHaveBeenCalled();
      expect(mockS3Send).toHaveBeenCalled();
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'EXPORT_PROCESSING_STARTED',
        })
      );
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'EXPORT_COMPLETED',
        })
      );
    });

    it('should update job progress', async () => {
      const job = {
        id: 'job-123',
        data: {
          tenantId: 'tenant-123',
          profile: 'lite',
          requestedBy: 'user-456',
        },
        updateProgress: vi.fn().mockResolvedValue(undefined),
        updateData: vi.fn().mockResolvedValue(undefined),
      } as unknown as Job;

      await (worker as any).processJob(job);

      expect(job.updateProgress).toHaveBeenCalledWith(10);
      expect(job.updateProgress).toHaveBeenCalledWith(20);
      expect(job.updateProgress).toHaveBeenCalledWith(70);
      expect(job.updateProgress).toHaveBeenCalledWith(90);
      expect(job.updateProgress).toHaveBeenCalledWith(100);
    });

    it('should upload to S3 with correct key', async () => {
      const job = {
        id: 'job-123',
        data: {
          tenantId: 'tenant-123',
          profile: 'lite',
          requestedBy: 'user-456',
        },
        updateProgress: vi.fn(),
        updateData: vi.fn(),
      } as unknown as Job;

      await (worker as any).processJob(job);

      const { PutObjectCommand } = await import('@aws-sdk/client-s3');
      expect(PutObjectCommand).toHaveBeenCalledWith(
        expect.objectContaining({
          Bucket: 'tenant-exports',
          Key: expect.stringContaining('tenant-123'),
        })
      );
    });

    it('should generate presigned URL with 24h expiry', async () => {
      const job = {
        id: 'job-123',
        data: {
          tenantId: 'tenant-123',
          profile: 'lite',
          requestedBy: 'user-456',
        },
        updateProgress: vi.fn(),
        updateData: vi.fn(),
      } as unknown as Job;

      await (worker as any).processJob(job);

      const { getSignedUrl } = await import('@aws-sdk/s3-request-presigner');
      expect(getSignedUrl).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        expect.objectContaining({
          expiresIn: 24 * 60 * 60,
        })
      );
    });

    it('should log audit trail for failed export', async () => {
      mockStrategy.export.mockRejectedValueOnce(new Error('Export failed'));

      const job = {
        id: 'job-123',
        data: {
          tenantId: 'tenant-123',
          profile: 'lite',
          requestedBy: 'user-456',
        },
        updateProgress: vi.fn(),
        updateData: vi.fn(),
      } as unknown as Job;

      await expect((worker as any).processJob(job)).rejects.toThrow(
        'Export failed'
      );

      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'EXPORT_FAILED',
          metadata: expect.objectContaining({
            error: 'Export failed',
          }),
        })
      );
    });

    it('should enforce S2 isolation in S3 key', async () => {
      const job = {
        id: 'job-123',
        data: {
          tenantId: 'tenant-456',
          profile: 'lite',
          requestedBy: 'user-789',
        },
        updateProgress: vi.fn(),
        updateData: vi.fn(),
      } as unknown as Job;

      await (worker as any).processJob(job);

      const { PutObjectCommand } = await import('@aws-sdk/client-s3');
      const putCall = vi.mocked(PutObjectCommand).mock.calls[0];
      expect(putCall[0].Key).toContain('tenant-456');
      expect(putCall[0].Key).not.toContain('tenant-123');
    });
  });

  describe('ensureBucket', () => {
    it('should create bucket if not exists', async () => {
      mockS3Send.mockRejectedValueOnce({ name: 'NotFound' });
      mockS3Send.mockResolvedValueOnce({});
      mockS3Send.mockResolvedValueOnce({});

      await (worker as any).ensureBucket('test-bucket');

      const { CreateBucketCommand } = await import('@aws-sdk/client-s3');
      expect(CreateBucketCommand).toHaveBeenCalledWith({
        Bucket: 'test-bucket',
      });
    });

    it('should skip creation if bucket exists', async () => {
      mockS3Send.mockResolvedValueOnce({});

      await (worker as any).ensureBucket('existing-bucket');

      const { CreateBucketCommand } = await import('@aws-sdk/client-s3');
      expect(CreateBucketCommand).not.toHaveBeenCalled();
    });
  });

  describe('deleteExportFile', () => {
    it('should delete file from S3', async () => {
      await (worker as any).deleteExportFile(
        'test-bucket',
        'test-key',
        'job-123'
      );

      const { DeleteObjectCommand } = await import('@aws-sdk/client-s3');
      expect(DeleteObjectCommand).toHaveBeenCalledWith({
        Bucket: 'test-bucket',
        Key: 'test-key',
      });
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'EXPORT_FILE_DELETED',
        })
      );
    });

    it('should handle delete errors gracefully', async () => {
      mockS3Send.mockRejectedValueOnce(new Error('Delete failed'));

      await expect(
        (worker as any).deleteExportFile('test-bucket', 'test-key', 'job-123')
      ).rejects.toThrow('Delete failed');
    });
  });

  describe('confirmDownload', () => {
    it('should delete file after download confirmation', async () => {
      const job = {
        id: 'job-123',
        data: {
          tenantId: 'tenant-123',
          profile: 'lite',
          bucketName: 'test-bucket',
          objectKey: 'test-key',
        },
        updateProgress: vi.fn(),
        updateData: vi.fn(),
      } as unknown as Job;

      // First process the job to create the file
      await (worker as any).processJob(job);

      (worker as any).exportQueue.getJob.mockResolvedValue(job);

      // Then confirm download
      await worker.confirmDownload('job-123');

      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'EXPORT_FILE_DELETED',
        })
      );
    });
  });

  describe('onModuleInit', () => {
    it('should initialize worker', async () => {
      await worker.onModuleInit();

      const { Worker } = await import('bullmq');
      expect(Worker).toHaveBeenCalledWith(
        'tenant-export',
        expect.any(Function),
        expect.objectContaining({
          connection: expect.any(Object),
          concurrency: 3,
        })
      );
    });
  });

  describe('onModuleDestroy', () => {
    it('should close worker gracefully', async () => {
      await worker.onModuleInit();
      await worker.onModuleDestroy();

      const workerInstance = (worker as any).worker;
      expect(workerInstance.close).toHaveBeenCalled();
    });
  });
});
