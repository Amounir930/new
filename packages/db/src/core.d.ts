/**
 * S2: Tenant Isolation Protocol - Core Logic
 */
/**
 * Verify tenant exists before allowing connection
 * S2: Prevents access to non-existent tenant schemas
 */
export declare function verifyTenantExists(tenantId: string): Promise<boolean>;
/**
 * Execute operation within tenant context using shared pool
 * S2: Verifies tenant validity before connection
 */
export declare function withTenantConnection<T>(tenantId: string, operation: (db: any) => Promise<T>): Promise<T>;
/**
 * Create a Drizzle instance for a specific tenant
 * Note: For production, use withTenantConnection for proper isolation.
 * This helper is for one-off operations like seeding.
 */
export declare function createTenantDb(_tenantId: string): import("drizzle-orm/node-postgres").NodePgDatabase<Record<string, never>> & {
    $client: import("pg").Pool;
};
//# sourceMappingURL=core.d.ts.map