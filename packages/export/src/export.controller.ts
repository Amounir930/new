/**
 * Export Controller
 * REST API for tenant data export
 * Protected by authentication and rate limiting
 */

// biome-ignore lint/style/useImportType: Dependency Injection requires value import (S1-S15 Compliance)
import { AuditLog, AuditService } from '@apex/audit';
import { JwtAuthGuard, SuperAdminGuard } from '@apex/auth';
import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  NotFoundException,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { ZodValidationPipe } from 'nestjs-zod';
import { z } from 'zod';
// biome-ignore lint/style/useImportType: Dependency Injection requires value import (S1-S15 Compliance)
import { ExportService } from './export.service';
// biome-ignore lint/style/useImportType: Dependency Injection requires value import (S1-S15 Compliance)
import { ExportWorker } from './export.worker';
import type { ExportJob, ExportProfile } from './types';

const CreateExportSchema = z.object({
  profile: z.string() as z.ZodType<ExportProfile>,
  includeAssets: z.boolean().optional(),
  dateRange: z
    .object({
      from: z.string(),
      to: z.string(),
    })
    .optional(),
});

type CreateExportDto = z.infer<typeof CreateExportSchema>;

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    tenantId: string;
    role: string;
  };
}

@Controller('tenant/export')
@UseGuards(JwtAuthGuard)
export class ExportController {
  constructor(
    private readonly exportService: ExportService,
    private readonly exportWorker: ExportWorker,
    @Inject('AUDIT_SERVICE') readonly _audit: AuditService
  ) {}

  /**
   * POST /api/v1/tenant/export
   * Request a new data export
   */
  @AuditLog({ action: 'EXPORT_REQUESTED', entityType: 'export' })
  @UseGuards(SuperAdminGuard)
  @Post()
  @HttpCode(HttpStatus.ACCEPTED)
  async createExport(
    @Body(ZodValidationPipe) dto: CreateExportDto,
    @Req() req: AuthenticatedRequest
  ): Promise<{ message: string; job: ExportJob }> {
    const user = req.user;
    if (!user) {
      throw new ForbiddenException('Authentication required');
    }

    // Only admins can export
    if (user.role !== 'admin' && user.role !== 'super_admin') {
      throw new ForbiddenException('Admin access required');
    }

    const job = await this.exportService.createExportJob({
      tenantId: user.tenantId,
      profile: dto.profile,
      requestedBy: user.id,
      includeAssets: dto.includeAssets,
      dateRange: dto.dateRange
        ? {
            from: new Date(dto.dateRange.from),
            to: new Date(dto.dateRange.to),
          }
        : undefined,
    });

    return {
      message: 'Export job created successfully',
      job,
    };
  }

  /**
   * GET /api/v1/tenant/export/:id/status
   * Check export job status
   */
  @Get(':id/status')
  async getStatus(
    @Param('id') jobId: string,
    @Req() req: AuthenticatedRequest
  ): Promise<ExportJob> {
    const user = req.user;
    if (!user) {
      throw new ForbiddenException('Authentication required');
    }

    const job = await this.exportService.getJobStatus(jobId);
    if (!job) {
      throw new NotFoundException('Export job not found');
    }

    // Verify tenant access
    if (job.tenantId !== user.tenantId && user.role !== 'super_admin') {
      throw new ForbiddenException('Access denied');
    }

    return job;
  }

  /**
   * GET /api/v1/tenant/export/jobs
   * List all export jobs for tenant
   */
  @Get('jobs')
  async listJobs(@Req() req: AuthenticatedRequest): Promise<ExportJob[]> {
    const user = req.user;
    if (!user) {
      throw new ForbiddenException('Authentication required');
    }

    return this.exportService.listTenantExports(user.tenantId);
  }

  /**
   * POST /api/v1/tenant/export/:id/confirm-download
   * Confirm successful download and delete file immediately
   */
  @AuditLog({ action: 'EXPORT_DOWNLOAD_CONFIRMED', entityType: 'export' })
  @Post(':id/confirm-download')
  @HttpCode(HttpStatus.OK)
  async confirmDownload(
    @Param('id') jobId: string,
    @Req() req: AuthenticatedRequest
  ): Promise<{ message: string }> {
    const user = req.user;
    if (!user) {
      throw new ForbiddenException('Authentication required');
    }

    // Get job to verify ownership
    const job = await this.exportService.getJobStatus(jobId);
    if (!job) {
      throw new NotFoundException('Export job not found');
    }

    if (job.tenantId !== user.tenantId && user.role !== 'super_admin') {
      throw new ForbiddenException('Access denied');
    }

    await this.exportWorker.confirmDownload(jobId);

    return { message: 'Download confirmed and file deleted successfully' };
  }

  /**
   * DELETE /api/v1/tenant/export/:id
   * Cancel a pending export job
   */
  @AuditLog({ action: 'EXPORT_CANCELLED', entityType: 'export' })
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async cancelJob(
    @Param('id') jobId: string,
    @Req() req: AuthenticatedRequest
  ): Promise<{ message: string }> {
    const user = req.user;
    if (!user) {
      throw new ForbiddenException('Authentication required');
    }

    // Get job to verify ownership
    const job = await this.exportService.getJobStatus(jobId);
    if (!job) {
      throw new NotFoundException('Export job not found');
    }

    if (job.tenantId !== user.tenantId && user.role !== 'super_admin') {
      throw new ForbiddenException('Access denied');
    }

    const cancelled = await this.exportService.cancelJob(jobId);
    if (!cancelled) {
      return {
        message: 'Job cannot be cancelled (already processing or completed)',
      };
    }

    return { message: 'Export job cancelled successfully' };
  }
}
