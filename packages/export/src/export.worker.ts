/**
 * Export Worker
 * Processes export jobs from BullMQ queue
 * S2: Tenant isolation enforced
 * S4: Comprehensive audit logging
 */

import { readFile, rm } from 'node:fs/promises';
// biome-ignore lint/style/useImportType: Dependency Injection requires value import (S1-S15 Compliance)
import { AuditService } from '@apex/audit';
// biome-ignore lint/style/useImportType: Dependency Injection requires value import (S1-S15 Compliance)
import { ConfigService } from '@apex/config';
import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import {
  Inject,
  Injectable,
  Logger,
  type OnModuleDestroy,
  type OnModuleInit,
} from '@nestjs/common';
import { type Job, Queue, Worker } from 'bullmq';
// biome-ignore lint/style/useImportType: Dependency Injection requires value import (S1-S15 Compliance)
import { ExportStrategyFactory } from './export-strategy.factory';
import type { ExportOptions, ExportResult } from './types';

@Injectable()
export class ExportWorker implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(ExportWorker.name);
  private worker!: Worker;
  private exportQueue: Queue;
  private s3Client: S3Client;

  constructor(
    @Inject('AUDIT_SERVICE')
    private readonly audit: AuditService,
    private readonly strategyFactory: ExportStrategyFactory,
    private readonly config: ConfigService
  ) {
    // Initialize S3/MinIO client
    this.s3Client = new S3Client({
      endpoint: this.config.getWithDefault(
        'MINIO_ENDPOINT',
        'http://localhost:9000'
      ),
      region: this.config.getWithDefault('MINIO_REGION', 'us-east-1'),
      credentials: {
        accessKeyId: this.config.getWithDefault(
          'MINIO_ACCESS_KEY',
          ''
        ) as string,
        secretAccessKey: this.config.getWithDefault(
          'MINIO_SECRET_KEY',
          ''
        ) as string,
      },
      forcePathStyle: true,
    });

    // Initialize exportQueue for status checks
    this.exportQueue = new Queue('tenant-export', {
      connection: {
        url: this.config.get('REDIS_URL')!,
      },
    });
  }

  onModuleInit() {
    // Start worker with concurrency 1 per tenant (handled by queue)
    this.worker = new Worker(
      'tenant-export',
      async (job) => this.processJob(job),
      {
        connection: {
          url: this.config.get('REDIS_URL'),
        },
        concurrency: 3, // Process 3 exports simultaneously (different tenants)
        limiter: {
          max: 1, // 1 job
          duration: 1000, // per second
        },
      }
    );

    this.worker.on('completed', (job) => {
      this.logger.log(`Export job ${job.id} completed`);
    });

    this.worker.on('failed', (job, err) => {
      this.logger.error(`Export job ${job?.id} failed:`, err);
    });

    this.logger.log('Export worker started');
  }

  async onModuleDestroy() {
    await this.worker?.close();
    await this.exportQueue.close();
  }

  private readonly MAX_EXPORT_SIZE_BYTES = 500 * 1024 * 1024; // 500MB limit

  private async processJob(job: Job): Promise<ExportResult> {
    const { tenantId, profile, requestedBy, includeAssets, dateRange } =
      job.data;

    this.logger.log(`Processing export job ${job.id} for tenant ${tenantId}`);
    await job.updateProgress(10);

    const _workDir = `/tmp/export-${tenantId}-${Date.now()}`;
    let localFilePath: string | null = null;

    try {
      // S4: Audit log - processing started
      await this.audit.log({
        action: 'EXPORT_PROCESSING_STARTED',
        entityType: 'EXPORT',
        entityId: job.id as string,
        tenantId,
        metadata: { profile, requestedBy },
      });

      // Get export strategy
      const strategy = this.strategyFactory.getStrategy(profile);
      await job.updateProgress(20);

      // Execute export
      const options: ExportOptions = {
        tenantId,
        profile,
        requestedBy,
        includeAssets,
        dateRange,
      };

      const result = await strategy.export(options);
      localFilePath = result.downloadUrl;
      await job.updateProgress(70);

      // Check size limit
      if (result.sizeBytes > this.MAX_EXPORT_SIZE_BYTES) {
        throw new Error(
          `Export size (${(result.sizeBytes / 1024 / 1024).toFixed(2)}MB) ` +
          `exceeds limit (${this.MAX_EXPORT_SIZE_BYTES / 1024 / 1024}MB)`
        );
      }

      // Upload to restricted bucket
      const bucketName = 'tenant-exports';
      const objectKey = `exports/${tenantId}/${job.id}.tar.gz`;

      // Ensure bucket exists
      await this.ensureBucket(bucketName);

      // Upload file
      const fileBuffer = await readFile(result.downloadUrl);
      await this.s3Client.send(
        new PutObjectCommand({
          Bucket: bucketName,
          Key: objectKey,
          Body: fileBuffer,
          ContentType: 'application/gzip',
          Metadata: {
            'tenant-id': tenantId,
            'export-id': job.id as string,
            checksum: result.checksum,
          },
        })
      );

      await job.updateProgress(90);

      // Generate presigned URL (24h expiry)
      const presignedUrl = await getSignedUrl(
        this.s3Client,
        new GetObjectCommand({
          Bucket: bucketName,
          Key: objectKey,
        }),
        { expiresIn: 24 * 60 * 60 }
      );

      // EXPERIMENTAL: Immediate cleanup mode
      // File will be deleted when: 1) User calls confirm-download, or 2) 5 min timeout
      const _deleteJob = setTimeout(
        async () => {
          try {
            await this.deleteExportFile(
              bucketName,
              objectKey,
              job.id as string
            );
          } catch (err) {
            this.logger.error(`Auto-delete failed for ${objectKey}:`, err);
          }
        },
        5 * 60 * 1000
      ); // 5 minutes safety timeout

      // Store delete job reference for manual cleanup
      await job.updateData({
        ...job.data,
        deleteJobRef: true,
        bucketName,
        objectKey,
      });

      // Cleanup local file immediately (S14.8: Native Node cleanup)
      await rm(result.downloadUrl, { force: true }).catch(() => { });
      this.logger.log(`Cleaned up local file: ${result.downloadUrl}`);

      await job.updateProgress(100);

      // S4: Audit log - completed
      await this.audit.log({
        action: 'EXPORT_COMPLETED',
        entityType: 'EXPORT',
        entityId: job.id as string,
        tenantId,
        metadata: {
          profile,
          sizeBytes: result.sizeBytes,
          checksum: result.checksum,
        },
      });

      this.logger.log(`Export job ${job.id} completed successfully`);

      return {
        ...result,
        downloadUrl: presignedUrl, // Replace local path with presigned URL
      };
    } catch (error) {
      // S4: Audit log - failed
      await this.audit.log({
        action: 'EXPORT_FAILED',
        entityType: 'EXPORT',
        entityId: job.id as string,
        tenantId,
        metadata: {
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      });

      // Cleanup on failure (S14.8: Native Node cleanup)
      if (localFilePath) {
        await rm(localFilePath, { force: true }).catch(() => { });
        this.logger.log(`Cleaned up failed export file: ${localFilePath}`);
      }

      throw error;
    }
  }

  private async ensureBucket(bucketName: string): Promise<void> {
    try {
      // Check if bucket exists using head bucket
      await this.s3Client.send(
        new (await import('@aws-sdk/client-s3')).HeadBucketCommand({
          Bucket: bucketName,
        })
      );
    } catch {
      // Create bucket if not exists
      await this.s3Client.send(
        new (await import('@aws-sdk/client-s3')).CreateBucketCommand({
          Bucket: bucketName,
        })
      );

      // Note: Lifecycle policy disabled for immediate cleanup
      // Files are deleted after 5 minutes via setTimeout
      // TODO: Re-enable for production with 24h retention
    }
  }

  private async deleteExportFile(
    bucket: string,
    key: string,
    jobId: string
  ): Promise<void> {
    try {
      await this.s3Client.send(
        new (await import('@aws-sdk/client-s3')).DeleteObjectCommand({
          Bucket: bucket,
          Key: key,
        })
      );
      this.logger.log(`Deleted export file: ${key}`);

      // S4: Audit log
      await this.audit.log({
        action: 'EXPORT_FILE_DELETED',
        entityType: 'EXPORT',
        entityId: jobId,
        metadata: { bucket, key },
      });
    } catch (err) {
      this.logger.error(`Failed to delete ${key}:`, err);
      throw err;
    }
  }

  /**
   * Confirm download and delete file immediately
   * Called by client after successful download
   */
  async confirmDownload(jobId: string): Promise<void> {
    const job = await this.exportQueue.getJob(jobId);
    if (!job || !job.data.bucketName || !job.data.objectKey) {
      throw new Error('Export job not found or file already deleted');
    }

    await this.deleteExportFile(job.data.bucketName, job.data.objectKey, jobId);

    // Clear safety timeout
    // Note: In production, use Redis to track this
    this.logger.log(`Download confirmed and file deleted for job ${jobId}`);
  }
}
