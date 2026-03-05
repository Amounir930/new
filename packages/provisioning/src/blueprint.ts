import {
  adminDb,
  and,
  desc,
  eq,
  onboardingBlueprintsInGovernance,
} from '@apex/db';

export { validateBlueprint } from './blueprint/executor';

import { validateBlueprint } from './blueprint/executor';
import type { BlueprintRecord, BlueprintTemplate } from './blueprint/types';

// Fallback template for safety
const defaultBlueprintTemplate: BlueprintTemplate = {
  name: 'Default Blueprint',
  version: '1.0',
  modules: {
    core: {
      siteName: 'New Store',
      currency: 'USD',
    },
  },
};

/**
 * Handle new blueprint creation
 */
export async function createBlueprint(
  name: string,
  blueprint: BlueprintTemplate,
  options: {
    description?: string;
    isDefault?: boolean;
    plan?: 'free' | 'basic' | 'pro' | 'enterprise';
    nicheType?: string;
    status?: 'active' | 'paused';
    uiConfig?: Record<string, unknown>;
  } = {}
): Promise<BlueprintRecord> {
  // Validate blueprint structure
  validateBlueprint(blueprint);

  // If this is set as default, unset previous default for this plan
  if (options.isDefault) {
    await adminDb
      .update(onboardingBlueprintsInGovernance)
      .set({ isDefault: false })
      .where(eq(onboardingBlueprintsInGovernance.plan, options.plan || 'free'));
  }

  const result = await adminDb
    .insert(onboardingBlueprintsInGovernance)
    .values({
      name,
      description: options.description || null,
      blueprint: blueprint as never,
      isDefault: !!options.isDefault,
      plan: (options.plan || 'free') as never,
      nicheType: (options.nicheType || 'retail') as never,
      status: (options.status || 'active') as never,
      uiConfig: options.uiConfig || {}, // Ensure mandatory field is provided
    })
    .returning();

  return {
    ...result[0],
    blueprint: result[0].blueprint as unknown as BlueprintTemplate,
    uiConfig: result[0].uiConfig as Record<string, unknown> | null,
    isDefault: !!result[0].isDefault,
    createdAt: result[0].createdAt ? new Date(result[0].createdAt) : null,
    updatedAt: result[0].updatedAt ? new Date(result[0].updatedAt) : null,
  } as unknown as BlueprintRecord;
}

/**
 * Get all blueprints
 */
export async function getAllBlueprints(): Promise<BlueprintRecord[]> {
  const results = await adminDb
    .select()
    .from(onboardingBlueprintsInGovernance)
    .orderBy(desc(onboardingBlueprintsInGovernance.createdAt));

  return results.map((r) => ({
    ...r,
    blueprint: r.blueprint as unknown as BlueprintTemplate,
    uiConfig: r.uiConfig as Record<string, unknown> | null,
    isDefault: !!r.isDefault,
    createdAt: r.createdAt ? new Date(r.createdAt) : null,
    updatedAt: r.updatedAt ? new Date(r.updatedAt) : null,
  })) as unknown as BlueprintRecord[];
}

/**
 * Get blueprint by ID
 */
export async function getBlueprintById(
  id: string
): Promise<BlueprintRecord | null> {
  const results = await adminDb
    .select()
    .from(onboardingBlueprintsInGovernance)
    .where(eq(onboardingBlueprintsInGovernance.id, id))
    .limit(1);

  if (results.length === 0) {
    return null;
  }

  const res = results[0];
  return {
    ...res,
    blueprint: res.blueprint as unknown as BlueprintTemplate,
    uiConfig: res.uiConfig as Record<string, unknown> | null,
    isDefault: !!res.isDefault,
    createdAt: res.createdAt ? new Date(res.createdAt) : null,
    updatedAt: res.updatedAt ? new Date(res.updatedAt) : null,
  } as unknown as BlueprintRecord;
}

/**
 * Get default blueprint for a plan
 */
