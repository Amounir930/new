/**
 * Governance Service (Rule 2: S2 Compliance)
 *
 * Centralized logic for enforcing tenant quotas and feature gates.
 *
 * @module @apex/db/services/governance.service
 */
export declare class GovernanceService {
    /**
     * Get effective limits for a tenant (Plan base + overrides)
     */
    getTenantLimits(tenantId: string): Promise<{
        maxProducts: number;
        maxOrders: number;
        maxPages: number;
        storageLimitGb: number;
    }>;
    /**
     * Check if a tenant has reached their quota for a resource
     */
    checkQuota(tenantId: string, resourceType: 'products' | 'orders' | 'pages', currentCount: number): Promise<{
        allowed: boolean;
        limit: number;
    }>;
    /**
     * Verify if a specific feature is enabled for a tenant
     */
    isFeatureEnabled(tenantId: string, featureKey: string): Promise<boolean>;
}
export declare const governanceService: GovernanceService;
//# sourceMappingURL=governance.service.d.ts.map