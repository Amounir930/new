/**
 * @apex/middleware
 * S1-S8 Security Protocols Implementation
 */

// S3: Input Validation (Audit Schema)
export {
  type AuditLogDto,
  AuditLogSchema,
  type CreateAuditLogDto,
  CreateAuditLogSchema,
} from './audit.schema.js';
// S2: Tenant Resolution & Context Management
export {
  getCurrentTenantContext,
  getCurrentTenantId,
  getTenantContext,
  hasTenantContext,
  requireTenantContext,
  runWithTenantContext,
  type TenantContext,
  tenantStorage,
} from './connection-context.js';
// S5: Global Exception Filter
export {
  AuthenticationError,
  AuthorizationError,
  type ErrorResponse,
  GlobalExceptionFilter,
  OperationalError,
  TenantIsolationError,
  ValidationError,
} from './exception-filter.js';
// S6: Rate Limiting
export {
  RATE_LIMIT_KEY,
  RateLimit,
  type RateLimitConfig,
  RateLimitGuard,
  ThrottleConfig,
} from './rate-limit.js';
// S8: Security Headers & CORS
export {
  type CorsConfig,
  CsrfGuard,
  CsrfProtection,
  defaultCorsConfig,
  getTenantCorsConfig,
  helmetConfig,
  SecurityHeadersMiddleware,
  securityHeaders,
} from './security.js';
// S2: Tenant Isolation Middleware
export {
  SuperAdminOrTenantGuard,
  TenantIsolationMiddleware,
  type TenantRequest,
  TenantScopedGuard,
} from './tenant-isolation.middleware.js';

// Tenant Resolution
export {
  extractTenantFromHeader,
  extractTenantFromHost,
  extractTenantFromJWT,
  resolveTenant,
  type TenantResolutionStrategy,
} from './tenant-resolution.js';
