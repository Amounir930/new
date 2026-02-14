/**
 * Master Control Service (Rule 2: S2 Compliance)
 *
 * Global platform management for Super Admins.
 * Handles system-wide toggles and maintenance mode.
 *
 * @module @apex/db/services/master-control.service
 */
export declare class MasterControlService {
    /**
     * Set a global system configuration
     */
    setConfig(key: string, value: any): Promise<void>;
    /**
     * Get a global system configuration
     */
    getConfig<T = any>(key: string, defaultValue: T): Promise<T>;
    /**
     * Check if the platform is in Master Maintenance Mode
     */
    isMaintenanceMode(): Promise<boolean>;
    /**
     * Toggle Master Maintenance Mode
     */
    toggleMaintenance(enabled: boolean, message?: string): Promise<void>;
}
export declare const masterControlService: MasterControlService;
//# sourceMappingURL=master-control.service.d.ts.map