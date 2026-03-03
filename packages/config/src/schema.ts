import { z } from 'zod';

/**
 * Zod Schema for Environment Variables (Single Source of Truth)
 * Strict validation with no coercion
 */
export const EnvSchema = z.object({
  // Critical Security Variables
  JWT_SECRET: z
    .string()
    .refine((key) => {
      // S1: Mandatory complexity in Production
      if (process.env.NODE_ENV === 'production') {
        if (process.env.SKIP_S1_COMPLEXITY_CHECK === 'true') {
          return process.env.ENABLE_S1_ENFORCEMENT === 'false';
        }
        return key.length >= 32 && /[A-Z]/.test(key) && /[a-z]/.test(key) && /[0-9]/.test(key);
      }
      return true;
    }, 'S1 Violation: JWT_SECRET lacks required complexity or unauthorized bypass in production')
    .optional(),
  JWT_SECRET_FILE: z.string().optional(),
  ENCRYPTION_MASTER_KEY: z
    .string()
    .refine((key) => {
      // S7: Strict Production Validation
      if (process.env.NODE_ENV === 'production') {
        if (process.env.SKIP_S1_COMPLEXITY_CHECK === 'true') {
          return process.env.ENABLE_S1_ENFORCEMENT === 'false';
        }
        return key.length >= 32 && !/test|default|example/i.test(key) && /[A-Z]/.test(key) && /[a-z]/.test(key) && /[0-9]/.test(key);
      }
      return true;
    }, 'S1 Violation: Production key lacks required complexity or unauthorized bypass')
    .optional(),
  ENCRYPTION_MASTER_KEY_FILE: z.string().optional(),

  // S1: Admin Credentials (Strict Validation)
  SUPER_ADMIN_EMAIL: z
    .string()
    .email('S1 Violation: SUPER_ADMIN_EMAIL must be a valid email'),
  SUPER_ADMIN_PASSWORD: z
    .string()
    .min(8, 'S1 Violation: SUPER_ADMIN_PASSWORD must be at least 8 characters')
    .optional(),
  SUPER_ADMIN_PASSWORD_FILE: z.string().optional(),

  JWT_EXPIRES_IN: z.string().default('7d'),

  // Database Configuration
  DATABASE_URL: z
    .string()
    .startsWith('postgresql://', 'S1 Violation: Only PostgreSQL is supported')
    .refine((url) => {
      if (process.env.NODE_ENV === 'production') {
        if (process.env.DB_SSL_OPTIONAL === 'true') return true;
        return url.includes('ssl=require') || url.includes('sslmode=require');
      }
      return true;
    }, 'S1 Violation: DATABASE_URL must require SSL in production (unless DB_SSL_OPTIONAL=true)')
    .optional(),
  DATABASE_URL_FILE: z.string().optional(),
  DB_SSL_OPTIONAL: z.string().default('false'),
  DB_SSL: z.enum(['true', 'false']).default('true'),
  DB_CA_CERT: z.string().optional(),
  READ_REPLICA_URL: z.string().optional(),

  // Redis Configuration
  REDIS_URL: z
    .string()
    .refine((url) => {
      if (process.env.NODE_ENV === 'production') {
        // Enforce password in production (redis://:password@host:port)
        return /redis:\/\/[^:]*:[^@]+@/.test(url);
      }
      return true;
    }, 'S1 Violation: REDIS_URL must include a password in production')
    .optional(),
  REDIS_URL_FILE: z.string().optional(),
  REDIS_HOST: z.string().default('localhost'),
  REDIS_PORT: z.string().default('6379'),

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

  PORT: z.coerce.number().default(3000),

  // Database Docker/Seed Context
  POSTGRES_USER: z.string().optional(),
  POSTGRES_PASSWORD: z.string().optional(),
  POSTGRES_DB: z.string().optional(),

  // Redis Security
  REDIS_PASSWORD: z.string().optional(),

  // Security Secrets (S7)
  API_KEY_SECRET: z
    .string()
    .refine((key) => {
      if (process.env.NODE_ENV === 'production') {
        if (process.env.SKIP_S1_COMPLEXITY_CHECK === 'true') {
          return process.env.ENABLE_S1_ENFORCEMENT === 'false';
        }
        return key.length >= 32 && /[A-Z]/.test(key) && /[a-z]/.test(key) && /[0-9]/.test(key);
      }
      return true;
    }, 'S1 Violation: API_KEY_SECRET lacks required complexity or unauthorized bypass in production')
    .optional(),
  API_KEY_SECRET_FILE: z.string().optional(),

  BLIND_INDEX_PEPPER: z
    .string()
    .refine((key) => {
      if (process.env.NODE_ENV === 'production') {
        if (process.env.SKIP_S1_COMPLEXITY_CHECK === 'true') {
          return process.env.ENABLE_S1_ENFORCEMENT === 'false';
        }
        return (
          key.length >= 32 &&
          /[A-Z]/.test(key) &&
          /[a-z]/.test(key) &&
          /[0-9]/.test(key) &&
          /[@$!%*?&#/=_+.-]/.test(key)
        );
      }
      return true;
    }, 'S1 Violation: BLIND_INDEX_PEPPER lacks required complexity or unauthorized bypass in production')
    .optional(),
  BLIND_INDEX_PEPPER_FILE: z.string().optional(),

  SESSION_SALT: z
    .string()
    .refine((key) => {
      if (process.env.NODE_ENV === 'production') {
        if (process.env.SKIP_S1_COMPLEXITY_CHECK === 'true') {
          return process.env.ENABLE_S1_ENFORCEMENT === 'false';
        }
        return (
          key.length >= 32 &&
          /[A-Z]/.test(key) &&
          /[a-z]/.test(key) &&
          /[0-9]/.test(key) &&
          /[@$!%*?&#/=_+.-]/.test(key)
        );
      }
      return true;
    }, 'S1 Violation: SESSION_SALT lacks required complexity or unauthorized bypass in production')
    .optional(),
  SESSION_SALT_FILE: z.string().optional(),

  INTERNAL_API_SECRET: z
    .string()
    .optional(),
  INTERNAL_API_SECRET_FILE: z.string().optional(),

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
  ALLOWED_ORIGINS: z
    .string()
    .refine((val) => {
      if (process.env.NODE_ENV === 'production') {
        return val !== '*';
      }
      return true;
    }, 'S8 Violation: ALLOWED_ORIGINS cannot be "*" in production')
    .optional(),

  // mTLS Configuration
  MTLS_CERT_PATH: z.string().default('/etc/mtls/certs'),
  HCAPTCHA_SECRET_KEY: z.string().optional(),
  HCAPTCHA_SITE_KEY: z.string().optional(),

  // Gitea & Webhook (S2/S5)
  GITEA_DB_PASSWORD: z.string().optional(),
  WEBHOOK_SECRET: z.string().optional(),

  // Storefront Performance (BR-01-SEC)
  HOME_CACHE_TTL: z.string().default('10'),

  // AI & Vector Search (BR-03-SEC)
  PGVECTOR_DIMENSION: z.string().default('1536'),
  OPENAI_API_KEY: z.string().optional(),

  // Root Domain Configuration (S2)
  APP_DOMAIN: z.string().default('60sec.shop'),
  APP_ROOT_DOMAIN: z.string().default('60sec.shop'),
});

export type EnvConfig = z.infer<typeof EnvSchema>;
