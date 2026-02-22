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
    .refine((key) => {
      // S1: Mandatory complexity in Production
      if (
        process.env.NODE_ENV === 'production' &&
        process.env.SKIP_S1_COMPLEXITY_CHECK === 'true'
      ) {
        return false; // Force fail in production
      }
      if (
        process.env.NODE_ENV === 'test' ||
        process.env.SKIP_S1_COMPLEXITY_CHECK === 'true'
      )
        return true;
      return /[A-Z]/.test(key) && /[a-z]/.test(key) && /[0-9]/.test(key);
    }, 'S1 Violation: JWT_SECRET lacks required complexity (A-Z, a-z, 0-9) or unauthorized bypass in production'),
  ENCRYPTION_MASTER_KEY: z
    .string()
    .min(
      32,
      'S1 Violation: ENCRYPTION_MASTER_KEY must be at least 32 characters'
    )
    .refine((key) => {
      // S7: Strict Production Validation
      if (process.env.NODE_ENV === 'production') {
        if (process.env.SKIP_S1_COMPLEXITY_CHECK === 'true') return false; // Fail bypass
        return !/test|default|example/i.test(key);
      }
      if (
        process.env.NODE_ENV === 'test' ||
        process.env.SKIP_S1_COMPLEXITY_CHECK === 'true'
      )
        return true;

      return !/test|default|example/i.test(key);
    }, 'S1 Violation: Production key cannot contain test patterns or unauthorized bypass')
    .refine((key) => {
      // S7: Complexity check: Uppercase, Lowercase, Number, Special Character
      if (process.env.NODE_ENV === 'production') {
        if (process.env.SKIP_S1_COMPLEXITY_CHECK === 'true') return false; // Fail bypass
      } else if (
        process.env.NODE_ENV === 'test' ||
        process.env.SKIP_S1_COMPLEXITY_CHECK === 'true'
      ) {
        return true;
      }

      return (
        /[A-Z]/.test(key) &&
        /[a-z]/.test(key) &&
        /[0-9]/.test(key) &&
        /[@$!%*?&#/=_+.-]/.test(key)
      );
    }, 'S1 Violation: Key lacks required complexity (A-Z, a-z, 0-9, special) or unauthorized bypass in production'),

  // S1: Admin Credentials (Strict Validation)
  SUPER_ADMIN_EMAIL: z
    .string()
    .email('S1 Violation: SUPER_ADMIN_EMAIL must be a valid email'),
  SUPER_ADMIN_PASSWORD: z
    .string()
    .min(8, 'S1 Violation: SUPER_ADMIN_PASSWORD must be at least 8 characters'),

  JWT_EXPIRES_IN: z.string().default('7d'),

  // Database Configuration
  DATABASE_URL: z
    .string()
    .min(1, 'S1 Violation: DATABASE_URL is required')
    .startsWith('postgresql://', 'S1 Violation: Only PostgreSQL is supported'),
  DB_SSL: z.enum(['true', 'false']).default('true'),

  // Redis Configuration
  REDIS_URL: z
    .string()
    .min(1, 'S1 Violation: REDIS_URL is required')
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
  NODE_ENV: z.enum(['development', 'production', 'test']),

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
  RATE_LIMIT_HOME: z.string().default('100'), // BR-01-SEC

  // Tenant Isolation (S2)
  TENANT_ISOLATION_MODE: z.enum(['strict', 'flexible']).default('strict'),

  // Error Tracking (S5)
  GLITCHTIP_DSN: z
    .string()
    .url('S1 Violation: GLITCHTIP_DSN must be a valid URL')
    .optional(),

  // hCaptcha (S11)
  HCAPTCHA_SITE_KEY: z.string().optional(),
  HCAPTCHA_SECRET_KEY: z.string().optional(),

  // Gitea & Webhook (S2/S5)
  GITEA_DB_PASSWORD: z.string().optional(),
  WEBHOOK_SECRET: z.string().optional(),

  // Storefront Performance (BR-01-SEC)
  HOME_CACHE_TTL: z.string().default('10'),

  // AI & Vector Search (BR-03-SEC)
  PGVECTOR_DIMENSION: z.string().default('1536'),
  OPENAI_API_KEY: z.string().optional(),
});

export type EnvConfig = z.infer<typeof EnvSchema>;
