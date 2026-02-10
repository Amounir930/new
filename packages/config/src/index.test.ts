/**
 * Config Package Tests
 * S1 Protocol: Environment Verification
 */

import { beforeEach, describe, expect, it } from 'vitest';
import { validateEnv } from './index.js';

describe('Config Package', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    // vi.resetModules();
    process.env = { ...originalEnv };
  });

  describe('validateEnv', () => {
    it('should validate correctly with valid env', () => {
      process.env.JWT_SECRET = 'a'.repeat(32);
      process.env.DATABASE_URL = 'postgresql://localhost:5432/db';
      process.env.MINIO_ACCESS_KEY = 'minioadmin';
      process.env.MINIO_SECRET_KEY = 'minioadmin';
      process.env.MINIO_ENDPOINT = 'localhost';

      const config = validateEnv();
      expect(config.JWT_SECRET).toBe('a'.repeat(32));
    });

    it('should throw S1 Violation if JWT_SECRET is too short', () => {
      process.env.JWT_SECRET = 'short';
      expect(() => validateEnv()).toThrow('S1 Violation');
    });

    it('should throw S1 Violation if DATABASE_URL is invalid', () => {
      process.env.JWT_SECRET = 'a'.repeat(32);
      process.env.DATABASE_URL = 'mysql://localhost';
      expect(() => validateEnv()).toThrow('S1 Violation');
    });

    it('should enforce production security constraints (JWT_SECRET)', () => {
      process.env.NODE_ENV = 'production';
      process.env.JWT_SECRET = 'default_secret_for_tests_long_enough';
      process.env.DATABASE_URL = 'postgresql://localhost:5432/db?ssl=true';
      process.env.MINIO_ACCESS_KEY = 'minioadmin';
      process.env.MINIO_SECRET_KEY = 'minioadmin';
      process.env.MINIO_ENDPOINT = 'localhost';

      expect(() => validateEnv()).toThrow(
        'S1 Violation: JWT_SECRET appears to be a default/test value'
      );
    });

    it('should enforce production security constraints (SSL)', () => {
      process.env.NODE_ENV = 'production';
      process.env.JWT_SECRET = 'a'.repeat(32);
      process.env.DATABASE_URL = 'postgresql://localhost:5432/db';
      process.env.MINIO_ACCESS_KEY = 'minioadmin';
      process.env.MINIO_SECRET_KEY = 'minioadmin';
      process.env.MINIO_ENDPOINT = 'localhost';

      expect(() => validateEnv()).toThrow(
        'S1 Violation: Production database must use SSL'
      );
    });
  });

  describe('ConfigService', () => {
    it('should retrieve values correctly', async () => {
      process.env.JWT_SECRET = 'a'.repeat(32);
      process.env.DATABASE_URL = 'postgresql://localhost:5432/db';
      process.env.MINIO_ACCESS_KEY = 'minioadmin';
      process.env.MINIO_SECRET_KEY = 'minioadmin';
      process.env.MINIO_ENDPOINT = 'localhost';

      // vi.resetModules();
      const { ConfigService } = await import('./index.js');
      const service = new ConfigService();
      expect(service.get('JWT_SECRET')).toBe('a'.repeat(32));
    });

    it('should return default values', async () => {
      process.env.JWT_SECRET = 'a'.repeat(32);
      process.env.DATABASE_URL = 'postgresql://localhost:5432/db';
      process.env.MINIO_ACCESS_KEY = 'minioadmin';
      process.env.MINIO_SECRET_KEY = 'minioadmin';
      process.env.MINIO_ENDPOINT = 'localhost';
      (process.env as any).JWT_EXPIRES_IN = undefined; // Ensure we test the default

      // vi.resetModules();
      const { ConfigService } = await import('./index.js');
      const service = new ConfigService();
      // In the actual schema, JWT_EXPIRES_IN defaults to '7d'
      expect(service.getWithDefault('JWT_EXPIRES_IN', '1d')).toBe('7d');
    });
  });
});
