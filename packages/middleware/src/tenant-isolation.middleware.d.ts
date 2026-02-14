/**
 * S2: Tenant Isolation Middleware
 * Constitution Reference: architecture.md (S2 Protocol)
 * Purpose: Extract tenant from subdomain and enforce schema isolation
 */
import { type NestMiddleware } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';
import { type TenantContext } from './connection-context.js';
export interface TenantRequest extends Request {
    tenantContext?: TenantContext;
}
export declare class TenantIsolationMiddleware implements NestMiddleware {
    use(req: TenantRequest, res: Response, next: NextFunction): Promise<void>;
}
/**
 * NestJS Guard for Tenant Access Control
 */
import type { CanActivate, ExecutionContext } from '@nestjs/common';
export declare class TenantScopedGuard implements CanActivate {
    canActivate(context: ExecutionContext): boolean;
}
/**
 * Super Admin can access any tenant
 */
export declare class SuperAdminOrTenantGuard implements CanActivate {
    canActivate(context: ExecutionContext): boolean;
}
declare global {
    namespace Express {
        interface Request {
            user?: any;
        }
    }
}
//# sourceMappingURL=tenant-isolation.middleware.d.ts.map