import {
    Processor,
    Process,
    OnQueueActive,
    OnQueueCompleted,
    OnQueueFailed
} from '@nestjs/bull';
import type { Job } from 'bull';
import { db, products, productImages, importJobs, importErrors } from '@apex/db';
import { eq } from 'drizzle-orm';
import { EncryptionService } from '@apex/security';
import { Injectable } from '@nestjs/common';

@Processor('import-queue')
@Injectable()
export class ImportWorker {
    constructor(private readonly crypto: EncryptionService) { }

    @Process('product-import')
    async handleImport(job: Job) {
        const { tenantId, adminId, fileData, options } = job.data;

        // 1. Update job status to processing
        await db.update(importJobs)
            .set({ status: 'processing', startedAt: new Date() })
            .where(eq(importJobs.id as any, job.id as string) as any);

        // 2. Mock processing (Row-by-row)
        // In a real app, parse CSV and iterate
        console.log(`Processing import job ${job.id} for tenant ${tenantId}`);

        // Update progress example
        await job.progress(50);

        // 3. Mark as completed
        await db.update(importJobs)
            .set({
                status: 'completed',
                completedAt: new Date(),
                processedRows: 10,
                successRows: 10
            })
            .where(eq(importJobs.id as any, job.id as string) as any);

        return { status: 'success' };
    }

    @OnQueueActive()
    onActive(job: Job) {
        console.log(`Job ${job.id} started`);
    }

    @OnQueueFailed()
    async onFailed(job: Job, error: Error) {
        console.error(`Job ${job.id} failed: ${error.message}`);
        await db.update(importJobs)
            .set({ status: 'failed', completedAt: new Date() })
            .where(eq(importJobs.id as any, job.id as string) as any);
    }
}
