import { type Tenant } from './schema.js';
/**
 * S2: Tenant Registry Service
 * The ONLY authorized service for accessing the Global Registry.
 * Encapsulates ORM-based access to prevent raw SQL leaks in business logic.
 */
export declare class TenantRegistryService {
    /**
     * Check if a tenant exists by id or subdomain
     */
    exists(identifier: string): Promise<boolean>;
    /**
     * Get tenant metadata by subdomain
     */
    getBySubdomain(subdomain: string): Promise<Tenant | null>;
    /**
     * Register a new tenant in the registry
     */
    register(data: {
        subdomain: string;
        name: string;
        plan: 'free' | 'basic' | 'pro' | 'enterprise';
        status?: string;
    }): Promise<Tenant>;
}
//# sourceMappingURL=tenant-registry.service.d.ts.map