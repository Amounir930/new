import {
  ForbiddenException,
  Injectable,
  type NestMiddleware,
} from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';
// import { GovernanceService } from '@apex/db'; // We'll use a direct injection if possible or assumed available

/**
 * Mandate #27: Export Protection Middleware
 * Prevents unauthorized bulk data exfiltration and logs all export attempts.
 */
@Injectable()
export class ExportProtectionMiddleware implements NestMiddleware {
  async use(req: Request, _res: Response, next: NextFunction) {
    const isExport =
      req.query.format === 'csv' ||
      req.query.format === 'json' ||
      req.path.includes('/export');

    if (isExport) {
      const user = (req as any).user;

      // 1. Enforce Admin-Only Access (Mandate #27)
      if (!user || (user.role !== 'admin' && user.role !== 'super_admin')) {
        throw new ForbiddenException(
          'S1 Violation: Bulk export restricted to administrative accounts.'
        );
      }

      // 2. Log Export Attempt to Audit Logs (Mandate #27)
      console.log(
        `[AUDIT] Export Attempt - User: ${user.email}, Resource: ${req.path}, Format: ${req.query.format}`
      );

      // Note: In a full implementation, we would call platformAuditLogs.insert here.
      // Since this is middleware, we might attach a flag for the AuditInterceptor to pick up.
      (req as any).auditMetadata = {
        ...(req as any).auditMetadata,
        action: 'EXPORT',
        entityType: 'DATA_BULK',
        metadata: {
          format: req.query.format,
          path: req.path,
          query: req.query,
        },
      };
    }

    next();
  }
}
