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
      try {
        const roleId = crypto.randomUUID();

        // S21: Ensure 'Owner' role exists for this tenant
        // We use aCTE or separate check to handle ON CONFLICT properly if we want to retrieve the ID, 
        // but here we generate it. If it exists, we need to find it.
        await db.execute(sql`
          INSERT INTO "staff_roles" ("id", "tenant_id", "name", "is_system", "permissions")
          VALUES (${roleId}, ${storeId}, 'Owner', true, ${JSON.stringify({ scope: '*' })})
          ON CONFLICT ("id", "tenant_id") DO NOTHING
        `);

        // Check if we didn't insert (conflict on name/tenant can also happen if not ID)
        // For simplicity in this seeder, we assume the UUID is unique or we fallback to searching.
        
        const userId = crypto.randomUUID();
        await db.execute(sql`
          INSERT INTO "staff_members" ("tenant_id", "user_id", "role_id", "email", "is_active")
          VALUES (${storeId}, ${userId}, ${roleId}, ${JSON.stringify({ address: adminEmail })}, true)
          ON CONFLICT DO NOTHING
        `);
      } catch (error) {
        // Protocol S5: Log exact underlying error to stdout for debugging
        process.stdout.write(
          `[ERROR] S5 Critical: CoreModule failed to create Admin/Role for ${context.subdomain}. ` +
          `Error: ${error instanceof Error ? error.message : String(error)}\n`
        );
        if (error instanceof Error && error.stack) {
          process.stdout.write(`[DEBUG] Stack: ${error.stack}\n`);
        }
        throw error; // Re-throw to trigger transaction rollback
      }
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
