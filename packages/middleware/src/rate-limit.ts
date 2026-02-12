/**
 * S6: Rate Limiting Service
 * Constitution Reference: architecture.md (S6 Protocol)
 * Purpose: Dynamic rate limits per tenant tier + DDoS protection
 * CRITICAL FIX: Using Redis for distributed rate limiting (multi-instance support)
 */

import {
  type CanActivate,
  type ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import type { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { createClient, type RedisClientType } from 'redis';

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

/**
 * Redis Rate Limit Store
 * CRITICAL: Supports distributed deployments (Docker/K8s multi-instance)
 */
export class RedisRateLimitStore {
  private client: RedisClientType | null = null;
  private connecting = false;
  private fallbackToMemory = false;

  // Fallback in-memory store (only used if Redis unavailable)
  private memoryStore: Map<
    string,
    { count: number; resetTime: number; violations: number }
  > = new Map();

  async getClient(): Promise<RedisClientType | null> {
    if (this.client?.isOpen) {
      return this.client;
    }

    if (this.connecting) {
      return null; // Still connecting
    }

    // Try to connect to Redis
    if (!this.client && !this.fallbackToMemory) {
      await this.connect();
    }

    // Return client only if connected
    if (this.client?.isOpen) {
      return this.client;
    }

    return null;
  }

  private async connect(): Promise<void> {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

    try {
      this.connecting = true;
      this.client = createClient({ url: redisUrl });

      this.client.on('error', () => {
        // Silent error - will fallback to memory
        this.fallbackToMemory = true;
      });

      await this.client.connect();
      this.fallbackToMemory = false;
    } catch {
      this.client = null; // CRITICAL: Reset client so we don't use a broken instance
      this.fallbackToMemory = false;

      // CRITICAL FIX (S6): In production, reject requests if Redis unavailable
      // In non-production, fallback to memory with warning
      const isProduction = process.env.NODE_ENV === 'production';
      if (isProduction) {
        console.error(
          '❌ S6 CRITICAL: Redis unavailable in production. Rate limiting cannot function securely.'
        );
      } else {
        console.warn(
          '⚠️ S6: Redis unavailable, falling back to in-memory rate limiting (NOT for production multi-instance)'
        );
        this.fallbackToMemory = true;
      }
    } finally {
      this.connecting = false;
    }
  }

  async increment(
    key: string,
    windowMs: number
  ): Promise<{ count: number; ttl: number }> {
    const client = await this.getClient();

    // CRITICAL FIX (S6): In production, reject if Redis unavailable
    if (!client && process.env.NODE_ENV === 'production') {
      throw new HttpException(
        {
          statusCode: HttpStatus.SERVICE_UNAVAILABLE,
          message: 'Rate limiting service unavailable',
        },
        HttpStatus.SERVICE_UNAVAILABLE
      );
    }

    if (client) {
      // Redis implementation (distributed)
      const multi = client.multi();
      multi.incr(key);
      multi.ttl(key);

      const results = await multi.exec();
      const count = results[0] as number;
      let ttl = results[1] as number;

      // Set expiry on first request
      if (count === 1 || ttl === -1) {
        await client.expire(key, Math.ceil(windowMs / 1000));
        ttl = Math.ceil(windowMs / 1000);
      }

      return { count, ttl };
    }
    // Memory fallback (single instance only) - non-production only
    const now = Date.now();
    const existing = this.memoryStore.get(key);

    if (!existing || now > existing.resetTime) {
      const newRecord = {
        count: 1,
        resetTime: now + windowMs,
        violations: 0,
      };
      this.memoryStore.set(key, newRecord);
      return { count: 1, ttl: Math.ceil(windowMs / 1000) };
    }

    existing.count++;
    return {
      count: existing.count,
      ttl: Math.ceil((existing.resetTime - now) / 1000),
    };
  }

  async getViolations(key: string): Promise<number> {
    const violationKey = `${key}:violations`;
    const client = await this.getClient();

    if (client) {
      const violations = await client.get(violationKey);
      return violations ? parseInt(violations, 10) : 0;
    }
    const record = this.memoryStore.get(key);
    return record?.violations || 0;
  }

  async incrementViolations(
    key: string,
    blockDurationMs: number
  ): Promise<number> {
    const violationKey = `${key}:violations`;
    const client = await this.getClient();

    if (client) {
      const violations = await client.incr(violationKey);
      // Set expiry for violation counter (longer than rate limit window)
      await client.expire(violationKey, Math.ceil(blockDurationMs / 1000) * 5);
      return violations;
    }
    const record = this.memoryStore.get(key);
    if (record) {
      record.violations++;
      return record.violations;
    }
    return 1;
  }

  async isBlocked(
    key: string,
    _blockDurationMs: number
  ): Promise<{ blocked: boolean; retryAfter: number }> {
    const blockKey = `${key}:blocked`;
    const client = await this.getClient();

    if (client) {
      const ttl = await client.ttl(blockKey);
      if (ttl > 0) {
        return { blocked: true, retryAfter: ttl };
      }
      return { blocked: false, retryAfter: 0 };
    }
    const record = this.memoryStore.get(key);
    if (record && record.violations >= 5) {
      const now = Date.now();
      const blocked = now < record.resetTime;
      return {
        blocked,
        retryAfter: blocked ? Math.ceil((record.resetTime - now) / 1000) : 0,
      };
    }
    return { blocked: false, retryAfter: 0 };
  }

  async block(key: string, blockDurationMs: number): Promise<void> {
    const blockKey = `${key}:blocked`;
    const client = await this.getClient();

    if (client) {
      await client.setEx(blockKey, Math.ceil(blockDurationMs / 1000), '1');
    } else {
      const record = this.memoryStore.get(key);
      if (record) {
        record.resetTime = Date.now() + blockDurationMs;
      }
    }
  }

  async getRemaining(key: string, limit: number): Promise<number> {
    const { count } = await this.increment(key, 0); // Just get count without incrementing
    return Math.max(0, limit - count + 1); // +1 because we already incremented
  }
}

// Singleton store instance
const rateLimitStore = new RedisRateLimitStore();

@Injectable()
export class RateLimitGuard implements CanActivate {
  private readonly defaultConfig: RateLimitConfig = {
    requests: 100,
    windowMs: 60_000, // 1 minute
    blockDurationMs: 300_000, // 5 minutes block after violations
  };

  constructor(private reflector: Reflector) {}

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
    const { blocked, retryAfter } = await rateLimitStore.isBlocked(
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
    const { count } = await rateLimitStore.increment(key, windowMs);

    // Check if limit exceeded
    if (count > requests) {
      // Increment violations
      const violations = await rateLimitStore.incrementViolations(
        key,
        this.defaultConfig.blockDurationMs || 300_000
      );

      // Block after 5 violations
      if (violations >= 5) {
        await rateLimitStore.block(
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
    response.setHeader('X-RateLimit-Remaining', Math.max(0, requests - count));
    response.setHeader('X-RateLimit-Reset', Math.ceil((now + windowMs) / 1000));

    return true;
  }

  private getIdentifier(request: Request): string {
    // Use API key if available, otherwise IP
    const apiKey = request.headers['x-api-key'] as string;
    if (apiKey) {
      return `api:${apiKey}`;
    }

    // Get IP from various headers (proxy support)
    const ip =
      (request.headers['x-forwarded-for'] as string) ||
      (request.headers['x-real-ip'] as string) ||
      request.ip ||
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
import { SetMetadata } from '@nestjs/common';

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
