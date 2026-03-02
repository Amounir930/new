/**
 * Core Module
 * Seeds admin users, default settings, and basic pages
 */

import {
  pagesInStorefront,
  staffMembersInStorefront,
  tenantConfigInStorefront,
} from '@apex/db';
import type {
  BlueprintConfig,
  BlueprintContext,
  SeederModule,
} from '../types.js';

export class CoreModule implements SeederModule {
  name = 'core';

  async run(context: BlueprintContext, config: BlueprintConfig): Promise<void> {
    const { db, adminEmail, password, storeId } = context;

    // 1. Create Admin User (S2/S7 Protocol)
    if (adminEmail && storeId) {
      await db
        .insert(staffMembersInStorefront)
        .values({
          email: adminEmail,
          password: password || 'change-me-later', // Password should be hashed before calling seeder
          role: 'admin',
          status: 'active',
          tenantId: storeId, // Ensure tenant affiliation
        } as any)
        .onConflictDoNothing();
    }

    // 2. Initial Settings (S21 Protocol)
    if (config.settings) {
      const settingsEntries = Object.entries(config.settings).map(
        ([key, value]) => ({
          key,
          value: String(value),
          tenantId: storeId,
        })
      );

      if (settingsEntries.length > 0) {
        await db
          .insert(tenantConfigInStorefront)
          .values(settingsEntries as any)
          .onConflictDoNothing();
      }
    }

    // 3. Essential Pages (Legal, About)
    if (config.pages && config.pages.length > 0) {
      const pageEntries = (config.pages as any[]).map((p: any) => ({
        ...p,
        tenantId: storeId,
      }));

      await db
        .insert(pagesInStorefront)
        .values(pageEntries as any)
        .onConflictDoNothing();
    }
  }
}
