/**
 * Ecommerce Module
 * Seeds ecommerce-specific settings and configurations
 */

import { sql } from '@apex/db';
import type { BlueprintConfig, BlueprintContext, SeederModule } from '../types';

export class EcommerceModule implements SeederModule {
  name = 'ecommerce';

  async run(context: BlueprintContext, config: BlueprintConfig): Promise<void> {
    const { db, schema } = context;

    // S21: Default Ecommerce Settings
    const defaultSettings = {
      store_currency: config.settings?.currency || 'USD',
      tax_enabled: true,
      inventory_tracking: true,
      shipping_methods: ['standard'],
    };

    process.stdout.write(
      `[EcommerceModule] Seeding default settings for ${context.subdomain}`
    );

    for (const [key, value] of Object.entries(defaultSettings)) {
      await db.execute(sql`
        INSERT INTO ${sql.identifier(schema)}."tenant_config" ("key", "value", "updated_at")
        VALUES (${key}, ${JSON.stringify(value)}, now())
        ON CONFLICT ("key") DO NOTHING
      `);
    }
  }
}
