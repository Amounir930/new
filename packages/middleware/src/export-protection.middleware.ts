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
      const typedReq = req as Request & {
        user?: { role?: string; email?: string };
        auditMetadata?: Record<string, unknown>;
      };
      const user = typedReq.user;

      // 1. Enforce Admin-Only Access (Mandate #27)
      if (!user || (user.role !== 'admin' && user.role !== 'super_admin')) {
        throw new ForbiddenException(
          'S1 Violation: Bulk export restricted to administrative accounts.'
        );
      }

      // 2. Log Export Attempt to Audit Logs (Mandate #27)
      process.stdout.write(
        `[AUDIT] Export Attempt - User: ${user.email}, Resource: ${typedReq.path}, Format: ${typedReq.query.format}`
      );

      // Note: In a full implementation, we would call platformAuditLogs.insert here.
      // Since this is middleware, we might attach a flag for the AuditInterceptor to pick up.
      // Unused variables removed for lint compliance
      typedReq.auditMetadata = {
        ...typedReq.auditMetadata,
        action: 'EXPORT',
        entityType: 'DATA_BULK',
        metadata: {
          format: typedReq.query.format,
          path: typedReq.path,
          query: typedReq.query,
        },
      };
    }

    next();
  }
}
