/**
 * Export Controller Tests
 * Verifies REST API endpoints and authorization
 */

import { beforeEach, describe, expect, it } from 'bun:test';
import type { AuditService } from '@apex/audit';
import { type Mocked, MockFactory } from '@apex/test-utils';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import type { Request } from 'express';
import { ExportController } from './export.controller';
import type { ExportService } from './export.service';
import type { ExportWorker } from './export.worker';
import type { ExportJob } from './types';

interface AuthenticatedRequest {
  user?: {
    id: string;
    tenantId: string;
    role: string;
  };
}

describe('ExportController', () => {
  let controller: ExportController;
  let mockService: Mocked<ExportService>;
  let mockWorker: Mocked<ExportWorker>;
  let mockAudit: Mocked<AuditService>;

  beforeEach(() => {
    mockService = MockFactory.createExportService();
    mockWorker = MockFactory.createExportWorker();
    mockAudit = MockFactory.createAuditService();
    controller = new ExportController(mockService, mockWorker, mockAudit);
  });

  describe('createExport', () => {
    it('should create export for admin user', async () => {
      const mockJob: ExportJob = {
        id: 'job-123',
        tenantId: 'tenant-123',
        profile: 'lite',
        requestedBy: 'user-456',
        requestedAt: new Date(),
        status: 'pending',
      };

      mockService.createExportJob.mockResolvedValue(mockJob);

      const req: AuthenticatedRequest = {
        user: {
          id: 'user-456',
          tenantId: 'tenant-123',
          role: 'admin',
        },
      };

      const isReq = (r: unknown): r is Request => true;
      const result = await controller.createExport(
        { profile: 'lite', includeAssets: true },
        isReq(req) ? req : (req as any)
      );

      expect(result.message).toBe('Export job created successfully');
      expect(result.job).toEqual(mockJob);
      expect(mockService.createExportJob).toHaveBeenCalledWith({
        tenantId: 'tenant-123',
        profile: 'lite',
        requestedBy: 'user-456',
        includeAssets: true,
        dateRange: undefined,
      });
    });

    it('should reject unauthenticated request', async () => {
      const req: AuthenticatedRequest = { user: undefined };

      await expect(
        controller.createExport({ profile: 'lite' }, req as unknown as Request)
      ).rejects.toThrow(ForbiddenException);
    });

    it('should reject non-admin user', async () => {
      const req: AuthenticatedRequest = {
        user: {
          id: 'user-456',
          tenantId: 'tenant-123',
          role: 'user',
        },
      };

      await expect(
        controller.createExport({ profile: 'lite' }, req as unknown as Request)
      ).rejects.toThrow(ForbiddenException);
    });

    it('should accept super_admin role', async () => {
      const mockJob: ExportJob = {
        id: 'job-123',
        tenantId: 'tenant-123',
        profile: 'lite',
        requestedBy: 'super-admin',
        requestedAt: new Date(),
        status: 'pending',
      };

      mockService.createExportJob.mockResolvedValue(mockJob);

      const req: AuthenticatedRequest = {
        user: {
          id: 'super-admin',
          tenantId: 'tenant-123',
          role: 'super_admin',
        },
      };

      const isReq = (r: unknown): r is Request => true;
      const result = await controller.createExport(
        { profile: 'lite' },
        isReq(req) ? req : (req as any)
      );
      expect(result.job).toBeDefined();
    });

    it('should handle date range for analytics export', async () => {
      const mockJob: ExportJob = {
        id: 'job-123',
        tenantId: 'tenant-123',
        profile: 'analytics',
        requestedBy: 'user-456',
        requestedAt: new Date(),
        status: 'pending',
      };

      mockService.createExportJob.mockResolvedValue(mockJob);

      const req: AuthenticatedRequest = {
        user: {
          id: 'user-456',
          tenantId: 'tenant-123',
          role: 'admin',
        },
      };

      const isReq = (r: unknown): r is Request => true;
      await controller.createExport(
        {
          profile: 'analytics',
          dateRange: { from: '2026-01-01', to: '2026-01-31' },
        },
        isReq(req) ? req : (req as any)
      );

      expect(mockService.createExportJob).toHaveBeenCalledWith(
        expect.objectContaining({
          dateRange: {
            from: new Date('2026-01-01'),
            to: new Date('2026-01-31'),
          },
        })
      );
    });
  });

  describe('getStatus', () => {
    it('should return job status for authorized user', async () => {
      const mockJob: ExportJob = {
        id: 'job-123',
        tenantId: 'tenant-123',
        profile: 'lite',
        requestedBy: 'user-456',
        requestedAt: new Date(),
        status: 'processing',
      };

      mockService.getJobStatus.mockResolvedValue(mockJob);

      const req: AuthenticatedRequest = {
        user: {
          id: 'user-456',
          tenantId: 'tenant-123',
          role: 'admin',
        },
      };

      const result = await controller.getStatus(
        'job-123',
        req as unknown as Request
      );
      expect(result).toEqual(mockJob);
    });

    it('should throw NotFoundException for non-existent job', async () => {
      mockService.getJobStatus.mockResolvedValue(null);

      const req: AuthenticatedRequest = {
        user: {
          id: 'user-456',
          tenantId: 'tenant-123',
          role: 'admin',
        },
      };

      const isReq = (r: unknown): r is Request => true;
      await expect(
        controller.getStatus('non-existent', isReq(req) ? req : (req as any))
      ).rejects.toThrow(NotFoundException);
    });

    it('should deny access to other tenant job', async () => {
      const mockJob: ExportJob = {
        id: 'job-123',
        tenantId: 'tenant-456',
        profile: 'lite',
        requestedBy: 'user-789',
        requestedAt: new Date(),
        status: 'completed',
      };

      mockService.getJobStatus.mockResolvedValue(mockJob);

      const req: AuthenticatedRequest = {
        user: {
          id: 'user-456',
          tenantId: 'tenant-123',
          role: 'admin',
        },
      };

      const isReq = (r: unknown): r is Request => true;
      await expect(
        controller.getStatus('job-123', isReq(req) ? req : (req as any))
      ).rejects.toThrow(ForbiddenException);
    });

    it('should allow super_admin to access all tenant jobs', async () => {
      const mockJob: ExportJob = {
        id: 'job-123',
        tenantId: 'tenant-456',
        profile: 'lite',
        requestedBy: 'user-789',
        requestedAt: new Date(),
        status: 'completed',
      };

      mockService.getJobStatus.mockResolvedValue(mockJob);

      const req: AuthenticatedRequest = {
        user: {
          id: 'super-admin',
          tenantId: 'tenant-123',
          role: 'super_admin',
        },
      };

      const result = await controller.getStatus(
        'job-123',
        req as unknown as Request
      );
      expect(result).toEqual(mockJob);
    });
  });

  describe('confirmDownload', () => {
    it('should confirm download and delete file', async () => {
      const mockJob: ExportJob = {
        id: 'job-123',
        tenantId: 'tenant-123',
        profile: 'lite',
        requestedBy: 'user-456',
        requestedAt: new Date(),
        status: 'completed',
      };

      mockService.getJobStatus.mockResolvedValue(mockJob);
      mockWorker.confirmDownload.mockResolvedValue(undefined);

      const req: AuthenticatedRequest = {
        user: {
          id: 'user-456',
          tenantId: 'tenant-123',
          role: 'admin',
        },
      };

      const isReq = (r: unknown): r is Request => true;
      const result = await controller.confirmDownload(
        'job-123',
        isReq(req) ? req : (req as any)
      );

      expect(result.message).toBe(
        'Download confirmed and file deleted successfully'
      );
      expect(mockWorker.confirmDownload).toHaveBeenCalledWith('job-123');
    });

    it('should deny confirm for other tenant', async () => {
      const mockJob: ExportJob = {
        id: 'job-123',
        tenantId: 'tenant-456',
        profile: 'lite',
        requestedBy: 'user-789',
        requestedAt: new Date(),
        status: 'completed',
      };

      mockService.getJobStatus.mockResolvedValue(mockJob);

      const req: AuthenticatedRequest = {
        user: {
          id: 'user-456',
          tenantId: 'tenant-123',
          role: 'admin',
        },
      };

      const isReq = (r: unknown): r is Request => true;
      await expect(
        controller.confirmDownload('job-123', isReq(req) ? req : (req as any))
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('cancelJob', () => {
    it('should cancel job successfully', async () => {
      const mockJob: ExportJob = {
        id: 'job-123',
        tenantId: 'tenant-123',
        profile: 'lite',
        requestedBy: 'user-456',
        requestedAt: new Date(),
        status: 'pending',
      };

      mockService.getJobStatus.mockResolvedValue(mockJob);
      mockService.cancelJob.mockResolvedValue(true);

      const req: AuthenticatedRequest = {
        user: {
          id: 'user-456',
          tenantId: 'tenant-123',
          role: 'admin',
        },
      };

      const result = await controller.cancelJob(
        'job-123',
        req as unknown as Request
      );

      expect(result.message).toBe('Export job cancelled successfully');
      expect(mockService.cancelJob).toHaveBeenCalledWith('job-123');
    });

    it('should handle already completed job', async () => {
      const mockJob: ExportJob = {
        id: 'job-123',
        tenantId: 'tenant-123',
        profile: 'lite',
        requestedBy: 'user-456',
        requestedAt: new Date(),
        status: 'completed',
      };

      mockService.getJobStatus.mockResolvedValue(mockJob);
      mockService.cancelJob.mockResolvedValue(false);

      const req: AuthenticatedRequest = {
        user: {
          id: 'user-456',
          tenantId: 'tenant-123',
          role: 'admin',
        },
      };

      const result = await controller.cancelJob(
        'job-123',
        req as unknown as Request
      );

      expect(result.message).toContain('cannot be cancelled');
    });
  });

  describe('listJobs', () => {
    it('should list all jobs for tenant', async () => {
      const mockJobs: ExportJob[] = [
        {
          id: 'job-1',
          tenantId: 'tenant-123',
          profile: 'lite',
          requestedBy: 'user-456',
          requestedAt: new Date(),
          status: 'completed',
        },
        {
          id: 'job-2',
          tenantId: 'tenant-123',
          profile: 'native',
          requestedBy: 'user-456',
          requestedAt: new Date(),
          status: 'pending',
        },
      ];

      mockService.listTenantExports.mockResolvedValue(mockJobs);

      const req: AuthenticatedRequest = {
        user: {
          id: 'user-456',
          tenantId: 'tenant-123',
          role: 'admin',
        },
      };

      const isReq = (r: unknown): r is Request => true;
      const result = await controller.listJobs(isReq(req) ? req : (req as any));

      expect(result).toEqual(mockJobs);
      expect(mockService.listTenantExports).toHaveBeenCalledWith('tenant-123');
    });
  });
});
