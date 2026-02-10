/**
 * S1: Environment Verification Protocol
 * Constitution Reference: Article S1
 * Rule: Application MUST crash on invalid environment configuration
 */
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { z } from 'zod';
import { Global, Module } from '@nestjs/common';
import { EnvSchema } from './schema';
export * from './schema';
/**
 * Validates environment variables at boot time
 * @throws Error with 'S1 Violation' prefix on validation failure
 * @returns Validated environment configuration
 */
export function validateEnv() {
    try {
        const parsed = EnvSchema.parse(process.env);
        // Additional S1 Security Checks
        if (parsed.NODE_ENV === 'production') {
            if (parsed.JWT_SECRET.includes('default') ||
                parsed.JWT_SECRET.includes('test')) {
                throw new Error('S1 Violation: JWT_SECRET appears to be a default/test value in production');
            }
            if (parsed.DATABASE_URL.includes('localhost') &&
                !parsed.DATABASE_URL.includes('ssl')) {
                throw new Error('S1 Violation: Production database must use SSL');
            }
        }
        console.warn('✅ S1 Compliance: Environment variables validated successfully');
        return parsed;
    }
    catch (error) {
        if (error instanceof z.ZodError) {
            const issues = error.issues
                .map((i) => `${i.path.join('.')}: ${i.message}`)
                .join('; ');
            throw new Error(`S1 Violation: Environment validation failed - ${issues}`);
        }
        throw error;
    }
}
/**
 * Boot-time environment checker
 * Usage: Import this at the very top of your main.ts
 * Effect: Application will crash immediately if env is invalid
 */
export function enforceS1Compliance() {
    try {
        validateEnv();
    }
    catch (error) {
        console.error('❌ CRITICAL: S1 Protocol Violation');
        console.error(error instanceof Error ? error.message : 'Unknown error');
        console.error('Application startup aborted. Check your .env file.');
        process.exit(1);
    }
}
// Auto-execute on import for fail-fast behavior
// CRITICAL FIX (S1): Always enforce in production, respect flag only in non-production
// Skip auto-enforcement during tests to allow mocking
if (process.env.NODE_ENV !== 'test') {
    if (process.env.NODE_ENV === 'production') {
        // In production, S1 is ALWAYS enforced - no bypass allowed
        enforceS1Compliance();
    }
    else if (process.env.ENABLE_S1_ENFORCEMENT !== 'false') {
        // In non-production, respect the flag (default to enforce)
        enforceS1Compliance();
    }
}
/**
 * Cached environment configuration
 * Use this for direct access to env vars after validation
 */
export const env = validateEnv();
/**
 * NestJS-compatible ConfigService
 * Provides typed access to environment variables
 */
export class ConfigService {
    config;
    constructor() {
        this.config = env;
    }
    /**
     * Get a configuration value by key
     */
    get(key) {
        return this.config[key];
    }
    /**
     * Get a configuration value with a default fallback
     */
    getWithDefault(key, defaultValue) {
        return this.config[key] ?? defaultValue;
    }
}
let ConfigModule = class ConfigModule {
};
ConfigModule = __decorate([
    Global(),
    Module({
        providers: [ConfigService],
        exports: [ConfigService],
    })
], ConfigModule);
export { ConfigModule };
//# sourceMappingURL=index.js.map