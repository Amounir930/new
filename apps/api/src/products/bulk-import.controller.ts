/**
 * BulkImportController
 * Endpoints:
 *   GET  /merchant/products/import/template  → Download Excel template
 *   POST /merchant/products/import           → Upload file, enqueue job
 *   GET  /merchant/products/import/:jobId    → Poll job status
 */

import path from 'node:path';
import fsp from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import type { Request } from 'express';
import type { StorageEngine } from 'multer';
import { AuditLog } from '@apex/audit';
import {
  type AuthenticatedRequest,
  JwtAuthGuard,
  TenantJwtMatchGuard,
} from '@apex/auth';
import {
  BadRequestException,
  Controller,
  Get,
  Param,
  Post,
  Req,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  Logger,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { InjectQueue } from '@nestjs/bull';
import type { Queue } from 'bull';
import type { Response } from 'express';
import { diskStorage } from 'multer';
import { BulkImportTemplateService } from './bulk-import-template.service';

const MAX_FILE_SIZE_BYTES = 500 * 1024 * 1024; // 500MB
const ALLOWED_MIMES = new Set([
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
  'application/zip',
  'application/x-zip-compressed',
  'application/octet-stream', // some clients send this for xlsx/zip
]);

@Controller('merchant/products/import')
@UseGuards(JwtAuthGuard, TenantJwtMatchGuard)
export class BulkImportController {
  private readonly logger = new Logger(BulkImportController.name);

  constructor(
    @InjectQueue('import-queue') private readonly importQueue: Queue,
    private readonly templateService: BulkImportTemplateService,
  ) {}

  // ─── Template Download ──────────────────────────────────────────────────
  @Get('template')
  async downloadTemplate(@Res() res: Response) {
    const buffer = await this.templateService.generateTemplate();
    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="apex-bulk-import-template.xlsx"',
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
      storage: diskStorage({
        destination: (_req: Request, _file: Express.Multer.File, cb: (err: Error | null, dest: string) => void) => {
          cb(null, '/tmp');
        },
        filename: (_req: Request, file: Express.Multer.File, cb: (err: Error | null, filename: string) => void) => {
          const ext = path.extname(file.originalname).toLowerCase() || '.xlsx';
          cb(null, `bulk_import_${randomUUID()}${ext}`);
        },
      }),
      // biome-ignore lint/suspicious/noExplicitAny: multer fileFilter cb type varies by version
      fileFilter: (_req: Request, file: Express.Multer.File, cb: any) => {
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
    @UploadedFile() file: Express.Multer.File & { path: string },
  ) {
    if (!file) {
      throw new BadRequestException('No file provided. Upload a .xlsx or .zip file.');
    }

    const subdomain = req.tenantContext?.subdomain;
    if (!subdomain || subdomain === 'root' || subdomain === 'system') {
      await fsp.rm(file.path, { force: true }).catch(() => undefined);
      throw new BadRequestException('Invalid tenant context');
    }

    const isZip = file.originalname.toLowerCase().endsWith('.zip');
    const jobId = randomUUID();

    const job = await this.importQueue.add(
      'product-import',
      {
        tenantId: req.user.tenantId,
        schemaName: `tenant_${subdomain.toLowerCase().replace(/[^a-z0-9]/g, '')}`,
        subdomain,
        filePath: file.path,
        isZip,
        jobId,
      },
      {
        jobId,
        attempts: 1,
        removeOnComplete: false,
        removeOnFail: false,
      }
    );

    this.logger.log(`[BulkImport] Queued job ${job.id} for tenant ${req.user.tenantId}`);

    return {
      jobId: job.id,
      status: 'queued',
      filename: file.originalname,
      message: `File received. Processing ${isZip ? 'ZIP archive' : 'Excel sheet'}.`,
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
}
