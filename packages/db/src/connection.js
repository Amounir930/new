/**
 * S2: Tenant Isolation Protocol - Connection Management
 * Extracted to break circular dependencies with TenantRegistryService
 */
import { validateEnv } from '@apex/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import pkg from 'pg';
const { Pool } = pkg;
let env;
try {
    env = validateEnv();
}
catch (error) {
    console.error('🚨 [S2 BOOTSTRAP PANIC] Environment validation failed during module evaluation:');
    console.error(error.message);
    throw error;
}
const poolConfig = {
    connectionString: env.DATABASE_URL,
    ssl: env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
};
if (process.env.POSTGRES_USER)
    poolConfig.user = process.env.POSTGRES_USER;
if (process.env.POSTGRES_PASSWORD)
    poolConfig.password = process.env.POSTGRES_PASSWORD;
if (process.env.POSTGRES_DB)
    poolConfig.database = process.env.POSTGRES_DB;
// Connection pool for public schema (tenant management)
export const publicPool = new Pool(poolConfig);
// Drizzle instance for public schema
export const publicDb = drizzle(publicPool);
//# sourceMappingURL=connection.js.map