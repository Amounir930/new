/**
 * @apex/middleware
 * S1-S8 Security Protocols Implementation
 */
export { type AuditLogDto, AuditLogSchema, type CreateAuditLogDto, CreateAuditLogSchema, } from './audit.schema.js';
export { getCurrentTenantContext, getCurrentTenantId, getTenantContext, hasTenantContext, requireTenantContext, runWithTenantContext, type TenantContext, tenantStorage, } from './connection-context.js';
export { AuthenticationError, AuthorizationError, type ErrorResponse, GlobalExceptionFilter, OperationalError, TenantIsolationError, ValidationError, } from './exception-filter.js';
export { GovernanceGuard, RequireFeature } from './governance.guard.js';
export { CheckQuota, QuotaInterceptor } from './quota.interceptor.js';
export { RATE_LIMIT_KEY, RateLimit, type RateLimitConfig, RateLimitGuard, RateLimitModule, ThrottleConfig, } from './rate-limit.js';
export { type CorsConfig, CsrfGuard, CsrfProtection, defaultCorsConfig, getTenantCorsConfig, helmetConfig, SecurityHeadersMiddleware, securityHeaders, } from './security.js';
export { SuperAdminOrTenantGuard, TenantIsolationMiddleware, type TenantRequest, TenantScopedGuard, } from './tenant-isolation.middleware.js';
export { extractTenantFromHeader, extractTenantFromHost, extractTenantFromJWT, resolveTenant, type TenantResolutionStrategy, } from './tenant-resolution.js';
//# sourceMappingURL=index.d.ts.map