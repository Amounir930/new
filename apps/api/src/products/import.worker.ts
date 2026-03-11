import { getTenantDb } from '@apex/db';
// biome-ignore lint/style/useImportType: Dependency Injection requires value import
import { EncryptionService } from '@apex/security';
import { OnQueueActive, OnQueueFailed, Process, Processor } from '@nestjs/bull';
import { Injectable, Logger } from '@nestjs/common';
import type { Job } from 'bull';

@Processor('import-queue')
@Injectable()
export class ImportWorker {
  private readonly logger = new Logger(ImportWorker.name);
  constructor(readonly _crypto: EncryptionService) {}

  @Process('product-import')
  async handleImport(job: Job) {
    const { tenantId, _adminId, _fileData, _options } = job.data;

    // 1. Update job status to processing
    const { release } = await getTenantDb(tenantId);
    try {
      // await db
      //   .update(importJobsInStorefront)
      //   .set({ status: 'processing', startedAt: new Date().toISOString() })
      //   .where(eq(importJobsInStorefront.id, job.id as string));
    } finally {
      release();
    }

    // 2. Mock processing (Row-by-row)
    // In a real app, parse CSV and iterate
    this.logger.log(`Processing import job ${job.id} for tenant ${tenantId}`);

    // Update progress example
    await job.progress(50);

    // 3. Mark as completed
    const { release: releaseEnd } = await getTenantDb(tenantId);
    try {
      // await dbEnd
      //   .update(importJobsInStorefront)
      //   .set({
      //     status: 'completed',
      //     completedAt: new Date().toISOString(),
      //     processedRows: 10,
      //     successRows: 10,
      //   })
      //   .where(eq(importJobsInStorefront.id, job.id as string));
    } finally {
      releaseEnd();
    }

    return { status: 'success' };
  }

  @OnQueueActive()
  onActive(job: Job) {
    this.logger.log(`Job ${job.id} started`);
  }

  @OnQueueFailed()
  async onFailed(job: Job, error: Error) {
    this.logger.error(`Job ${job.id} failed: ${error.message}`);
    const tenantId = job.data?.tenantId;
    if (!tenantId) return;
    const { release } = await getTenantDb(tenantId);
    try {
      // await db
      //   .update(importJobsInStorefront)
      //   .set({ status: 'failed', completedAt: new Date().toISOString() })
      //   .where(eq(importJobsInStorefront.id, job.id as string));
    } finally {
      release();
    }
  }
}
