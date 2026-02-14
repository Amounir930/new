/**
 * Master Blueprint Service
 *
 * Unified service for managing the "Store Brain" data (PDP, Quick View, Cart, Checkout).
 */
import { type MasterBlueprint } from '@apex/validators';
import { type Category } from '../schema/storefront';
export declare class MasterBlueprintService {
    /**
     * Get the complete Master Blueprint for a tenant
     */
    /**
     * Get the complete Master Blueprint for a tenant
     */
    getMasterBlueprint(tenantId: string): Promise<MasterBlueprint>;
    /**
     * Update PDP Configuration
     */
    updatePDP(_tenantId: string, pdpData: any): Promise<void>;
    /**
     * Update Shipping Zones
     */
    updateShippingZone(zone: any): Promise<void>;
    /**
     * Update Store Location
     */
    saveLocation(location: any): Promise<void>;
    /**
     * Update Category Blueprint (SEO & Banner)
     */
    updateCategoryBlueprint(categoryId: string, data: Partial<Category>): Promise<void>;
}
export declare const masterBlueprintService: MasterBlueprintService;
//# sourceMappingURL=master-blueprint.service.d.ts.map