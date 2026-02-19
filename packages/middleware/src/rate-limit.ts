/**
 * S6: Rate Limiting Service
 * Constitution Reference: architecture.md (S6 Protocol)
 * Purpose: Dynamic rate limits per tenant tier + DDoS protection
 * CRITICAL FIX: Using Redis for distributed rate limiting (multi-instance support)
 */

import { ConfigModule } from '@apex/config';
import {
  type CanActivate,
  type ExecutionContext,
  Global,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  Module,
  SetMetadata,
} from '@nestjs/common';
import { APP_GUARD, Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { RedisRateLimitStore } from './redis-rate-limit-store.js';
export { RedisRateLimitStore };

export const REFLECTOR_TOKEN = 'REFLECTOR';

// Rate limit tiers per plan
const RATE_LIMIT_TIERS = {
  free: { requests: 100, windowMs: 60_000 }, // 100 req/min
  basic: { requests: 500, windowMs: 60_000 }, // 500 req/min
  pro: { requests: 1000, windowMs: 60_000 }, // 1000 req/min
  enterprise: { requests: 5000, windowMs: 60_000 }, // 5000 req/min
} as const;

export interface RateLimitConfig {
  requests: number;
  windowMs: number;
  blockDurationMs?: number;
}

// RedisRateLimitStore has been moved to ./redis-rate-limit-store.ts to break circular dependencies

@Injectable()
export class RateLimitGuard implements CanActivate {
  private readonly defaultConfig: RateLimitConfig = {
    requests: 100,
    windowMs: 60_000, // 1 minute
    blockDurationMs: 300_000, // 5 minutes block after violations
  };

  constructor(
    @Inject(REFLECTOR_TOKEN) private readonly reflector: Reflector,
    private readonly rateLimitStore: RedisRateLimitStore
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();

    // Get client identifier (IP or API key)
    const identifier = this.getIdentifier(request);

    // Get tenant tier (default to free)
    const tenantTier = this.getTenantTier(request);
    const tierConfig = RATE_LIMIT_TIERS[tenantTier] || RATE_LIMIT_TIERS.free;

    // S6 Protocol: Support custom metadata from decorators
    const customConfig = this.reflector.getAllAndOverride<any>(RATE_LIMIT_KEY, [
      context.getHandler(),
      context.getClass(),
    ]) as
      | { limit?: number; requests?: number; ttl?: number; windowMs?: number }
      | undefined;

    // Merge configs: customConfig > tierConfig > defaultConfig
    const requests =
      customConfig?.limit ?? customConfig?.requests ?? tierConfig.requests;
    const windowMs =
      customConfig?.windowMs ??
      (customConfig?.ttl ? customConfig.ttl * 1000 : tierConfig.windowMs);

    // S6 FIX: Include tenantId in rate limit key for proper tenant isolation
    const tenantContext = (request as any).tenantContext;
    const tenantId = tenantContext?.tenantId || 'anonymous';
    const key = `ratelimit:${tenantId}:${identifier}`;
    const now = Date.now();

    // Check if currently blocked (IP blacklist after 5 violations)
    const { blocked, retryAfter } = await this.rateLimitStore.isBlocked(
      key,
      this.defaultConfig.blockDurationMs || 300_000
    );
    if (blocked) {
      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          message: 'IP blocked due to repeated violations',
          retryAfter,
        },
        HttpStatus.TOO_MANY_REQUESTS
      );
    }

    // Increment request count
    const { count } = await this.rateLimitStore.increment(key, windowMs);

    // S12 FIX: DDoS Detection - Immediate blocking for catastrophic bursts
    // If request count is 5x the limit, it's a DDoS pattern
    const ddosThreshold = requests * 5;
    if (count > ddosThreshold) {
      await this.rateLimitStore.block(key, 3600_000); // Block for 1 hour
      console.error(
        `S12 CRITICAL: DDoS pattern detected! IP: ${identifier} | Count: ${count} | THRESHOLD: ${ddosThreshold}`
      );
      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          message: 'DDoS protection triggered: IP banned for 1 hour',
        },
        HttpStatus.TOO_MANY_REQUESTS
      );
    }

    // Check if limit exceeded
    if (count > requests) {
      // Increment violations
      const violations = await this.rateLimitStore.incrementViolations(
        key,
        this.defaultConfig.blockDurationMs || 300_000
      );

      // Block after 5 violations
      if (violations >= 5) {
        await this.rateLimitStore.block(
          key,
          this.defaultConfig.blockDurationMs || 300_000
        );
      }

      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          message: 'Rate limit exceeded',
          limit: requests,
          window: '1 minute',
          retryAfter: Math.ceil(windowMs / 1000),
        },
        HttpStatus.TOO_MANY_REQUESTS
      );
    }

    // Add rate limit headers
    const response = context.switchToHttp().getResponse();
    response.setHeader('X-RateLimit-Limit', requests);
    // request count might be > limit if we didn't block earlier (shouldn't happen with strict > logic)
    response.setHeader('X-RateLimit-Remaining', Math.max(0, requests - count));
    response.setHeader('X-RateLimit-Reset', Math.ceil((now + windowMs) / 1000));

    return true;
  }

  private getIdentifier(request: Request): string {
    // Use API key if available, otherwise IP
    const headers = request.headers as any;
    const apiKey = headers['x-api-key'] as string;
    if (apiKey) {
      return `api:${apiKey}`;
    }

    // Get IP from various headers (proxy support)
    const ip =
      (headers['x-forwarded-for'] as string) ||
      (headers['x-real-ip'] as string) ||
      (request as any).ip ||
      'unknown';

    return `ip:${ip.split(',')[0].trim()}`;
  }

  private getTenantTier(request: Request): keyof typeof RATE_LIMIT_TIERS {
    // Extract from tenant context or default to free
    const tenantContext = (request as any).tenantContext;
    return tenantContext?.plan || 'free';
  }
}

