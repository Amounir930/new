import type { NextFunction, Request, Response } from 'express';
export declare function resolveTenant(req: Request, _res: Response, next: NextFunction): Promise<void>;
/**
 * Extracts subdomain from host header.
 * Handles:
 * - tenant.apex.com -> tenant
 * - tenant.localhost:3000 -> tenant
 * - apex.com -> null
 * - www.apex.com -> null (reserved)
 */
export declare function extractSubdomain(host: string): string | null;
export type TenantResolutionStrategy = 'host' | 'header' | 'jwt';
export declare function extractTenantFromHost(host: string): string | null;
export declare function extractTenantFromHeader(req: Request): string | null;
export declare function extractTenantFromJWT(_req: Request): string | null;
//# sourceMappingURL=tenant-resolution.d.ts.map