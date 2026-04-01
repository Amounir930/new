import { randomUUID } from 'node:crypto';
import path from 'node:path';
import { env } from '@apex/config';
import { AuditLog } from '@apex/audit';
import {
  type AuthenticatedRequest,
  JwtAuthGuard,
  TenantJwtMatchGuard,
} from '@apex/auth';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { InjectQueue } from '@nestjs/bull';
import {
  BadRequestException,
  Controller,
  Get,
  Logger,
  Param,
  Post,
  Req,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Queue } from 'bull';
import type { Response } from 'express';
import { memoryStorage } from 'multer';
import type { BulkImportTemplateService } from './bulk-import-template.service';

const MAX_FILE_SIZE_BYTES = 500 * 1024 * 1024; // 500MB
const TEMP_IMPORT_BUCKET = 'system-temp-imports';

@Controller('merchant/products/import')
@UseGuards(JwtAuthGuard, TenantJwtMatchGuard)
export class BulkImportController {
  private readonly logger = new Logger(BulkImportController.name);

  constructor(
    @InjectQueue('import-queue') private readonly importQueue: Queue,
    private readonly templateService: BulkImportTemplateService
  ) {}

  // ─── Template Download ──────────────────────────────────────────────────
  @Get('template')
  async downloadTemplate(@Res() res: Response) {
    const buffer = await this.templateService.generateTemplate();
    res.set({
      'Content-Type':
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition':
        'attachment; filename="apex-bulk-import-template.xlsx"',
      'Content-Length': buffer.length,
    });
    res.end(buffer);
  }

  // ─── Start Import ───────────────────────────────────────────────────────
  @Post()
  @AuditLog({ action: 'PRODUCT_BULK_IMPORT_START', entityType: 'product' })
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: MAX_FILE_SIZE_BYTES },
      storage: memoryStorage(),
      // biome-ignore lint/suspicious/noExplicitAny: multer fileFilter cb type
      fileFilter: (_req: any, file: Express.Multer.File, cb: any) => {
        const ext = path.extname(file.originalname).toLowerCase();
        if (ext !== '.xlsx' && ext !== '.zip') {
          return cb(new Error('Only .xlsx and .zip files are accepted'), false);
        }
        cb(null, true);
      },
    })
  )
  async startImport(
    @Req() req: AuthenticatedRequest,
    @UploadedFile() file: Express.Multer.File
  ) {
    if (!file) {
      throw new BadRequestException(
        'No file provided. Upload a .xlsx or .zip file.'
      );
    }

    const subdomain = req.tenantContext?.subdomain;
    if (!subdomain || subdomain === 'root' || subdomain === 'system') {
      throw new BadRequestException('Invalid tenant context');
    }

    const jobId = randomUUID();
    const ext = path.extname(file.originalname).toLowerCase() || '.xlsx';
    const isZip = ext === '.zip';

    // ─── Phase 1: Upload to MinIO Buffer (Stateless Persistence) ──────────
    // S3 Key Isolation: tenant-{id}/imports/{jobId}{ext}
    const s3Key = `tenant-${req.user.tenantId}/imports/${jobId}${ext}`;
    const s3Client = this.getS3Client();

    try {
      await s3Client.send(
        new PutObjectCommand({
          Bucket: TEMP_IMPORT_BUCKET,
          Key: s3Key,
          Body: file.buffer,
          ContentType: file.mimetype,
        })
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.error(`[BulkImport] MinIO Upload Failed: ${message}`);
      throw new BadRequestException('Failed to buffer import file to storage.');
    }

    // ─── Phase 2: Queue Job with S3 Reference ─────────────────────────────
    const job = await this.importQueue.add(
      'product-import',
      {
        tenantId: req.user.tenantId,
        schemaName: `tenant_${subdomain.toLowerCase().replace(/[^a-z0-9]/g, '')}`,
        subdomain,
        s3Bucket: TEMP_IMPORT_BUCKET,
        s3Key: s3Key,
        isZip,
        jobId,
        originalName: file.originalname,
      },
      {
        jobId,
        attempts: 1,
        removeOnComplete: false,
        removeOnFail: false,
      }
    );

    this.logger.log(
      `[BulkImport] Job ${job.id} queued (MinIO: ${s3Key}) for tenant ${req.user.tenantId}`
    );

    return {
      jobId: job.id,
      status: 'queued',
      filename: file.originalname,
      message: `File received and buffered. Processing ${isZip ? 'ZIP archive' : 'Excel sheet'}.`,
    };
  }

  // ─── Poll Status ────────────────────────────────────────────────────────
  @Get(':jobId')
  async getImportStatus(@Param('jobId') jobId: string) {
    const job = await this.importQueue.getJob(jobId);
    if (!job) {
      throw new BadRequestException(`Job ${jobId} not found`);
    }

    const state = await job.getState();
    const progress = job.progress();
    const result = job.returnvalue;

    return {
      jobId,
      state,
      progress,
      ...(result
        ? {
            status: result.status,
            importedCount: result.importedCount ?? 0,
            errors: result.errors ?? [],
          }
        : { status: state === 'failed' ? 'failed' : 'processing' }),
    };
  }

  private getS3Client(): S3Client {
    if (!env.MINIO_ACCESS_KEY || !env.MINIO_SECRET_KEY) {
      throw new Error('S1 VIOLATION: MinIO credentials missing.');
    }
    return new S3Client({
      endpoint: env.MINIO_ENDPOINT,
      region: env.MINIO_REGION || 'us-east-1',
      credentials: {
        accessKeyId: env.MINIO_ACCESS_KEY,
        secretAccessKey: env.MINIO_SECRET_KEY,
      },
      forcePathStyle: true,
    });
  }
}

