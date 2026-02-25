import { Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { publicDb } from '../connection.js';
import type { RedisService } from '../redis.service.js';
import { systemSettings as systemConfig } from '../schema/governance.js';

@Injectable()
export class MasterControlService {
  constructor(private readonly redisService: RedisService) {}

  /**
   * Set a global system configuration
   */
  async setConfig(key: string, value: any): Promise<void> {
    await publicDb.insert(systemConfig).values({ config: { [key]: value } });
    // Note: system_settings uses 'config' jsonb, not 'key'/'value' columns like old systemConfig might have.
    // I'll adjust to match the actual schema in governance.ts: system_settings(id, createdAt, updatedAt, config)
  }

  /**
   * Get a global system configuration
   */
  async getConfig<T = any>(key: string, defaultValue: T): Promise<T> {
    const result = await publicDb.select().from(systemConfig).limit(1);

    return (result[0]?.config as any)?.[key] ?? defaultValue;
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
    const payload = {
      enabled,
      message:
        message ||
        'Platform is currently undergoing maintenance. Please try again later.',
    };

    await this.setConfig('master_maintenance', payload);

    // Mandate #19: Propagate via Redis Pub/Sub
    await this.redisService.publish(
      'platform:maintenance',
      JSON.stringify(payload)
    );
  }
}

export const masterControlService = new MasterControlService();
