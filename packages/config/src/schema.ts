import { z } from 'zod';

/**
 * Zod Schema for Environment Variables (Single Source of Truth)
 * Strict validation with no coercion
 */
export const EnvSchema = z.object({
  // Critical Security Variables
  JWT_SECRET: z
    .string()
    .min(32, 'S1 Violation: JWT_SECRET must be at least 32 characters')
    .regex(
      /^[A-Za-z0-9-_]+$/,
      'S1 Violation: JWT_SECRET contains invalid characters'
    ),
  ENCRYPTION_MASTER_KEY: z
    .string()
    .min(
      32,
      'S1 Violation: ENCRYPTION_MASTER_KEY must be at least 32 characters'
    )
    .refine((key) => {
      // S7: Strict Production Validation
      // In test mode, we always allow "test" substring for CI/CD simplicity
      if (process.env.NODE_ENV === 'test') return true;

      return !/test|default|example/i.test(key);
    }, 'S1 Violation: Production key cannot contain test patterns')
    .refine((key) => {
      // S7: Complexity check: Uppercase, Lowercase, Number, Special Character
      // Skip complexity check in test mode
      if (process.env.NODE_ENV === 'test') return true;

      return (
        /[A-Z]/.test(key) &&
        /[a-z]/.test(key) &&
        /[0-9]/.test(key) &&
        /[^A-Za-z0-9]/.test(key)
      );
    }, 'S1 Violation: Key lacks required complexity (A-Z, a-z, 0-9, special)'),

  JWT_EXPIRES_IN: z.string().default('7d'),

  // Database Configuration
  DATABASE_URL: z
    .string()
    .url('S1 Violation: DATABASE_URL must be a valid URL')
    .startsWith('postgresql://', 'S1 Violation: Only PostgreSQL is supported'),

  // Redis Configuration
  REDIS_URL: z
    .string()
    .url('S1 Violation: REDIS_URL must be a valid URL')
    .default('redis://localhost:6379'),

  // MinIO/S3 Configuration
  MINIO_ENDPOINT: z.string().min(1),
  MINIO_PORT: z.string().default('9000'),
  MINIO_USE_SSL: z.enum(['true', 'false']).default('false'),
  MINIO_ACCESS_KEY: z.string().min(3),
  MINIO_SECRET_KEY: z.string().min(8),
  MINIO_BUCKET_NAME: z.string().default('apex-assets'),
  MINIO_REGION: z.string().default('us-east-1'),

  // Application Settings
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),

  PORT: z.string().default('3000'),

  // Database Docker/Seed Context
  POSTGRES_USER: z.string().optional(),
  POSTGRES_PASSWORD: z.string().optional(),
  POSTGRES_DB: z.string().optional(),

  // Redis Security
  REDIS_PASSWORD: z.string().optional(),

  // MinIO Root Credentials
  MINIO_ROOT_USER: z.string().optional(),
  MINIO_ROOT_PASSWORD: z.string().optional(),

  // S1 Protocol Control
  ENABLE_S1_ENFORCEMENT: z.string().default('true'),

  // Rate Limiting (S6)
  RATE_LIMIT_TTL: z.string().default('60'),
  RATE_LIMIT_MAX: z.string().default('100'),

  // Tenant Isolation (S2)
  TENANT_ISOLATION_MODE: z.enum(['strict', 'flexible']).default('strict'),
});

export type EnvConfig = z.infer<typeof EnvSchema>;
