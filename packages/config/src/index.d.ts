/**
 * S1: Environment Verification Protocol
 * Constitution Reference: Article S1
 * Rule: Application MUST crash on invalid environment configuration
 */
import { type EnvConfig } from './schema';
export * from './schema';
/**
 * Validates environment variables at boot time
 * @throws Error with 'S1 Violation' prefix on validation failure
 * @returns Validated environment configuration
 */
export declare function validateEnv(): EnvConfig;
/**
 * Boot-time environment checker
 * Usage: Import this at the very top of your main.ts
 * Effect: Application will crash immediately if env is invalid
 */
export declare function enforceS1Compliance(): void;
/**
 * Cached environment configuration
 * Use this for direct access to env vars after validation
 */
export declare const env: EnvConfig;
/**
 * NestJS-compatible ConfigService
 * Provides typed access to environment variables
 */
export declare class ConfigService {
    private readonly config;
    constructor();
    /**
     * Get a configuration value by key
     */
    get<K extends keyof EnvConfig>(key: K): EnvConfig[K];
    /**
     * Get a configuration value with a default fallback
     */
    getWithDefault<K extends keyof EnvConfig>(key: K, defaultValue: EnvConfig[K]): EnvConfig[K];
}
export declare class ConfigModule {
}
//# sourceMappingURL=index.d.ts.map