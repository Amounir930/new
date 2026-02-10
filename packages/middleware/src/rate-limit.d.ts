/**
 * S6: Rate Limiting Service
 * Constitution Reference: architecture.md (S6 Protocol)
 * Purpose: Dynamic rate limits per tenant tier + DDoS protection
 * CRITICAL FIX: Using Redis for distributed rate limiting (multi-instance support)
 */
import { CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RedisClientType } from 'redis';
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
    private client;
    private connecting;
    private fallbackToMemory;
    private memoryStore;
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
    private reflector;
    private readonly defaultConfig;
    constructor(reflector: Reflector);
    canActivate(context: ExecutionContext): Promise<boolean>;
    private getIdentifier;
    private getTenantTier;
}
export declare const RATE_LIMIT_KEY = "rate_limit";
export declare const RateLimit: (config: Partial<RateLimitConfig>) => import("node_modules/@nestjs/common").CustomDecorator<string>;
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
//# sourceMappingURL=rate-limit.d.ts.map