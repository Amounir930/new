/**
 * Config Package Tests
 * S1 Protocol: Environment Verification
 */

import { beforeEach, describe, expect, it } from 'bun:test';

// Set test environment variables immediately
const env = process.env as Record<string, string | undefined>;
env['NODE_ENV'] = 'test';
env['JWT_SECRET'] = 'aA1'.repeat(11);
process.env['DATABASE_URL'] = 'postgresql://localhost:5432/db';
process.env['ENCRYPTION_MASTER_KEY'] = 'SuperSecureKey123!A_Long_32_Chars_S_'; // gitleaks:allow
process.env['MINIO_ACCESS_KEY'] = 'minioadmin';
process.env['MINIO_SECRET_KEY'] = 'minioadmin';
process.env['MINIO_ENDPOINT'] = 'localhost';
process.env['SUPER_ADMIN_EMAIL'] = 'admin@example.com';
process.env['SUPER_ADMIN_PASSWORD'] = 'strongpassword123';
process.env['REDIS_URL'] = 'redis://:Secr3tP4ssw0rd!@localhost:6379';
process.env['API_KEY_SECRET'] = 'ApiSecretKey123!A_Long_32_Chars_S_';
process.env['BLIND_INDEX_PEPPER'] = 'PepperBlindIndex123!A_Long_32_Chars';
process.env['SESSION_SALT'] = 'SessionSalt123!A_Long_Enough_32_Chars';
process.env['INTERNAL_API_SECRET'] = 'InternalApiSecret123!A_Long_32_Chars';

import { validateEnv } from './index';

