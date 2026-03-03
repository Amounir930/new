import { getTenantDb, importJobsInStorefront } from '@apex/db';
// biome-ignore lint/style/useImportType: Dependency Injection requires value import
import { EncryptionService } from '@apex/security';
import { OnQueueActive, OnQueueFailed, Process, Processor } from '@nestjs/bull';
import { Injectable } from '@nestjs/common';
import type { Job } from 'bull';
import { eq } from 'drizzle-orm';

@Processor('import-queue')
@Injectable()
export class ImportWorker {
  constructor(readonly _crypto: EncryptionService) {}

  @Process('product-import')
  async handleImport(job: Job) {
    const { tenantId, _adminId, _fileData, _options } = job.data;

    // 1. Update job status to processing
    const { db, release } = await getTenantDb(tenantId);
    try {
      await db
        .update(importJobsInStorefront)
        .set({ status: 'processing', startedAt: new Date().toISOString() })
        .where(eq(importJobsInStorefront.id, job.id as string));
    } finally {
      release();
    }

    // 2. Mock processing (Row-by-row)
    // In a real app, parse CSV and iterate
    console.log(`Processing import job ${job.id} for tenant ${tenantId}`);

    // Update progress example
    await job.progress(50);

    // 3. Mark as completed
    const { db: dbEnd, release: releaseEnd } = await getTenantDb(tenantId);
    try {
      await dbEnd
        .update(importJobsInStorefront)
        .set({
          status: 'completed',
          completedAt: new Date().toISOString(),
          processedRows: 10,
          successRows: 10,
        })
        .where(eq(importJobsInStorefront.id, job.id as string));
    } finally {
      releaseEnd();
    }

    return { status: 'success' };
  }

  @OnQueueActive()
  onActive(job: Job) {
    console.log(`Job ${job.id} started`);
  }

  @OnQueueFailed()
  async onFailed(job: Job, error: Error) {
    console.error(`Job ${job.id} failed: ${error.message}`);
    const tenantId = job.data?.tenantId;
    if (!tenantId) return;
    const { db, release } = await getTenantDb(tenantId);
    try {
      await db
        .update(importJobsInStorefront)
        .set({ status: 'failed', completedAt: new Date().toISOString() })
        .where(eq(importJobsInStorefront.id, job.id as string));
    } finally {
      release();
    }
  }
}