/**
 * Decorator for custom rate limits
 */
export const RATE_LIMIT_KEY = 'rate_limit';

export const RateLimit = (config: Partial<RateLimitConfig>) =>
  SetMetadata(RATE_LIMIT_KEY, config);

/**
 * Throttle configuration for @nestjs/throttler (alternative)
 */
export const ThrottleConfig = {
  DEFAULT: {
    ttl: 60,
    limit: 100,
  },
  STRICT: {
    ttl: 60,
    limit: 20,
  },
  LENIENT: {
    ttl: 60,
    limit: 200,
  },
  throttlers: [
    {
      name: 'default',
      ttl: 60000, // 1 minute
      limit: 100,
    },
    {
      name: 'strict',
      ttl: 60000,
      limit: 10, // For auth endpoints
    },
  ],
};

import { ActiveDefenseMiddleware } from './active-defense.middleware.js';
import { FraudGuard } from './fraud.guard.js';
import { FraudScoringService } from './fraud-scoring.service.js';
import { GeoIpService } from './geo-ip.service.js';
import { GovernanceGuard } from './governance.guard.js';
import { HCaptchaService } from './hcaptcha.service.js';
import { OTPService } from './otp.service.js';
import { QuotaInterceptor } from './quota.interceptor.js';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    RedisRateLimitStore,
    GeoIpService,
    FraudScoringService,
    RateLimitGuard,
    ActiveDefenseMiddleware,
    GovernanceGuard,
    QuotaInterceptor,
    HCaptchaService,
    OTPService,
    FraudGuard,
    {
      provide: REFLECTOR_TOKEN,
      useExisting: Reflector,
    },
    {
      provide: APP_GUARD,
      useClass: RateLimitGuard,
    },
  ],
  exports: [
    RedisRateLimitStore,
    RateLimitGuard,
    GeoIpService,
    FraudScoringService,
    ActiveDefenseMiddleware,
    GovernanceGuard,
    QuotaInterceptor,
    HCaptchaService,
    OTPService,
    FraudGuard,
  ],
})
export class RateLimitModule {}