describe('Config Package', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  describe('validateEnv', () => {
    it('should validate correctly with valid env', () => {
      process.env['JWT_SECRET'] = 'aA1'.repeat(11);
      process.env['DATABASE_URL'] =
        'postgresql://localhost:5432/db?ssl=require';
      process.env['ENCRYPTION_MASTER_KEY'] = // gitleaks:allow
        'SuperSecureKey123!A_Long_32_Chars_S_';
      process.env['MINIO_ACCESS_KEY'] = 'minioadmin';
      process.env['MINIO_SECRET_KEY'] = 'minioadmin';
      process.env['MINIO_ENDPOINT'] = 'localhost';
      process.env['SUPER_ADMIN_EMAIL'] = 'admin@example.com';
      process.env['SUPER_ADMIN_PASSWORD'] = 'strongpassword123';
      process.env['REDIS_URL'] = 'redis://:Secr3tP4ssw0rd!@localhost:6379';
      process.env['API_KEY_SECRET'] = 'ApiSecretKey123!A_Long_32_Chars_S_';
      process.env['BLIND_INDEX_PEPPER'] = 'PepperBlindIndex123!A_Long_32_Chars';
      process.env['SESSION_SALT'] = 'SessionSalt123!A_Long_Enough_32_Chars';
      process.env['INTERNAL_API_SECRET'] =
        'InternalApiSecret123!A_Long_32_Chars';

      const config = validateEnv();
      expect(config.JWT_SECRET).toBe('aA1'.repeat(11));
      expect(config.SUPER_ADMIN_EMAIL).toBe('admin@example.com');
    });

    it('should throw S1 Violation if JWT_SECRET is too short', () => {
      process.env['NODE_ENV'] = 'production';
      process.env['JWT_SECRET'] = 'short';
      process.env['SKIP_S1_COMPLEXITY_CHECK'] = 'false';
      expect(() => validateEnv()).toThrow(
        /S1 Violation:.*JWT_SECRET.*complexity/
      );
    });

    it('should throw S1 Violation if DATABASE_URL is invalid', () => {
      process.env['JWT_SECRET'] = 'aA1'.repeat(11);
      process.env['DATABASE_URL'] = 'mysql://localhost';
      expect(() => validateEnv()).toThrow('S1 Violation');
    });

    it('should enforce production security constraints (JWT_SECRET)', () => {
      const env = process.env as Record<string, string | undefined>;
      env['NODE_ENV'] = 'production';
      env['JWT_SECRET'] = 'test_secret_value_for_testing_only_123';
      env['SKIP_S1_COMPLEXITY_CHECK'] = 'false';
      // Production check: ENCRYPTION_MASTER_KEY must not contain 'test' or 'default'
      process.env['DATABASE_URL'] =
        'postgresql://localhost:5432/db?ssl=require';
      process.env['ENCRYPTION_MASTER_KEY'] = // gitleaks:allow
        'SuperSecureKey123!A_Long_32_Chars_S_';
      process.env['MINIO_ACCESS_KEY'] = 'minioadmin';
      process.env['MINIO_SECRET_KEY'] = 'minioadmin';
      process.env['MINIO_ENDPOINT'] = 'localhost';
      process.env['SUPER_ADMIN_EMAIL'] = 'admin@example.com';
      process.env['SUPER_ADMIN_PASSWORD'] = 'strongpassword123';
      process.env['REDIS_URL'] = 'redis://:Secr3tP4ssw0rd!@localhost:6379';
      process.env['API_KEY_SECRET'] = 'ApiSecretKey123!A_Long_32_Chars_S_';
      process.env['BLIND_INDEX_PEPPER'] = 'PepperBlindIndex123!A_Long_32_Chars';
      process.env['SESSION_SALT'] = 'SessionSalt123!A_Long_Enough_32_Chars';
      process.env['INTERNAL_API_SECRET'] =
        'InternalApiSecret123!A_Long_32_Chars';

      expect(() => validateEnv()).toThrow(
        /S1 Violation: Environment validation failed/
      );
    });

    it('should enforce production security constraints (SSL)', () => {
      const env = process.env as Record<string, string | undefined>;
      env['NODE_ENV'] = 'production';
      env['JWT_SECRET'] = 'aA1'.repeat(11);
      env['SKIP_S1_COMPLEXITY_CHECK'] = 'false';
      process.env['DATABASE_URL'] = 'postgresql://localhost:5432/db'; // Missing ssl=require
      process.env['ENCRYPTION_MASTER_KEY'] = // gitleaks:allow
        'SuperSecureKey123!_Long_Enough_32';
      process.env['MINIO_ACCESS_KEY'] = 'minioadmin';
      process.env['MINIO_SECRET_KEY'] = 'minioadmin';
      process.env['MINIO_ENDPOINT'] = 'localhost';
      process.env['SUPER_ADMIN_EMAIL'] = 'admin@example.com';
      process.env['SUPER_ADMIN_PASSWORD'] = 'strongpassword123';
      process.env['REDIS_URL'] = 'redis://:Secr3tP4ssw0rd!@localhost:6379';
      process.env['API_KEY_SECRET'] = 'ApiSecretKey123!A_Long_32_Chars_S_';
      process.env['BLIND_INDEX_PEPPER'] = 'PepperBlindIndex123!A_Long_32_Chars';
      process.env['SESSION_SALT'] = 'SessionSalt123!A_Long_Enough_32_Chars';
      process.env['INTERNAL_API_SECRET'] =
        'InternalApiSecret123!A_Long_32_Chars';

      expect(() => validateEnv()).toThrow(
        /S1 Violation: Environment validation failed.*DATABASE_URL.*SSL/
      );
    });
  });

  describe('ConfigService', () => {
    it('should retrieve values correctly', async () => {
      process.env['JWT_SECRET'] = 'aA1'.repeat(11);
      process.env['DATABASE_URL'] =
        'postgresql://localhost:5432/db?ssl=require';
      process.env['ENCRYPTION_MASTER_KEY'] = // gitleaks:allow
        'SuperSecureKey123!A_Long_32_Chars_S_';
      process.env['MINIO_ACCESS_KEY'] = 'minioadmin';
      process.env['MINIO_SECRET_KEY'] = 'minioadmin';
      process.env['MINIO_ENDPOINT'] = 'localhost';
      process.env['SUPER_ADMIN_EMAIL'] = 'admin@example.com';
      process.env['SUPER_ADMIN_PASSWORD'] = 'strongpassword123';
      process.env['REDIS_URL'] = 'redis://localhost:6379';
      process.env['API_KEY_SECRET'] = 'ApiSecretKey123!A_Long_32_Chars_S_';
      process.env['BLIND_INDEX_PEPPER'] = 'PepperBlindIndex123!A_Long_32_Chars';
      process.env['SESSION_SALT'] = 'SessionSalt123!A_Long_Enough_32_Chars';
      process.env['INTERNAL_API_SECRET'] =
        'InternalApiSecret123!A_Long_32_Chars';

      const { ConfigService } = await import('./index');
      const service = new ConfigService();
      expect(service.get('JWT_SECRET')).toBe('aA1'.repeat(11));
      expect(service.get('SUPER_ADMIN_EMAIL')).toBe('admin@example.com');
    });

    it('should return default values', async () => {
      process.env['JWT_SECRET'] = 'aA1'.repeat(11);
      process.env['DATABASE_URL'] =
        'postgresql://localhost:5432/db?ssl=require';
      process.env['ENCRYPTION_MASTER_KEY'] = // gitleaks:allow
        'SuperSecureKey123!_Long_Enough_32';
      process.env['MINIO_ACCESS_KEY'] = 'minioadmin';
      process.env['MINIO_SECRET_KEY'] = 'minioadmin';
      process.env['MINIO_ENDPOINT'] = 'localhost';
      process.env['SUPER_ADMIN_EMAIL'] = 'admin@example.com';
      process.env['SUPER_ADMIN_PASSWORD'] = 'strongpassword123';
      process.env['REDIS_URL'] = 'redis://localhost:6379';
      process.env['API_KEY_SECRET'] = 'ApiSecretKey123!A_Long_32_Chars_S_';
      process.env['BLIND_INDEX_PEPPER'] = 'PepperBlindIndex123!A_Long_32_Chars';
      process.env['SESSION_SALT'] = 'SessionSalt123!A_Long_Enough_32_Chars';
      process.env['INTERNAL_API_SECRET'] =
        'InternalApiSecret123!A_Long_32_Chars';
      (process.env as Record<string, string | undefined>)['JWT_EXPIRES_IN'] =
        undefined; // Ensure we test the default

      const { ConfigService } = await import('./index');
      const service = new ConfigService();
      // In the actual schema, JWT_EXPIRES_IN defaults to '7d'
      expect(service.getWithDefault('JWT_EXPIRES_IN', '1d')).toBe('7d');
    });
  });
});
