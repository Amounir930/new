import { pages, settings, users } from '@apex/db';
import { encrypt, hashSensitiveData } from '@apex/security';
import type {
  BlueprintConfig,
  BlueprintContext,
  SeederModule,
} from '../types.js';

export class CoreModule implements SeederModule {
  name = 'core';
  allowedPlans: string[] | '*' = '*'; // Core is allowed for all plans

  async run(ctx: BlueprintContext, config: BlueprintConfig) {
    if (!config.modules.core) {
      console.log(`[CoreModule] Skipping Core module (not requested).`);
      return;
    }

    // 1. Ensure Store Record Exists
    // Note: Store might be created by Runner, but we check/update here
    // For now we assume runner created it, or we rely on the implementation in seeder.ts to have done it
    // But in a pure modular approach, Core should handle it.
    // However, runner.ts inserts store to get storeId.
    // Let's focus on Admin User and Settings for now as per original `seeder.ts` refactoring plan.

    // 2. Admin User
    await this.seedAdminUser(ctx);

    // 3. Settings
    await this.seedSettings(ctx, config.settings || {});

    // 4. Pages (Legacy support from config.pages)
    if (config.pages && config.pages.length > 0) {
      await this.seedPages(ctx, config.pages);
    }
  }

  private async seedAdminUser(ctx: BlueprintContext) {
    // S7: Encrypting PII (Email)
    // We expect adminEmail to be present in the context

    const masterKey =
      process.env.ENCRYPTION_MASTER_KEY ||
      'test-master-key-must-be-32-bytes-length!!';
    const encryptedEmail = JSON.stringify(encrypt(ctx.adminEmail, masterKey));
    const emailHash = hashSensitiveData(ctx.adminEmail);

    await ctx.db
      .insert(users)
      .values({
        email: encryptedEmail,
        emailHash: emailHash,
        role: 'admin',
        status: 'active',
      })
      .onConflictDoNothing(); // Idempotent
  }

  private async seedSettings(
    ctx: BlueprintContext,
    settingsData: Record<string, any>
  ) {
    const settingsToSeed = Object.entries(settingsData).map(([key, value]) => ({
      key,
      value: String(value),
    }));

    if (settingsToSeed.length > 0) {
      await ctx.db
        .insert(settings)
        .values(settingsToSeed)
        .onConflictDoNothing();
    }
  }

  private async seedPages(ctx: BlueprintContext, pagesList: any[]) {
    await ctx.db
      .insert(pages)
      .values(
        pagesList.map((p) => ({
          ...p,
          content: p.content || '',
        }))
      )
      .onConflictDoNothing();
  }
}