export async function getDefaultBlueprint(
  plan: 'free' | 'basic' | 'pro' | 'enterprise' = 'free'
): Promise<BlueprintRecord | null> {
  const results = await adminDb
    .select()
    .from(onboardingBlueprintsInGovernance)
    .where(
      and(
        eq(onboardingBlueprintsInGovernance.isDefault, true),
        eq(onboardingBlueprintsInGovernance.plan, plan)
      )
    )
    .limit(1);

  if (results.length === 0) {
    // Return a blueprint for this plan if no default
    const anyBlueprint = await adminDb
      .select()
      .from(onboardingBlueprintsInGovernance)
      .where(eq(onboardingBlueprintsInGovernance.plan, plan))
      .limit(1);

    if (anyBlueprint.length === 0) {
      // 🛡️ S21 FIX: Hardcoded fallback if database is empty
      // PENDING: Remove after initial deployment migration guarantees DB is populated
      return {
        id: 'hardcoded-default',
        name: defaultBlueprintTemplate.name,
        description: defaultBlueprintTemplate.description || null,
        blueprint: defaultBlueprintTemplate,
        isDefault: true,
        plan: plan as 'free' | 'basic' | 'pro' | 'enterprise',
        status: 'active',
        nicheType: null,
        uiConfig: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    }

    const first = anyBlueprint[0];
    return {
      ...first,
      blueprint: first.blueprint as unknown as BlueprintTemplate,
      uiConfig: first.uiConfig as Record<string, unknown> | null,
      isDefault: !!first.isDefault,
      createdAt: first.createdAt ? new Date(first.createdAt) : null,
      updatedAt: first.updatedAt ? new Date(first.updatedAt) : null,
    } as unknown as BlueprintRecord;
  }

  const res = results[0];
  return {
    ...res,
    blueprint: res.blueprint as unknown as BlueprintTemplate,
    uiConfig: res.uiConfig as Record<string, unknown> | null,
    isDefault: !!res.isDefault,
    createdAt: res.createdAt ? new Date(res.createdAt) : null,
    updatedAt: res.updatedAt ? new Date(res.updatedAt) : null,
  } as unknown as BlueprintRecord;
}

/**
 * Update a blueprint
 */
export async function updateBlueprint(
  id: string,
  updates: {
    name?: string;
    description?: string;
    blueprint?: BlueprintTemplate;
    isDefault?: boolean;
    plan?: 'free' | 'basic' | 'pro' | 'enterprise';
    nicheType?: string;
    status?: 'active' | 'paused';
    uiConfig?: Record<string, unknown>;
  }
): Promise<BlueprintRecord | null> {
  // Validate if blueprint is being updated
  if (updates.blueprint) {
    validateBlueprint(updates.blueprint);
  }

  if (updates.isDefault && updates.plan) {
    await adminDb
      .update(onboardingBlueprintsInGovernance)
      .set({ isDefault: false })
      .where(eq(onboardingBlueprintsInGovernance.plan, updates.plan));
  }

  const updateData: Partial<
    typeof onboardingBlueprintsInGovernance.$inferInsert
  > = {};
  if (updates.name) updateData.name = updates.name;
  if (updates.description !== undefined)
    updateData.description = updates.description;
  if (updates.blueprint) updateData.blueprint = updates.blueprint as never;
  if (updates.isDefault !== undefined) updateData.isDefault = updates.isDefault;
  if (updates.plan) updateData.plan = updates.plan as never;
  if (updates.nicheType) updateData.nicheType = updates.nicheType as never;
  if (updates.status) updateData.status = updates.status as never;
  if (updates.uiConfig) updateData.uiConfig = updates.uiConfig as never;

  const result = await adminDb
    .update(onboardingBlueprintsInGovernance)
    .set(updateData)
    .where(eq(onboardingBlueprintsInGovernance.id, id))
    .returning();

  if (result.length === 0) {
    return null;
  }

  const res = result[0];
  return {
    ...res,
    blueprint: res.blueprint as unknown as BlueprintTemplate,
    uiConfig: res.uiConfig as Record<string, unknown> | null,
    isDefault: !!res.isDefault,
    createdAt: res.createdAt ? new Date(res.createdAt) : null,
    updatedAt: res.updatedAt ? new Date(res.updatedAt) : null,
  } as unknown as BlueprintRecord;
}

/**
 * Delete a blueprint
 */
export async function deleteBlueprint(id: string): Promise<boolean> {
  const result = await adminDb
    .delete(onboardingBlueprintsInGovernance)
    .where(eq(onboardingBlueprintsInGovernance.id, id))
    .returning({ id: onboardingBlueprintsInGovernance.id });

  return result.length > 0;
}
