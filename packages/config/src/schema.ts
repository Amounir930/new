import { z } from 'zod';

/**
 * Zod Schema for Environment Variables (Single Source of Truth)
 * S1 Compliant: Application MUST crash on invalid configuration
 */

const baseSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']),
  PORT: z.coerce.number().default(3000),
  APP_DOMAIN: z.string().default('60sec.shop'),
  APP_ROOT_DOMAIN: z.string().default('60sec.shop'),
});

/**
 * 🛡️ Server-Only Schema
 * Contains sensitive secrets that MUST NEVER reach the client bundle.
 */
export const serverEnvSchema = baseSchema.extend({
  // Critical Security (S1/S7 Enforcement)
  JWT_SECRET: z.string().refine((key) => {
    if (process.env['NODE_ENV'] === 'production') {
      if (process.env['SKIP_S1_COMPLEXITY_CHECK'] === 'true') return true;
      return (
        key.length >= 32 &&
        /[A-Z]/.test(key) &&
        /[a-z]/.test(key) &&
        /[0-9]/.test(key) &&
        /[@$!%*?&]/.test(key)
      );
    }
    return true;
  }, 'S1 Violation: JWT_SECRET lacks required complexity/length (min 32, upper, lower, num, symbol)'),

  ENCRYPTION_MASTER_KEY: z.string().refine((key) => {
    if (process.env['NODE_ENV'] === 'production') {
      if (process.env['SKIP_S1_COMPLEXITY_CHECK'] === 'true') return true;
      return (
        key.length === 32 &&
        !/test|default|example/i.test(key) &&
        /[A-Z]/.test(key) &&
        /[a-z]/.test(key) &&
        /[0-9]/.test(key)
      );
    }
    return true;
  }, 'S1 Violation: ENCRYPTION_MASTER_KEY must be exactly 32 secure characters in production'),

  SUPER_ADMIN_EMAIL: z
    .string()
    .email('S1 Violation: Invalid SUPER_ADMIN_EMAIL format'),
  SUPER_ADMIN_PASSWORD: z
    .string()
    .min(8, 'S1 Violation: SUPER_ADMIN_PASSWORD too weak')
    .optional(),
  SUPER_ADMIN_KEY: z
    .string()
    .min(32, 'S1 Violation: SUPER_ADMIN_KEY must be at least 32 characters')
    .optional(),

  JWT_EXPIRES_IN: z.string().default('7d'),

  // Database Configuration
  DATABASE_URL: z
    .string()
    .url()
    .startsWith('postgresql://', 'S1 Violation: Only PostgreSQL supported')
    .refine((url) => {
      if (process.env['NODE_ENV'] === 'production') {
        if (process.env['DB_SSL_OPTIONAL'] === 'true') return true;
        return url.includes('sslmode=require') || url.includes('ssl=require');
      }
      return true;
    }, 'S1 Violation: DATABASE_URL must require SSL in production'),

  PGHOST: z.string().optional(),
  PGUSER: z.string().optional(),
  PGPASSWORD: z.string().optional(),
  PGDATABASE: z.string().optional(),
  PGPORT: z.string().optional(),
  READ_REPLICA_URL: z.string().optional(),
  DB_SSL_OPTIONAL: z.string().default('false'),
  DB_SSL: z.enum(['true', 'false']).default('true'),
  DB_CA_CERT: z.string().optional(),

  // Redis Configuration
  REDIS_URL: z.string().refine((url) => {
    if (process.env['NODE_ENV'] === 'production') {
      return /rediss?:\/\/[^:]*:[^@]+@/.test(url);
    }
    return true;
  }, 'S1 Violation: REDIS_URL must include credentials in production'),
  REDIS_HOST: z.string().default('localhost'),
  REDIS_PORT: z.string().default('6379'),
  REDIS_PASSWORD: z.string().optional(),

  // MinIO/S3 Configuration
  MINIO_ENDPOINT: z.string().min(1),
  MINIO_PORT: z.string().default('9000'),
  MINIO_USE_SSL: z.enum(['true', 'false']).default('false'),
  MINIO_ACCESS_KEY: z.string().min(3).optional(),
  MINIO_SECRET_KEY: z.string().min(8).optional(),
  MINIO_BUCKET_NAME: z.string().default('apex-assets'),
  MINIO_BUCKET: z.string().default('apex-assets'),
  MINIO_REGION: z.string().default('us-east-1'),
  STORAGE_PUBLIC_URL: z.string().url().default('https://storage.60sec.shop'),
  MINIO_ROOT_USER: z.string().optional(),
  MINIO_ROOT_PASSWORD: z.string().optional(),

  // Imgproxy Configuration
  IMGPROXY_KEY: z
    .string()
    .regex(/^[0-9a-fA-F]+$/, 'S1 Violation: IMGPROXY_KEY must be hex'),
  IMGPROXY_SALT: z
    .string()
    .regex(/^[0-9a-fA-F]+$/, 'S1 Violation: IMGPROXY_SALT must be hex'),
  IMGPROXY_SOURCE_URL: z.string().url().optional(),

  // Meilisearch
  MEILISEARCH_MASTER_KEY: z.string().optional(),

  // Infrastructure & Security Secrets
  // Cloudflare & ACME
  CF_API_EMAIL: z.string().email().optional(),
  CF_DNS_API_TOKEN: z.string().optional(),
  CF_ZONE_ID: z.string().optional(),
  CLOUDFLARE_API_TOKEN: z.string().optional(),
  CLOUDFLARE_ZONE_ID: z.string().optional(),
  ACME_EMAIL: z.string().email().optional(),

  // Rate Limiting
  RATE_LIMIT_TTL: z.string().default('60'),
  RATE_LIMIT_MAX: z.string().default('100'),
  RATE_LIMIT_HOME: z.string().default('100'),

  // Tenant Isolation
  TENANT_ISOLATION_MODE: z.enum(['strict', 'flexible']).default('strict'),

  INTERNAL_API_URL: z.string().url().default('http://api:3000/api/v1'),
  INTERNAL_API_SECRET: z
    .string()
    .min(32, 'S1: INTERNAL_API_SECRET must be 32+ chars')
    .optional(),
  BLIND_INDEX_PEPPER: z.string().default('development-pepper'),
  API_KEY_SECRET: z.string().default('development-api-key-secret'),
  WEBHOOK_SECRET: z.string().default('development-webhook-secret'),
  GLITCHTIP_DSN: z.string().url().optional(),
  ALLOWED_ORIGINS: z.string().optional(),

  // mTLS & Bot Protection
  MTLS_CERT_PATH: z.string().default('/etc/mtls/certs'),
  HCAPTCHA_SECRET_KEY: z.string().optional(),
  HCAPTCHA_SITE_KEY: z.string().optional(),

  // Trusted IP Whitelist (bypasses bot protection and rate limiting)
  ALLOWED_IPS: z.string().optional(),

  // Cloudflare Turnstile (S3: Anti-bot CAPTCHA for public provisioning)
  TURNSTILE_SECRET_KEY: z.string().min(1, 'S1 Violation: TURNSTILE_SECRET_KEY is required'),

  // Transactional Email: Resend (primary provider, AWS SES suspended)
  RESEND_API_KEY: z.string().optional(),
  RESEND_FROM_EMAIL: z.string().email().default('noreply@60sec.shop'),

  // Gitea & Webhook
  GITEA_DB_PASSWORD: z.string().optional(),

  // Performance & AI
  HOME_CACHE_TTL: z.string().default('10'),
  PGVECTOR_DIMENSION: z.string().default('1536'),
  OPENAI_API_KEY: z.string().optional(),

  // Protocol Controls
  ENABLE_S1_ENFORCEMENT: z.coerce.boolean().default(true),
  SKIP_ENV_VALIDATION: z.coerce.boolean().default(false),
  SKIP_S1_COMPLEXITY_CHECK: z.coerce.boolean().default(false),

  // Database Docker/Seed Context
  POSTGRES_USER: z.string().optional(),
  POSTGRES_PASSWORD: z.string().optional(),
  POSTGRES_DB: z.string().optional(),
  PGBOUNCER_ADMIN_USERS: z.string().optional(),
});

/**
 * 🛡️ Client-Safe Schema
 * ONLY variables starting with NEXT_PUBLIC_ are permitted here.
 */
export const clientEnvSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.string().url().optional(),
  NEXT_PUBLIC_API_URL: z.string().url().optional(),
  NEXT_PUBLIC_IMGPROXY_URL: z.string().url().optional(),
  // Cloudflare Turnstile site key (safe to expose to browser)
  NEXT_PUBLIC_TURNSTILE_SITE_KEY: z.string().min(1, 'S1 Violation: NEXT_PUBLIC_TURNSTILE_SITE_KEY is required'),
});

// Combined Schema for validation on server startup
export const EnvSchema = serverEnvSchema.merge(clientEnvSchema);

export type EnvConfig = z.infer<typeof EnvSchema>;
