import { z } from 'zod';

/**
 * 🛡️ Edge Runtime Environment Schema
 * S1 Compliant: Validates only what Edge Runtime needs (JWT_SECRET, public vars).
 * Does NOT use Node.js APIs (fs, process.exit, Buffer).
 * Safe to import in Next.js middleware and Edge functions.
 */
const edgeEnvSchema = z.object({
  JWT_SECRET: z.string().min(1, 'S1 Violation: JWT_SECRET is required'),
  NEXT_PUBLIC_APP_URL: z.string().url().optional(),
  NEXT_PUBLIC_API_URL: z.string().url().optional(),
  NEXT_PUBLIC_IMGPROXY_URL: z.string().url().optional(),
  INTERNAL_API_URL: z.string().url().default('http://api:3000/api/v1'),
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
});

export type EdgeEnvConfig = z.infer<typeof edgeEnvSchema>;

/**
 * 🏗️ Edge Environment Validation
 * S1: Validates secrets needed in the Edge Runtime.
 * Throws a descriptive error on misconfiguration to prevent silent failures.
 */
function validateEdgeEnv(): EdgeEnvConfig {
  const result = edgeEnvSchema.safeParse({
    JWT_SECRET: process.env['JWT_SECRET'],
    NEXT_PUBLIC_APP_URL: process.env['NEXT_PUBLIC_APP_URL'],
    NEXT_PUBLIC_API_URL: process.env['NEXT_PUBLIC_API_URL'],
    NEXT_PUBLIC_IMGPROXY_URL: process.env['NEXT_PUBLIC_IMGPROXY_URL'],
    INTERNAL_API_URL: process.env['INTERNAL_API_URL'],
    NODE_ENV: process.env['NODE_ENV'],
  });

  if (!result.success) {
    // S5: Throw a descriptive error but do not expose raw details
    throw new Error(
      `S1 Violation: Edge environment misconfigured. ${result.error.issues.map((i) => i.message).join(', ')}`
    );
  }

  return result.data;
}

export const env = validateEdgeEnv();
