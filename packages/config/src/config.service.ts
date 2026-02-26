import { Global, Injectable, Module } from '@nestjs/common';
import { validateEnv } from './index';
/**
 * S1: Configuration Service
 */
// biome-ignore lint/style/useImportType: Dependency Injection requires value import (S1-S15 Compliance)
import { EnvConfig } from './schema';

/**
 * NestJS-compatible ConfigService
 * Provides typed access to environment variables
 */
@Injectable()
export class ConfigService {
  private readonly config: EnvConfig;

  constructor() {
    // S1: Always validate environment on service construction
    // In test mode, we fallback to raw process.env to allow partial testing/mocking
    try {
      this.config = validateEnv();
    } catch (error) {
      if (process.env.NODE_ENV === 'test') {
        this.config = process.env as unknown as EnvConfig;
      } else {
        throw error;
      }
    }
  }

  /**
   * Get a configuration value by key
   */
  get<K extends keyof EnvConfig>(key: K): EnvConfig[K] {
    return this.config[key];
  }

  /**
   * Get a configuration value with a default fallback
   */
  getWithDefault<K extends keyof EnvConfig>(
    key: K,
    defaultValue: EnvConfig[K]
  ): EnvConfig[K] {
    return this.config[key] ?? defaultValue;
  }
}

@Global()
@Module({
  providers: [ConfigService],
  exports: [ConfigService],
})
export class ConfigModule {}
