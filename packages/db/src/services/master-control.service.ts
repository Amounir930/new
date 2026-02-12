/**
 * Master Control Service (Rule 2: S2 Compliance)
 *
 * Global platform management for Super Admins.
 * Handles system-wide toggles and maintenance mode.
 *
 * @module @apex/db/services/master-control.service
 */

import { eq } from 'drizzle-orm';
import { db } from '../connection';
import { systemConfig } from '../schema/governance';

export class MasterControlService {
  /**
   * Set a global system configuration
   */
  async setConfig(key: string, value: any): Promise<void> {
    await db
      .insert(systemConfig)
      .values({ key, value, updatedAt: new Date() })
      .onConflictDoUpdate({
        target: systemConfig.key,
        set: { value, updatedAt: new Date() },
      });
  }

  /**
   * Get a global system configuration
   */
  async getConfig<T = any>(key: string, defaultValue: T): Promise<T> {
    const result = await db
      .select()
      .from(systemConfig)
      .where(eq(systemConfig.key, key))
      .limit(1);

    return (result[0]?.value as T) ?? defaultValue;
  }

  /**
   * Check if the platform is in Master Maintenance Mode
   */
  async isMaintenanceMode(): Promise<boolean> {
    const config = await this.getConfig<{ enabled: boolean }>(
      'master_maintenance',
      { enabled: false }
    );
    return config.enabled;
  }

  /**
   * Toggle Master Maintenance Mode
   */
  async toggleMaintenance(enabled: boolean, message?: string): Promise<void> {
    await this.setConfig('master_maintenance', {
      enabled,
      message:
        message ||
        'Platform is currently undergoing maintenance. Please try again later.',
      updatedAt: new Date().toISOString(),
    });
  }
}

export const masterControlService = new MasterControlService();
