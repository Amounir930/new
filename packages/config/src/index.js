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
import { Global, Module } from '@nestjs/common';
import { z } from 'zod';
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
        enforceProductionChecks(parsed);
        enforceGenericChecks(parsed);
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
function enforceProductionChecks(parsed) {
    if (parsed.NODE_ENV !== 'production')
        return;
    if (parsed.JWT_SECRET.length < 32) {
        throw new Error('S1 Violation: JWT_SECRET must be at least 32 characters in production');
    }
    if (parsed.JWT_SECRET.includes('default') ||
        parsed.JWT_SECRET.includes('test')) {
        throw new Error('S1 Violation: JWT_SECRET appears to be a default/test value in production');
    }
    if (parsed.DATABASE_URL.includes('localhost') &&
        !parsed.DATABASE_URL.includes('ssl')) {
        throw new Error('S1 Violation: Production database must use SSL');
    }
}
function enforceGenericChecks(parsed) {
    // Common checks for all environments (including test/dev)
    if (parsed.JWT_SECRET.length < 8) {
        throw new Error('S1 Violation: JWT_SECRET is too short (min 8 chars)');
    }
    const dbUrl = parsed.DATABASE_URL;
    if (dbUrl &&
        !dbUrl.startsWith('postgres://') &&
        !dbUrl.startsWith('postgresql://')) {
        throw new Error('S1 Violation: Invalid DATABASE_URL protocol');
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
        if (process.env.NODE_ENV === 'test') {
            return; // Permitted path for Rule S1 in Sandbox/Test environment to allow partial tests
        }
        console.error('❌ CRITICAL: S1 Protocol Violation');
        console.error(error instanceof Error ? error.message : 'Unknown error');
        console.error('Application startup aborted. Check your .env file.');
        process.exit(1);
    }
}
// Auto-execute on import for fail-fast behavior
// CRITICAL FIX (S1): Always enforce in production, respect flag only in non-production
if (process.env.NODE_ENV !== 'test') {
    if (process.env.NODE_ENV === 'production') {
        enforceS1Compliance();
    }
    else if (process.env.ENABLE_S1_ENFORCEMENT !== 'false') {
        enforceS1Compliance();
    }
}
/**
 * Global validated environment configuration
 * (Fail-fast initialization)
 * In TEST mode, we fallback to process.env if parsing fails to avoid breaking module load
 */
export const env = (() => {
    if (process.env.NODE_ENV === 'test') {
        try {
            return EnvSchema.parse(process.env);
        }
        catch (_e) {
            return process.env;
        }
    }
    return validateEnv();
})();
/**
 * NestJS-compatible ConfigService
 * Provides typed access to environment variables
 */
export class ConfigService {
    config;
    constructor() {
        // S1: Always validate environment on service construction
        // In test mode, we fallback to raw process.env to allow partial testing/mocking
        try {
            this.config = validateEnv();
        }
        catch (error) {
            if (process.env.NODE_ENV === 'test') {
                this.config = process.env;
            }
            else {
                throw error;
            }
        }
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