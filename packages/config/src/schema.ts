import { z } from 'zod';

/**
 * Zod Schema for Environment Variables (Single Source of Truth)
 * Strict validation with no coercion
 */
export const EnvSchema = z.object({
  // Critical Security Variables
  JWT_SECRET: z.string().optional().default('short'),
  ENCRYPTION_MASTER_KEY: z.string().optional().default('short'),

  // S1: Admin Credentials
  SUPER_ADMIN_EMAIL: z.string().email().optional().default('admin@60sec.shop'),
  SUPER_ADMIN_PASSWORD: z.string().optional().default('123456'),

  JWT_EXPIRES_IN: z.string().default('7d'),

  // Database Configuration
  DATABASE_URL: z
    .string()
    .url('S1 Violation: DATABASE_URL must be a valid URL')
    .startsWith('postgresql://', 'S1 Violation: Only PostgreSQL is supported'),
  DB_SSL: z.enum(['true', 'false']).default('true'),

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

  // Error Tracking (S5)
  GLITCHTIP_DSN: z
    .string()
    .url('S1 Violation: GLITCHTIP_DSN must be a valid URL')
    .optional(),
});

export type EnvConfig = z.infer<typeof EnvSchema>;
