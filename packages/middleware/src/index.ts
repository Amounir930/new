/**
 * @apex/middleware
 * S1-S8 Security Protocols Implementation
 */

// S15: Active Defense
export { ActiveDefenseMiddleware } from './active-defense.middleware.js';
// S3: Input Validation (Audit Schema)
export {
  type AuditLogDto,
  AuditLogSchema,
  type CreateAuditLogDto,
  CreateAuditLogSchema,
} from './audit.schema.js';
// S11: Bot Protection
export { BotProtectionMiddleware } from './bot-protection.js';
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
// S4: Database Security
export * from './db-security.interceptor.js';
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
// S14: Fraud Detection
export { FingerprintMiddleware } from './fingerprint.js';
export { FraudGuard } from './fraud.guard.js';
export {
  type FraudScore,
  FraudScoringService,
} from './fraud-scoring.service.js';
export { GeoIpService } from './geo-ip.service.js';
// Governance & Quotas
export { GovernanceGuard, RequireFeature } from './governance.guard.js';
export { HCaptchaService } from './hcaptcha.service.js';
export { OTPService } from './otp.service.js';
export { CheckQuota, QuotaInterceptor } from './quota.interceptor.js';
// S6: Rate Limiting
export {
  RATE_LIMIT_KEY,
  RateLimit,
  type RateLimitConfig,
  RateLimitGuard,
  RateLimitModule,
  RedisRateLimitStore,
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
export { SecurityService } from './security.service.js';
// S2: Tenant Isolation Middleware
export {
  SuperAdminOrTenantGuard,
  TenantIsolationMiddleware,
  type TenantRequest,
  TenantScopedGuard,
} from './tenant-isolation.middleware.js';
export {
  extractTenantFromHeader,
  extractTenantFromHost,
  extractTenantFromJWT,
  resolveTenant,
  type TenantResolutionStrategy,
} from './tenant-resolution.js';

// Tier 3 Security Support
export { SecretDetectionMiddleware } from './secret-detection.js';
export { TenantEventService, type TenantEvent } from './events.service.js';
