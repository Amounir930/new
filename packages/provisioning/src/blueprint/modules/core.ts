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
    const { sql } = await import('drizzle-orm');

    if (adminEmail && storeId) {
      const roleId = crypto.randomUUID();

      await db.execute(sql`
        INSERT INTO "staff_roles" ("id", "tenant_id", "name", "is_system", "permissions")
        VALUES (${roleId}, ${storeId}, 'Owner', true, ${JSON.stringify({ scope: '*' })})
        ON CONFLICT DO NOTHING
      `);

      await db.execute(sql`
        INSERT INTO "staff_members" ("tenant_id", "user_id", "role_id", "email", "is_active")
        VALUES (${storeId}, ${crypto.randomUUID()}, ${roleId}, ${JSON.stringify({ address: adminEmail })}, true)
        ON CONFLICT DO NOTHING
      `);
    }

    // 2. Initial Settings (S21 Protocol)
    if (config.settings) {
      for (const [key, value] of Object.entries(config.settings)) {
        await db.execute(sql`
          INSERT INTO "tenant_config" ("key", "tenant_id", "value", "updated_at")
          VALUES (${key}, ${storeId}, ${JSON.stringify(value)}, now())
          ON CONFLICT DO NOTHING
        `);
      }
    }

    // 3. Essential Pages (Legal, About)
    if (config.pages && config.pages.length > 0) {
      for (const p of config.pages) {
        await db.execute(sql`
          INSERT INTO "_pages" ("id", "tenant_id", "slug", "title", "content", "is_published", "page_type", "template", "created_at", "updated_at")
          VALUES (${p.id || crypto.randomUUID()}, ${storeId}, ${p.slug}, 
                  ${JSON.stringify({ ar: p.title, en: p.title })}, 
                  ${p.content ? JSON.stringify({ ar: p.content, en: p.content }) : null}, 
                  ${p.isPublished ?? true}, ${p.pageType || 'custom'}, ${p.template || 'default'}, 
                  now(), now())
          ON CONFLICT DO NOTHING
        `);
      }
    }
  }
}
