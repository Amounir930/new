/**
 * Export Service
 * Manages export jobs with BullMQ + Redis
 * S2: Maintains tenant isolation
 * S4: Audit logging
 * S7: Secure presigned URLs
 */

import { randomUUID } from 'node:crypto';
// biome-ignore lint/style/useImportType: Dependency Injection requires value import (S1-S15 Compliance)
import { AuditService } from '@apex/audit';
import { env } from '@apex/config';
import {
  Inject,
  Injectable,
  Logger,
  type OnModuleDestroy,
} from '@nestjs/common';
import { Queue } from 'bullmq';
// biome-ignore lint/style/useImportType: Dependency Injection requires value import (S1-S15 Compliance)
import { ExportStrategyFactory } from './export-strategy.factory.js';
import type { ExportJob, ExportOptions, ExportResult } from './types.js';

@Injectable()
export class ExportService implements OnModuleDestroy {
  private readonly logger = new Logger(ExportService.name);
  private readonly exportQueue: Queue;

  constructor(
    private readonly strategyFactory: ExportStrategyFactory,
    @Inject('AUDIT_SERVICE') private readonly audit: AuditService
  ) {
    // Initialize BullMQ queue
    this.exportQueue = new Queue('tenant-export', {
      connection: {
        host: env.REDIS_HOST,
        port: Number.parseInt(env.REDIS_PORT, 10),
      },
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 5000,
        },
        removeOnComplete: 100,
        removeOnFail: 50,
      },
    });

    // Concurrency: 1 per tenant (throttling)
    this.exportQueue.on('waiting', (job) => {
      this.logger.log(
        `Export job ${job.id} waiting for tenant ${job.data.tenantId}`
      );
    });
  }

  /**
   * Create a new export job
   * S4: Audit logged
   */
  async createExportJob(options: ExportOptions): Promise<ExportJob> {
    // Validate options
    const isValid = await this.strategyFactory.validateOptions(options);
    if (!isValid) {
      throw new Error(`Invalid export options for profile: ${options.profile}`);
    }

    // Check tenant concurrency (1 job per tenant)
    const activeJobs = await this.exportQueue.getJobs([
      'active',
      'waiting',
      'delayed',
    ]);
    const tenantJobs = activeJobs.filter(
      (j) => j.data.tenantId === options.tenantId
    );

    if (tenantJobs.length > 0) {
      throw new Error(
        `Export already in progress for tenant ${options.tenantId}. ` +
        `Job ID: ${tenantJobs[0].id}. Please wait for completion.`
      );
    }

    // Check for duplicate requests (same profile within 1 minute)
    const recentJobs = await this.exportQueue.getJobs(['completed']);
    const recentDuplicate = recentJobs.find((j) => {
      const completionTime = j.finishedOn || j.processedOn || j.timestamp;
      return (
        j.data.tenantId === options.tenantId &&
        j.data.profile === options.profile &&
        completionTime &&
        Date.now() - completionTime < 60 * 1000
      );
    });

    if (recentDuplicate) {
      const completionTime =
        recentDuplicate.finishedOn ||
        recentDuplicate.processedOn ||
        recentDuplicate.timestamp;
      const ago = Math.floor((Date.now() - (completionTime ?? 0)) / 1000);
      throw new Error(
        `Duplicate export request. Similar export completed ${ago}s ago.`
      );
    }

    const jobId = randomUUID();

    // Add to queue
    const _bullJob = await this.exportQueue.add(
      'export',
      {
        id: jobId,
        tenantId: options.tenantId,
        profile: options.profile,
        requestedBy: options.requestedBy,
        includeAssets: options.includeAssets,
        dateRange: options.dateRange,
      },
      {
        jobId,
        // Ensure FIFO within tenant
        priority: 1,
      }
    );

    // S4: Audit log
    await this.audit.log({
      action: 'EXPORT_REQUESTED',
      entityType: 'EXPORT',
      entityId: jobId,
      tenantId: options.tenantId,
      metadata: {
        profile: options.profile,
        requestedBy: options.requestedBy,
      },
    });

    this.logger.log(
      `Export job created: ${jobId} for tenant ${options.tenantId}`
    );

    return {
      id: jobId,
      tenantId: options.tenantId,
      profile: options.profile,
      requestedBy: options.requestedBy,
      requestedAt: new Date(),
      status: 'pending',
    };
  }

  /**
   * Get job status
   */
  async getJobStatus(jobId: string): Promise<ExportJob | null> {
    const job = await this.exportQueue.getJob(jobId);
    if (!job) return null;

    const state = await job.getState();
    const result = job.returnvalue as ExportResult | undefined;

    return {
      id: job.id as string,
      tenantId: job.data.tenantId,
      profile: job.data.profile,
      requestedBy: job.data.requestedBy,
      requestedAt: new Date(job.timestamp),
      status: this.mapJobState(state),
      progress: job.progress as number | undefined,
      result: result
        ? {
          ...result,
          expiresAt: new Date(result.expiresAt),
        }
        : undefined,
      error: job.failedReason || undefined,
    };
  }

  /**
   * Cancel a pending job
   */
  async cancelJob(jobId: string): Promise<boolean> {
    const job = await this.exportQueue.getJob(jobId);
    if (!job) return false;

    const state = await job.getState();
    if (state === 'completed' || state === 'failed') {
      return false; // Already finished
    }

    await job.remove();

    // S4: Audit log
    await this.audit.log({
      action: 'EXPORT_CANCELLED',
      entityType: 'EXPORT',
      entityId: jobId,
      tenantId: job.data.tenantId,
    });

    return true;
  }

  /**
   * List export jobs for tenant
   */
  async listTenantExports(tenantId: string): Promise<ExportJob[]> {
    const jobs = await this.exportQueue.getJobs([
      'waiting',
      'active',
      'completed',
      'failed',
    ]);

    return Promise.all(
      jobs
        .filter((j) => j.data.tenantId === tenantId)
        .map(async (j) => ({
          id: j.id as string,
          tenantId: j.data.tenantId,
          profile: j.data.profile,
          requestedBy: j.data.requestedBy,
          requestedAt: new Date(j.timestamp),
          status: this.mapJobState(await j.getState()),
        }))
    );
  }

  async onModuleDestroy() {
    await this.exportQueue.close();
  }

  private mapJobState(state: string): ExportJob['status'] {
    switch (state) {
      case 'waiting':
      case 'delayed':
        return 'pending';
      case 'active':
        return 'processing';
      case 'completed':
        return 'completed';
      case 'failed':
        return 'failed';
      default:
        return 'pending';
    }
  }
}
