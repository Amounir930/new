import { tenantStorage } from './connection-context.js';
// Note: We will integrate actual DB lookup later. For now, strict types and structure.
export async function resolveTenant(req, _res, next) {
    const host = req.headers.host || '';
    const subdomain = extractSubdomain(host);
    if (!subdomain) {
        // No subdomain means we are likely on the marketing site or main domain
        // We do NOT enter tenant storage context here.
        return next();
    }
    // TODO: Real DB Lookup will go here in the next step
    // const tenant = await db.query.tenants.findFirst(...)
    // MOCK for scaffolding - TO BE REPLACED WITH DB CALL
    const mockTenant = {
        id: 'mock-tenant-id',
        subdomain: subdomain,
        plan: 'basic',
        enabledFeatures: [],
    };
    // Attach context
    tenantStorage.run({
        tenantId: mockTenant.id,
        subdomain: mockTenant.subdomain,
        plan: mockTenant.plan,
        features: mockTenant.enabledFeatures,
        createdAt: new Date(),
        schemaName: `tenant_${mockTenant.subdomain}`,
        isActive: true,
    }, () => {
        next();
    });
}
/**
 * Extracts subdomain from host header.
 * Handles:
 * - tenant.apex.com -> tenant
 * - tenant.localhost:3000 -> tenant
 * - apex.com -> null
 * - www.apex.com -> null (reserved)
 */
export function extractSubdomain(host) {
    const parts = host.split('.');
    // Localhost development: tenant.localhost:3000
    if (host.includes('localhost')) {
        if (parts.length < 2 || parts[0] === 'localhost')
            return null;
        return parts[0];
    }
    // Production: tenant.apex.com
    if (parts.length >= 3) {
        const subdomain = parts[0];
        if (['www', 'api', 'admin', 'mail'].includes(subdomain))
            return null;
        return subdomain;
    }
    return null;
}
export function extractTenantFromHost(host) {
    return extractSubdomain(host);
}
export function extractTenantFromHeader(req) {
    const tenantHeader = req.headers['x-tenant-id'];
    return typeof tenantHeader === 'string' ? tenantHeader : null;
}
export function extractTenantFromJWT(_req) {
    // JWT extraction would be implemented here
    // For now, return null as placeholder
    return null;
}
//# sourceMappingURL=tenant-resolution.js.map