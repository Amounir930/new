/**
 * S2: Tenant Isolation Middleware
 * Constitution Reference: architecture.md (S2 Protocol)
 * Purpose: Extract tenant from subdomain and enforce schema isolation
 */
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { publicDb, tenants } from '@apex/db';
import { Injectable, UnauthorizedException, } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { tenantStorage } from './connection-context.js';
/**
 * Extracts tenant ID from subdomain
 * e.g., alpha.apex.localhost -> alpha
 */
function extractSubdomain(host) {
    // Remove port if present
    const hostname = host.split(':')[0];
    // Localhost development
    if (hostname.includes('localhost')) {
        const parts = hostname.split('.');
        if (parts.length > 2 && parts[0] !== 'www') {
            return parts[0];
        }
        return null; // Root domain
    }
    // Production
    const parts = hostname.split('.');
    if (parts.length >= 3) {
        return parts[0];
    }
    return null;
}
/**
 * Validates tenant exists and is active
 * CRITICAL FIX (S2): Replaced mock data with real DB query
 */
async function validateTenant(subdomain) {
    try {
        // Query database for tenant
        const result = await publicDb
            .select({
            id: tenants.id,
            subdomain: tenants.subdomain,
            plan: tenants.plan,
            status: tenants.status,
        })
            .from(tenants)
            .where(eq(tenants.subdomain, subdomain))
            .limit(1);
        if (result.length === 0) {
            throw new UnauthorizedException('Tenant not found');
        }
        const tenant = result[0];
        // Check tenant status
        if (tenant.status === 'suspended') {
            throw new UnauthorizedException('Tenant is suspended');
        }
        if (tenant.status !== 'active') {
            throw new UnauthorizedException('Tenant is not active');
        }
        return {
            tenantId: tenant.id,
            schemaName: `tenant_${tenant.subdomain.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
            subdomain: tenant.subdomain,
            plan: tenant.plan,
            isActive: true,
            features: [],
            createdAt: new Date(),
        };
    }
    catch (error) {
        // If it's already an UnauthorizedException, re-throw it
        if (error instanceof UnauthorizedException) {
            throw error;
        }
        // Log the error but don't expose internal details
        console.error(`S2 Error validating tenant ${subdomain}:`, error);
        throw new UnauthorizedException('Tenant validation failed');
    }
}
let TenantIsolationMiddleware = class TenantIsolationMiddleware {
    async use(req, res, next) {
        const host = req.headers.host || '';
        const subdomain = extractSubdomain(host);
        if (!subdomain ||
            ['api', 'super-admin', 'www'].includes(subdomain.toLowerCase())) {
            // Allow root domain and system subdomains
            return next();
        }
        // S2/S4 Bypass: Specific routes that don't require tenant isolation
        // e.g., provisioning a new tenant or system health checks
        // We use originalUrl to ensure we see the full path before NestJS routing shifts it
        const bypassRoutes = ['/api/provision', '/health', '/api/health'];
        const currentPath = req.originalUrl || req.path || '';
        if (bypassRoutes.some((route) => currentPath.includes(route))) {
            return next();
        }
        try {
            const tenantContext = await validateTenant(subdomain);
            // Store in AsyncLocalStorage for downstream access
            tenantStorage.run(tenantContext, () => {
                req.tenantContext = tenantContext;
                // Set PostgreSQL search_path for this request
                // This ensures all queries go to tenant schema
                res.setHeader('X-Tenant-ID', tenantContext.tenantId);
                res.setHeader('X-Tenant-Schema', tenantContext.schemaName);
                next();
            });
        }
        catch (_error) {
            throw new UnauthorizedException(`Invalid tenant: ${subdomain}`);
        }
    }
};
TenantIsolationMiddleware = __decorate([
    Injectable()
], TenantIsolationMiddleware);
export { TenantIsolationMiddleware };
let TenantScopedGuard = class TenantScopedGuard {
    canActivate(context) {
        const request = context.switchToHttp().getRequest();
        if (!request.tenantContext) {
            throw new UnauthorizedException('Tenant context required');
        }
        if (!request.tenantContext.isActive) {
            throw new UnauthorizedException('Tenant is suspended');
        }
        return true;
    }
};
TenantScopedGuard = __decorate([
    Injectable()
], TenantScopedGuard);
export { TenantScopedGuard };
/**
 * Super Admin can access any tenant
 */
let SuperAdminOrTenantGuard = class SuperAdminOrTenantGuard {
    canActivate(context) {
        const request = context.switchToHttp().getRequest();
        const user = request.user;
        // Super admin bypass
        if (user?.role === 'super_admin') {
            return true;
        }
        // Regular tenant check
        if (!request.tenantContext?.isActive) {
            throw new UnauthorizedException('Tenant access denied');
        }
        // Ensure user belongs to this tenant
        if (user?.tenantId !== request.tenantContext.tenantId) {
            throw new UnauthorizedException('Cross-tenant access denied');
        }
        return true;
    }
};
SuperAdminOrTenantGuard = __decorate([
    Injectable()
], SuperAdminOrTenantGuard);
export { SuperAdminOrTenantGuard };
//# sourceMappingURL=tenant-isolation.middleware.js.map