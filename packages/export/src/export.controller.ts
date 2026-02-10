/**
 * Export Controller
 * REST API for tenant data export
 * Protected by authentication and rate limiting
 */

import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  Post,
  Req,
} from '@nestjs/common';
import type { Request } from 'express';
import { ExportService } from './export.service.js';
import { ExportWorker } from './export.worker.js';
import type { ExportJob, ExportProfile } from './types.js';

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    tenantId: string;
    role: string;
  };
}

class CreateExportDto {
  profile!: ExportProfile;
  includeAssets?: boolean;
  dateRange?: {
    from: string;
    to: string;
  };
}

@Controller('api/v1/tenant/export')
export class ExportController {
  constructor(
    private readonly exportService: ExportService,
    private readonly exportWorker: ExportWorker
  ) {}

  /**
   * POST /api/v1/tenant/export
   * Request a new data export
   */
  @Post()
  @HttpCode(HttpStatus.ACCEPTED)
  async createExport(
    @Body() dto: CreateExportDto,
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
