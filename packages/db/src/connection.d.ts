/**
 * S2: Tenant Isolation Protocol - Connection Management
 * Extracted to break circular dependencies with TenantRegistryService
 */
export declare const publicPool: import("pg").Pool;
export declare const publicDb: import("drizzle-orm/node-postgres").NodePgDatabase<Record<string, never>> & {
    $client: import("pg").Pool;
};
export declare const db: import("drizzle-orm/node-postgres").NodePgDatabase<Record<string, never>> & {
    $client: import("pg").Pool;
};
//# sourceMappingURL=connection.d.ts.map