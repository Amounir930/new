var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Injectable } from '@nestjs/common';
import { eq, or } from 'drizzle-orm';
import { publicDb } from './connection.js';
import { tenants } from './schema.js';
/**
 * S2: Tenant Registry Service
 * The ONLY authorized service for accessing the Global Registry.
 * Encapsulates ORM-based access to prevent raw SQL leaks in business logic.
 */
let TenantRegistryService = class TenantRegistryService {
    /**
     * Check if a tenant exists by id or subdomain
     */
    async exists(identifier) {
        const result = await publicDb
            .select({ count: tenants.id })
            .from(tenants)
            .where(or(eq(tenants.id, identifier), eq(tenants.subdomain, identifier)))
            .limit(1);
        return result.length > 0;
    }
    /**
     * Get tenant metadata by subdomain
     */
    async getBySubdomain(subdomain) {
        const result = await publicDb
            .select()
            .from(tenants)
            .where(eq(tenants.subdomain, subdomain))
            .limit(1);
        return result[0] || null;
    }
    /**
     * Get tenant metadata by ID or subdomain
     */
    async getByIdentifier(identifier) {
        const result = await publicDb
            .select()
            .from(tenants)
            .where(or(eq(tenants.id, identifier), eq(tenants.subdomain, identifier)))
            .limit(1);
        return result[0] || null;
    }
    /**
     * Register a new tenant in the registry
     */
    async register(data) {
        const [newTenant] = await publicDb
            .insert(tenants)
            .values({
            subdomain: data.subdomain,
            name: data.name,
            plan: data.plan,
            status: data.status || 'active',
        })
            .returning();
        return newTenant;
    }
    /**
     * Update tenant status (active, suspended, etc.)
     */
    async updateStatus(tenantId, status) {
        await publicDb
            .update(tenants)
            .set({ status, updatedAt: new Date() })
            .where(eq(tenants.id, tenantId));
    }
    /**
     * Update tenant subscription plan
     */
    async updatePlan(tenantId, plan) {
        await publicDb
            .update(tenants)
            .set({ plan, updatedAt: new Date() })
            .where(eq(tenants.id, tenantId));
    }
};
TenantRegistryService = __decorate([
    Injectable()
], TenantRegistryService);
export { TenantRegistryService };
//# sourceMappingURL=tenant-registry.service.js.map