import { z } from 'zod';

/**
 * Zod Schema for Environment Variables (Single Source of Truth)
 * Strict validation with no coercion
 * S1 Compliant: Application MUST crash on invalid configuration
 */
export const EnvSchema = z.object({
  // Critical Security Variables (S1/S7 Enforcement)
  JWT_SECRET: z.string().refine((key) => {
    if (process.env['NODE_ENV'] === 'production') {
      if (process.env['SKIP_S1_COMPLEXITY_CHECK'] === 'true') return true;
      return (
        key.length >= 32 &&
        /[A-Z]/.test(key) &&
        /[a-z]/.test(key) &&
        /[0-9]/.test(key)
      );
    }
    return true;
  }, 'S1 Violation: JWT_SECRET lacks required complexity in production'),
  JWT_SECRET_FILE: z.string().optional(),

  ENCRYPTION_MASTER_KEY: z.string().refine((key) => {
    if (process.env['NODE_ENV'] === 'production') {
      if (process.env['SKIP_S1_COMPLEXITY_CHECK'] === 'true') return true;
      return (
        key.length >= 32 &&
        !/test|default|example/i.test(key) &&
        /[A-Z]/.test(key) &&
        /[a-z]/.test(key) &&
        /[0-9]/.test(key)
      );
    }
    return true;
  }, 'S1 Violation: ENCRYPTION_MASTER_KEY lacks required complexity in production'),
  ENCRYPTION_MASTER_KEY_FILE: z.string().optional(),

  // S1: Admin Credentials (Strict Validation)
  SUPER_ADMIN_EMAIL: z
    .string()
    .email('S1 Violation: Invalid SUPER_ADMIN_EMAIL format'),
  SUPER_ADMIN_EMAIL_FILE: z.string().optional(),
  SUPER_ADMIN_PASSWORD: z
    .string()
    .min(8, 'S1 Violation: SUPER_ADMIN_PASSWORD too weak')
    .optional(),
  SUPER_ADMIN_PASSWORD_FILE: z.string().optional(),
  SUPER_ADMIN_KEY: z.string().min(32, 'S1 Violation: SUPER_ADMIN_KEY must be at least 32 characters').optional(),

  JWT_EXPIRES_IN: z.string().default('7d'),

  // Database Configuration (S1/S2 Enforcement)
  DATABASE_URL: z
    .string()
    .startsWith('postgresql://', 'S1 Violation: Only PostgreSQL supported')
    .refine((url) => {
      if (process.env['NODE_ENV'] === 'production') {
        if (process.env['DB_SSL_OPTIONAL'] === 'true') return true;
        return url.includes('sslmode=require') || url.includes('ssl=require');
      }
      return true;
    }, 'S1 Violation: DATABASE_URL must require SSL in production'),
  DATABASE_URL_FILE: z.string().optional(),
  DB_SSL_OPTIONAL: z.string().default('false'),
  DB_SSL: z.enum(['true', 'false']).default('true'),
  DB_CA_CERT: z.string().optional(),
  PGHOST: z.string().optional(),
  PGUSER: z.string().optional(),
  PGPASSWORD: z.string().optional(),
  PGDATABASE: z.string().optional(),
  PGPORT: z.string().optional(),
  READ_REPLICA_URL: z.string().optional(),

  // Redis Configuration (S6/S12 Enforcement)
  REDIS_URL: z.string().refine((url) => {
    if (process.env['NODE_ENV'] === 'production') {
      return /redis:\/\/[^:]*:[^@]+@/.test(url);
    }
    return true;
  }, 'S1 Violation: REDIS_URL must include credentials in production'),
  REDIS_URL_FILE: z.string().optional(),
  REDIS_HOST: z.string().default('localhost'),
  REDIS_PORT: z.string().default('6379'),

  // MinIO/S3 Configuration (S7/S14 Enforcement)
  MINIO_ENDPOINT: z.string().min(1),
  MINIO_PORT: z.string().default('9000'),
  MINIO_USE_SSL: z.enum(['true', 'false']).default('false'),
  MINIO_ACCESS_KEY: z.string().min(3).optional(),
  MINIO_ACCESS_KEY_FILE: z.string().optional(),
  MINIO_SECRET_KEY: z.string().min(8).optional(),
  MINIO_SECRET_KEY_FILE: z.string().optional(),
  MINIO_BUCKET_NAME: z.string().default('apex-assets'),
  MINIO_REGION: z.string().default('us-east-1'),

  // Imgproxy Configuration (S1/S7 Enforcement)
  IMGPROXY_KEY: z
    .string()
    .regex(
      /^[0-9a-fA-F]+$/,
      'S1 Violation: IMGPROXY_KEY must be a valid hex-encoded string'
    ),
  IMGPROXY_SALT: z
    .string()
    .regex(
      /^[0-9a-fA-F]+$/,
      'S1 Violation: IMGPROXY_SALT must be a valid hex-encoded string'
    ),
  IMGPROXY_SOURCE_URL: z
    .string()
    .url('S1 Violation: IMGPROXY_SOURCE_URL must be a valid URL')
    .optional(),

  // Meilisearch (S3/S6)
  MEILISEARCH_MASTER_KEY: z.string().optional(),

  // Cloudflare & ACME (S8)
  CF_API_EMAIL: z.string().email().optional(),
  CF_DNS_API_TOKEN: z.string().optional(),
  CF_ZONE_ID: z.string().optional(),
  ACME_EMAIL: z.string().email().optional(),

  // Backup & Infrastructure
  BACKUP_ENCRYPTION_KEY: z.string().optional(),
  PGBOUNCER_ADMIN_USERS: z.string().optional(),

  // Application Settings
  NODE_ENV: z.enum(['development', 'production', 'test']),
  PORT: z.coerce.number().default(3000),

  // Database Docker/Seed Context
  POSTGRES_USER: z.string().optional(),
  POSTGRES_PASSWORD: z.string().optional(),
  POSTGRES_DB: z.string().optional(),

  // Redis Security
  REDIS_PASSWORD: z.string().optional(),

  // Security Secrets (S7/S15 Enforcement)
  API_KEY_SECRET: z.string().refine((key) => {
    if (process.env['NODE_ENV'] === 'production') return key.length >= 32;
    return true;
  }, 'S1 Violation: API_KEY_SECRET too short'),
  API_KEY_SECRET_FILE: z.string().optional(),

  BLIND_INDEX_PEPPER: z.string().refine((key) => {
    if (process.env['NODE_ENV'] === 'production') return key.length >= 32;
    return true;
  }, 'S1 Violation: BLIND_INDEX_PEPPER too short'),
  BLIND_INDEX_PEPPER_FILE: z.string().optional(),

  SESSION_SALT: z.string().refine((key) => {
    if (process.env['NODE_ENV'] === 'production') return key.length >= 32;
    return true;
  }, 'S1 Violation: SESSION_SALT too short'),
  SESSION_SALT_FILE: z.string().optional(),

  INTERNAL_API_SECRET: z.string().optional(),
  INTERNAL_API_SECRET_FILE: z.string().optional(),

  // Next.js Public Vars
  NEXT_PUBLIC_API_URL: z.string().url().optional(),
  INTERNAL_API_URL: z.string().url().optional(),

  // MinIO Root Credentials
  MINIO_ROOT_USER: z.string().optional(),
  MINIO_ROOT_PASSWORD: z.string().optional(),

  // Protocol Controls
  ENABLE_S1_ENFORCEMENT: z.coerce.boolean().default(true),
  SKIP_ENV_VALIDATION: z.coerce.boolean().default(false),
  SKIP_S1_COMPLEXITY_CHECK: z.coerce.boolean().default(false),

  // Rate Limiting (S6)
  RATE_LIMIT_TTL: z.string().default('60'),
  RATE_LIMIT_MAX: z.string().default('100'),
  RATE_LIMIT_HOME: z.string().default('100'),

  // Tenant Isolation (S2)
  TENANT_ISOLATION_MODE: z.enum(['strict', 'flexible']).default('strict'),

  // Error Tracking (S5)
  GLITCHTIP_DSN: z.string().url().optional(),
  ALLOWED_ORIGINS: z.string().optional(),

  // mTLS & Bot Protection (S11)
  MTLS_CERT_PATH: z.string().default('/etc/mtls/certs'),
  HCAPTCHA_SECRET_KEY: z.string().optional(),
  HCAPTCHA_SITE_KEY: z.string().optional(),

  // Gitea & Webhook (S2/S5)
  GITEA_DB_PASSWORD: z.string().optional(),
  WEBHOOK_SECRET: z.string().optional(),

  // Storefront Performance
  HOME_CACHE_TTL: z.string().default('10'),

  // AI & Vector Search
  PGVECTOR_DIMENSION: z.string().default('1536'),
  OPENAI_API_KEY: z.string().optional(),

  // Root Domain Configuration (S2/S8)
  APP_DOMAIN: z.string().default('60sec.shop'),
  APP_ROOT_DOMAIN: z.string().default('60sec.shop'),
});

export type EnvConfig = z.infer<typeof EnvSchema>;
