/**
 * S6: Rate Limiting Service
 * Constitution Reference: architecture.md (S6 Protocol)
 * Purpose: Dynamic rate limits per tenant tier + DDoS protection
 * CRITICAL FIX: Using Redis for distributed rate limiting (multi-instance support)
 */
import { ConfigService } from '@apex/config';
import { type CanActivate, type ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { type RedisClientType } from 'redis';
export declare const REFLECTOR_TOKEN = "REFLECTOR";
export interface RateLimitConfig {
    requests: number;
    windowMs: number;
    blockDurationMs?: number;
}
/**
 * Redis Rate Limit Store
 * CRITICAL: Supports distributed deployments (Docker/K8s multi-instance)
 */
export declare class RedisRateLimitStore {
    private readonly configService;
    private client;
    private connecting;
    private fallbackToMemory;
    private memoryStore;
    constructor(configService: ConfigService);
    onModuleInit(): Promise<void>;
    getClient(): Promise<RedisClientType | null>;
    private connect;
    increment(key: string, windowMs: number): Promise<{
        count: number;
        ttl: number;
    }>;
    getViolations(key: string): Promise<number>;
    incrementViolations(key: string, blockDurationMs: number): Promise<number>;
    isBlocked(key: string, _blockDurationMs: number): Promise<{
        blocked: boolean;
        retryAfter: number;
    }>;
    block(key: string, blockDurationMs: number): Promise<void>;
    getRemaining(key: string, limit: number): Promise<number>;
}
export declare class RateLimitGuard implements CanActivate {
    private readonly reflector;
    private readonly rateLimitStore;
    private readonly defaultConfig;
    constructor(reflector: Reflector, rateLimitStore: RedisRateLimitStore);
    canActivate(context: ExecutionContext): Promise<boolean>;
    private getIdentifier;
    private getTenantTier;
}
/**
 * Decorator for custom rate limits
 */
export declare const RATE_LIMIT_KEY = "rate_limit";
export declare const RateLimit: (config: Partial<RateLimitConfig>) => import("@nestjs/common").CustomDecorator<string>;
/**
 * Throttle configuration for @nestjs/throttler (alternative)
 */
export declare const ThrottleConfig: {
    DEFAULT: {
        ttl: number;
        limit: number;
    };
    STRICT: {
        ttl: number;
        limit: number;
    };
    LENIENT: {
        ttl: number;
        limit: number;
    };
    throttlers: {
        name: string;
        ttl: number;
        limit: number;
    }[];
};
export declare class RateLimitModule {
}
//# sourceMappingURL=rate-limit.d.ts.map