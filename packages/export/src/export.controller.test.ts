/**
 * Export Controller Tests
 * Verifies REST API endpoints and authorization
 */

import { beforeEach, describe, expect, it, mock } from 'bun:test';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { ExportController } from './export.controller.js';
import type { ExportService } from './export.service.js';
import type { ExportWorker } from './export.worker.js';

describe('ExportController', () => {
  let controller: ExportController;
  let mockService: ExportService;
  let mockWorker: ExportWorker;

  beforeEach(() => {
    mockService = {
      createExportJob: mock(),
      getJobStatus: mock(),
      listTenantExports: mock(),
      cancelJob: mock(),
    } as any;

    mockWorker = {
      confirmDownload: mock(),
    } as any;

    controller = new ExportController(mockService, mockWorker);
  });

  describe('createExport', () => {
    it('should create export for admin user', async () => {
      const mockJob = {
        id: 'job-123',
        tenantId: 'tenant-123',
        profile: 'lite' as const,
        requestedBy: 'user-456',
        requestedAt: new Date(),
        status: 'pending' as const,
      };

      (mockService.createExportJob as any).mockResolvedValue(mockJob);

      const req = {
        user: {
          id: 'user-456',
          tenantId: 'tenant-123',
          role: 'admin',
        },
      } as any;

      const result = await controller.createExport(
        { profile: 'lite', includeAssets: true },
        req
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
      const req = { user: undefined } as any;

      await expect(
        controller.createExport({ profile: 'lite' }, req)
      ).rejects.toThrow(ForbiddenException);
    });

    it('should reject non-admin user', async () => {
      const req = {
        user: {
          id: 'user-456',
          tenantId: 'tenant-123',
          role: 'user',
        },
      } as any;

      await expect(
        controller.createExport({ profile: 'lite' }, req)
      ).rejects.toThrow(ForbiddenException);
    });

    it('should accept super_admin role', async () => {
      const mockJob = {
        id: 'job-123',
        tenantId: 'tenant-123',
        profile: 'lite' as const,
        requestedBy: 'super-admin',
        requestedAt: new Date(),
        status: 'pending' as const,
      };

      (mockService.createExportJob as any).mockResolvedValue(mockJob);

      const req = {
        user: {
          id: 'super-admin',
          tenantId: 'tenant-123',
          role: 'super_admin',
        },
      } as any;

      const result = await controller.createExport({ profile: 'lite' }, req);
      expect(result.job).toBeDefined();
    });

    it('should handle date range for analytics export', async () => {
      const mockJob = {
        id: 'job-123',
        tenantId: 'tenant-123',
        profile: 'analytics' as const,
        requestedBy: 'user-456',
        requestedAt: new Date(),
        status: 'pending' as const,
      };

      (mockService.createExportJob as any).mockResolvedValue(mockJob);

      const req = {
        user: {
          id: 'user-456',
          tenantId: 'tenant-123',
          role: 'admin',
        },
      } as any;

      await controller.createExport(
        {
          profile: 'analytics',
          dateRange: { from: '2026-01-01', to: '2026-01-31' },
        },
        req
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
      const mockJob = {
        id: 'job-123',
        tenantId: 'tenant-123',
        profile: 'lite' as const,
        requestedBy: 'user-456',
        requestedAt: new Date(),
        status: 'processing' as const,
      };

      (mockService.getJobStatus as any).mockResolvedValue(mockJob);

      const req = {
        user: {
          id: 'user-456',
          tenantId: 'tenant-123',
          role: 'admin',
        },
      } as any;

      const result = await controller.getStatus('job-123', req);
      expect(result).toEqual(mockJob);
    });

    it('should throw NotFoundException for non-existent job', async () => {
      (mockService.getJobStatus as any).mockResolvedValue(null);

      const req = {
        user: {
          id: 'user-456',
          tenantId: 'tenant-123',
          role: 'admin',
        },
      } as any;

      await expect(controller.getStatus('non-existent', req)).rejects.toThrow(
        NotFoundException
      );
    });

    it('should deny access to other tenant job', async () => {
      const mockJob = {
        id: 'job-123',
        tenantId: 'tenant-456',
        profile: 'lite' as const,
        requestedBy: 'user-789',
        requestedAt: new Date(),
        status: 'completed' as const,
      };

      (mockService.getJobStatus as any).mockResolvedValue(mockJob);

      const req = {
        user: {
          id: 'user-456',
          tenantId: 'tenant-123',
          role: 'admin',
        },
      } as any;

      await expect(controller.getStatus('job-123', req)).rejects.toThrow(
        ForbiddenException
      );
    });

    it('should allow super_admin to access any tenant job', async () => {
      const mockJob = {
        id: 'job-123',
        tenantId: 'tenant-456',
        profile: 'lite' as const,
        requestedBy: 'user-789',
        requestedAt: new Date(),
        status: 'completed' as const,
      };

      (mockService.getJobStatus as any).mockResolvedValue(mockJob);

      const req = {
        user: {
          id: 'super-admin',
          tenantId: 'tenant-123',
          role: 'super_admin',
        },
      } as any;

      const result = await controller.getStatus('job-123', req);
      expect(result).toEqual(mockJob);
    });
  });

  describe('confirmDownload', () => {
    it('should confirm download and delete file', async () => {
      const mockJob = {
        id: 'job-123',
        tenantId: 'tenant-123',
        profile: 'lite' as const,
        requestedBy: 'user-456',
        requestedAt: new Date(),
        status: 'completed' as const,
      };

      (mockService.getJobStatus as any).mockResolvedValue(mockJob);
      (mockWorker.confirmDownload as any).mockResolvedValue(undefined);

      const req = {
        user: {
          id: 'user-456',
          tenantId: 'tenant-123',
          role: 'admin',
        },
      } as any;

      const result = await controller.confirmDownload('job-123', req);

      expect(result.message).toBe(
        'Download confirmed and file deleted successfully'
      );
      expect(mockWorker.confirmDownload).toHaveBeenCalledWith('job-123');
    });

    it('should deny confirm for other tenant', async () => {
      const mockJob = {
        id: 'job-123',
        tenantId: 'tenant-456',
        profile: 'lite' as const,
        requestedBy: 'user-789',
        requestedAt: new Date(),
        status: 'completed' as const,
      };

      (mockService.getJobStatus as any).mockResolvedValue(mockJob);

      const req = {
        user: {
          id: 'user-456',
          tenantId: 'tenant-123',
          role: 'admin',
        },
      } as any;

      await expect(controller.confirmDownload('job-123', req)).rejects.toThrow(
        ForbiddenException
      );
    });
  });

  describe('cancelJob', () => {
    it('should cancel job successfully', async () => {
      const mockJob = {
        id: 'job-123',
        tenantId: 'tenant-123',
        profile: 'lite' as const,
        requestedBy: 'user-456',
        requestedAt: new Date(),
        status: 'pending' as const,
      };

      (mockService.getJobStatus as any).mockResolvedValue(mockJob);
      (mockService.cancelJob as any).mockResolvedValue(true);

      const req = {
        user: {
          id: 'user-456',
          tenantId: 'tenant-123',
          role: 'admin',
        },
      } as any;

      const result = await controller.cancelJob('job-123', req);

      expect(result.message).toBe('Export job cancelled successfully');
      expect(mockService.cancelJob).toHaveBeenCalledWith('job-123');
    });

    it('should handle already completed job', async () => {
      const mockJob = {
        id: 'job-123',
        tenantId: 'tenant-123',
        profile: 'lite' as const,
        requestedBy: 'user-456',
        requestedAt: new Date(),
        status: 'completed' as const,
      };

      (mockService.getJobStatus as any).mockResolvedValue(mockJob);
      (mockService.cancelJob as any).mockResolvedValue(false);

      const req = {
        user: {
          id: 'user-456',
          tenantId: 'tenant-123',
          role: 'admin',
        },
      } as any;

      const result = await controller.cancelJob('job-123', req);

      expect(result.message).toContain('cannot be cancelled');
    });
  });

  describe('listJobs', () => {
    it('should list all jobs for tenant', async () => {
      const mockJobs = [
        {
          id: 'job-1',
          tenantId: 'tenant-123',
          profile: 'lite' as const,
          requestedBy: 'user-456',
          requestedAt: new Date(),
          status: 'completed' as const,
        },
        {
          id: 'job-2',
          tenantId: 'tenant-123',
          profile: 'native' as const,
          requestedBy: 'user-456',
          requestedAt: new Date(),
          status: 'pending' as const,
        },
      ];

      (mockService.listTenantExports as any).mockResolvedValue(mockJobs);

      const req = {
        user: {
          id: 'user-456',
          tenantId: 'tenant-123',
          role: 'admin',
        },
      } as any;

      const result = await controller.listJobs(req);

      expect(result).toEqual(mockJobs);
      expect(mockService.listTenantExports).toHaveBeenCalledWith('tenant-123');
    });
  });
});
