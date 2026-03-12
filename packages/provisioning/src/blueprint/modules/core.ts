/**
 * Core Module
 * Seeds admin users, default settings, and basic pages
 */

// 🛡️ Zero-Any: Imports kept as comments for documentation of mapped tables
// pagesInStorefront, staffMembersInStorefront, staffRolesInStorefront, tenantConfigInStorefront
import { encrypt } from '@apex/security';
import type { BlueprintConfig, BlueprintContext, SeederModule } from '../types';

export class CoreModule implements SeederModule {
  name = 'core';

  async run(context: BlueprintContext, config: BlueprintConfig): Promise<void> {
    const { adminEmail, storeId } = context;
    const { sql } = await import('drizzle-orm');

    if (adminEmail && storeId) {
      await this.ensureAdminPermissions(context, adminEmail, sql);
    }

    if (config.settings) {
      await this.seedSettings(context, config.settings, sql);
    }

    if (config.pages && config.pages.length > 0) {
      await this.seedPages(context, config.pages, sql);
    }
  }

  private async ensureAdminPermissions(
    context: BlueprintContext,
    adminEmail: string,
    sql: any
  ): Promise<void> {
    const { db, schema } = context;
    try {
      const roleId = crypto.randomUUID();
      await db.execute(sql`
        INSERT INTO ${sql.identifier(schema)}."staff_roles" ("id", "name", "is_system", "permissions")
        VALUES (${roleId}, 'Owner', true, ${JSON.stringify({ scope: '*' })})
        ON CONFLICT ("id") DO NOTHING
      `);

      const userId = context.adminId || crypto.randomUUID();

      const encResult = encrypt(adminEmail);
      const emailPayload = {
        enc: encResult.enc,
        iv: encResult.iv,
        tag: encResult.tag,
        data: encResult.data,
      };

      await db.execute(sql`
        INSERT INTO ${sql.identifier(schema)}."staff_members" ("user_id", "role_id", "email", "is_active")
        VALUES (${userId}, ${roleId}, ${JSON.stringify(emailPayload)}, true)
        ON CONFLICT DO NOTHING
      `);
    } catch (error) {
      process.stdout.write(
        `[ERROR] S5 Critical: CoreModule failed to create Admin/Role for ${context.subdomain}. ` +
          `Error: ${error instanceof Error ? error.message : String(error)}\n`
      );
      throw error;
    }
  }

  private async seedSettings(
    context: BlueprintContext,
    settings: Record<string, any>,
    sql: any
  ): Promise<void> {
    const { db, schema } = context;
    for (const [key, value] of Object.entries(settings)) {
      await db.execute(sql`
        INSERT INTO ${sql.identifier(schema)}."tenant_config" ("key", "value", "updated_at")
        VALUES (${key}, ${JSON.stringify(value)}, now())
        ON CONFLICT ("key") DO NOTHING
      `);
    }
  }

  private async seedPages(
    context: BlueprintContext,
    pages: any[],
    sql: any
  ): Promise<void> {
    const { db, schema } = context;
    for (const p of pages) {
      await db.execute(sql`
        INSERT INTO ${sql.identifier(schema)}."pages" ("id", "slug", "title", "content", "is_published", "page_type", "template", "created_at", "updated_at")
        VALUES (${p.id || crypto.randomUUID()}, ${p.slug}, 
                ${JSON.stringify({ ar: p.title, en: p.title })}, 
                ${p.content ? JSON.stringify({ ar: p.content, en: p.content }) : null}, 
                ${p.isPublished ?? true}, ${p.pageType || 'custom'}, ${p.template || 'default'}, 
                now(), now())
        ON CONFLICT ("id") DO NOTHING
      `);
    }
  }
}
