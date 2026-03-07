/**
 * Core Module
 * Seeds admin users, default settings, and basic pages
 */

import {
  pagesInStorefront,
  staffMembersInStorefront,
  staffRolesInStorefront,
  tenantConfigInStorefront,
} from '@apex/db';
import type { BlueprintConfig, BlueprintContext, SeederModule } from '../types';

export class CoreModule implements SeederModule {
  name = 'core';

  async run(context: BlueprintContext, config: BlueprintConfig): Promise<void> {
    const { db, adminEmail, storeId } = context;

    // 1. Create Admin User (S2/S7 Protocol - external auth mapping)
    if (adminEmail && storeId) {
      const roleId = crypto.randomUUID();

      await db
        .insert(staffRolesInStorefront)
        .values({
          id: roleId,
          tenantId: storeId,
          name: 'Owner',
          isSystem: true,
          permissions: { scope: '*' },
        })
        .onConflictDoNothing();

      await db
        .insert(staffMembersInStorefront)
        .values({
          tenantId: storeId,
          userId: crypto.randomUUID(), // Placeholder for external auth logic
          roleId,
          email: adminEmail,
          isActive: true,
        })
        .onConflictDoNothing();
    }

    // 2. Initial Settings (S21 Protocol)
    if (config.settings) {
      const settingsEntries = Object.entries(config.settings).map(
        ([key, value]) => ({
          key,
          value,
          tenantId: storeId!,
        })
      );

      if (settingsEntries.length > 0) {
        await db
          .insert(tenantConfigInStorefront)
          .values(settingsEntries)
          .onConflictDoNothing();
      }
    }

    // 3. Essential Pages (Legal, About)
    if (config.pages && config.pages.length > 0) {
      const pageEntries = config.pages.map((p) => ({
        id: p.id,
        tenantId: storeId!,
        slug: p.slug,
        title: { ar: p.title, en: p.title },
        content: p.content ? { ar: p.content, en: p.content } : null,
        isPublished: p.isPublished ?? true,
        pageType: p.pageType || 'custom',
        template: p.template || 'default',
      }));

      await db
        .insert(pagesInStorefront)
        .values(pageEntries)
        .onConflictDoNothing();
    }
  }
}
