/**
 * @apex/middleware
 * S1-S8 Security Protocols Implementation
 */

// S15: Active Defense
export { ActiveDefenseMiddleware } from './active-defense.middleware';
// S3: Input Validation (Audit Schema)
export {
  type AuditLogDto,
  AuditLogSchema,
  type CreateAuditLogDto,
  CreateAuditLogSchema,
} from './audit.schema';
// S11: Bot Protection
export { BotProtectionMiddleware } from './bot-protection';
// S2: Tenant Resolution & Context Management
export {
  type DrizzleExecutor,
  getCurrentTenantContext,
  getCurrentTenantId,
  getTenantContext,
  hasTenantContext,
  requireTenantContext,
  runWithTenantContext,
  type TenantContext,
  tenantStorage,
} from './connection-context';
// S4: Database Security
export * from './db-security.interceptor';
export { type TenantEvent, TenantEventService } from './events.service';
// S5: Global Exception Filter
export {
  AuthenticationError,
  AuthorizationError,
  GlobalExceptionFilter,
  OperationalError,
  TenantIsolationError,
  ValidationError,
} from './exception-filter';
// S14: Fraud Detection
export { FingerprintMiddleware } from './fingerprint';
export { FraudGuard } from './fraud.guard';
export {
  type FraudScore,
  FraudScoringService,
} from './fraud-scoring.service';
export { GeoIpService } from './geo-ip.service';
// Governance & Quotas
export { GovernanceGuard, RequireFeature } from './governance.guard';
export { HCaptchaService } from './hcaptcha.service';
export { OTPService } from './otp.service';
export { CheckQuota, QuotaInterceptor } from './quota.interceptor';
// S6: Rate Limiting
export {
  RATE_LIMIT_KEY,
  RateLimit,
  type RateLimitConfig,
  RateLimitGuard,
  RateLimitModule,
  RedisRateLimitStore,
  ThrottleConfig,
} from './rate-limit';
// Tier 3 Security Support
export { SecretDetectionMiddleware } from './secret-detection';
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
} from './security';
export { SecurityService } from './security.service';
export { TenantCacheModule } from './tenant-cache.module';
export { TenantCacheService } from './tenant-cache.service';
// S2: Tenant Isolation Middleware
export {
  type AuthenticatedUser,
  SuperAdminOrTenantGuard,
  TenantIsolationMiddleware,
  type TenantRequest,
  TenantScopedGuard,
} from './tenant-isolation.middleware';
export {
  extractTenantFromHeader,
  extractTenantFromHost,
  extractTenantFromJWT,
  resolveTenant,
  type TenantResolutionStrategy,
} from './tenant-resolution';
export { isUuid } from './utils';
