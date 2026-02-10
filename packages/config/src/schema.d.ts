import { z } from 'zod';
/**
 * Zod Schema for Environment Variables (Single Source of Truth)
 * Strict validation with no coercion
 */
export declare const EnvSchema: z.ZodObject<{
    JWT_SECRET: z.ZodString;
    JWT_EXPIRES_IN: z.ZodDefault<z.ZodString>;
    DATABASE_URL: z.ZodString;
    REDIS_URL: z.ZodDefault<z.ZodString>;
    MINIO_ENDPOINT: z.ZodString;
    MINIO_PORT: z.ZodDefault<z.ZodString>;
    MINIO_USE_SSL: z.ZodDefault<z.ZodEnum<["true", "false"]>>;
    MINIO_ACCESS_KEY: z.ZodString;
    MINIO_SECRET_KEY: z.ZodString;
    MINIO_BUCKET_NAME: z.ZodDefault<z.ZodString>;
    MINIO_REGION: z.ZodDefault<z.ZodString>;
    NODE_ENV: z.ZodDefault<z.ZodEnum<["development", "production", "test"]>>;
    PORT: z.ZodDefault<z.ZodString>;
    POSTGRES_USER: z.ZodOptional<z.ZodString>;
    POSTGRES_PASSWORD: z.ZodOptional<z.ZodString>;
    POSTGRES_DB: z.ZodOptional<z.ZodString>;
    REDIS_PASSWORD: z.ZodOptional<z.ZodString>;
    MINIO_ROOT_USER: z.ZodOptional<z.ZodString>;
    MINIO_ROOT_PASSWORD: z.ZodOptional<z.ZodString>;
    ENABLE_S1_ENFORCEMENT: z.ZodDefault<z.ZodString>;
    RATE_LIMIT_TTL: z.ZodDefault<z.ZodString>;
    RATE_LIMIT_MAX: z.ZodDefault<z.ZodString>;
    TENANT_ISOLATION_MODE: z.ZodDefault<z.ZodEnum<["strict", "flexible"]>>;
}, "strip", z.ZodTypeAny, {
    JWT_SECRET: string;
    JWT_EXPIRES_IN: string;
    DATABASE_URL: string;
    REDIS_URL: string;
    MINIO_ENDPOINT: string;
    MINIO_PORT: string;
    MINIO_USE_SSL: "false" | "true";
    MINIO_ACCESS_KEY: string;
    MINIO_SECRET_KEY: string;
    MINIO_BUCKET_NAME: string;
    MINIO_REGION: string;
    NODE_ENV: "development" | "production" | "test";
    PORT: string;
    ENABLE_S1_ENFORCEMENT: string;
    RATE_LIMIT_TTL: string;
    RATE_LIMIT_MAX: string;
    TENANT_ISOLATION_MODE: "strict" | "flexible";
    POSTGRES_USER?: string | undefined;
    POSTGRES_PASSWORD?: string | undefined;
    POSTGRES_DB?: string | undefined;
    REDIS_PASSWORD?: string | undefined;
    MINIO_ROOT_USER?: string | undefined;
    MINIO_ROOT_PASSWORD?: string | undefined;
}, {
    JWT_SECRET: string;
    DATABASE_URL: string;
    MINIO_ENDPOINT: string;
    MINIO_ACCESS_KEY: string;
    MINIO_SECRET_KEY: string;
    JWT_EXPIRES_IN?: string | undefined;
    REDIS_URL?: string | undefined;
    MINIO_PORT?: string | undefined;
    MINIO_USE_SSL?: "false" | "true" | undefined;
    MINIO_BUCKET_NAME?: string | undefined;
    MINIO_REGION?: string | undefined;
    NODE_ENV?: "development" | "production" | "test" | undefined;
    PORT?: string | undefined;
    POSTGRES_USER?: string | undefined;
    POSTGRES_PASSWORD?: string | undefined;
    POSTGRES_DB?: string | undefined;
    REDIS_PASSWORD?: string | undefined;
    MINIO_ROOT_USER?: string | undefined;
    MINIO_ROOT_PASSWORD?: string | undefined;
    ENABLE_S1_ENFORCEMENT?: string | undefined;
    RATE_LIMIT_TTL?: string | undefined;
    RATE_LIMIT_MAX?: string | undefined;
    TENANT_ISOLATION_MODE?: "strict" | "flexible" | undefined;
}>;
export type EnvConfig = z.infer<typeof EnvSchema>;
//# sourceMappingURL=schema.d.ts.map