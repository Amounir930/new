/**
 * Snapshot Manager
 * Creates blueprint snapshots from live tenants
 */

import {
  adminDb,
  getTenantDb,
  onboardingBlueprintsInGovernance,
  pagesInStorefront,
  tenantConfigInStorefront,
} from '@apex/db';
import type { BlueprintTemplate } from './blueprint/types';

/**
 * Capture a snapshot of current tenant state
 */
export async function createSnapshot(
  tenantId: string,
  options: {
    name: string;
    description?: string;
    isDefault?: boolean;
    plan?: 'free' | 'basic' | 'pro' | 'enterprise';
  }
): Promise<string> {
  const { db, release } = await getTenantDb(tenantId);

  try {
    // 1. Capture Settings
    const settingsRows = await db.select().from(tenantConfigInStorefront);
    const settingsMap: Record<string, string> = {};
    settingsRows.forEach((row) => {
      settingsMap[row.key] =
        typeof row.value === 'string' ? row.value : JSON.stringify(row.value);
    });

    // 2. Capture Pages
    const pagesRows = await db.select().from(pagesInStorefront);
    const pagesMapped = pagesRows.map((p) => ({
      id: p.id,
      title: typeof p.title === 'string' ? p.title : JSON.stringify(p.title),
      slug: p.slug,
      content:
        typeof p.content === 'string'
          ? p.content
          : p.content
            ? JSON.stringify(p.content)
            : undefined,
      isPublished: p.isPublished,
    }));

    // 3. Construct Blueprint
    const blueprint: BlueprintTemplate = {
      name: options.name,
      version: '1.0',
      modules: {
        core: {
          siteName: settingsMap.site_name || 'My Store',
          currency: settingsMap.currency || 'USD',
        },
      },
      settings: settingsMap,
      pages: pagesMapped,
    };

    // 4. Save to Governance
    const [result] = await adminDb
      .insert(onboardingBlueprintsInGovernance)
      .values({
        name: options.name,
        description: options.description || `Snapshot of ${tenantId}`,
        blueprint: blueprint satisfies BlueprintTemplate,
        plan: (options.plan || 'pro') as
          | 'free'
          | 'basic'
          | 'pro'
          | 'enterprise',
        isDefault: !!options.isDefault,
        status: 'active',
        uiConfig: {},
      })
      .returning({ id: onboardingBlueprintsInGovernance.id });

    return result.id;
  } finally {
    release();
  }
}
