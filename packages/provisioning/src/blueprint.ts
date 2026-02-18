import { onboardingBlueprints, publicDb } from '@apex/db';
import { and, desc, eq } from 'drizzle-orm';
import { validateBlueprint } from './blueprint/executor.js';
import type { BlueprintRecord, BlueprintTemplate } from './blueprint/types.js';

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
    plan?: string;
  } = {}
): Promise<BlueprintRecord> {
  // Validate blueprint structure
  validateBlueprint(blueprint);

  // If this is set as default, unset previous default for this plan
  if (options.isDefault) {
    await publicDb
      .update(onboardingBlueprints)
      .set({ isDefault: false })
      .where(eq(onboardingBlueprints.plan, options.plan || 'free'));
  }

  const result = await publicDb
    .insert(onboardingBlueprints)
    .values({
      name,
      description: options.description || null,
      blueprint: blueprint as unknown as BlueprintTemplate,
      isDefault: !!options.isDefault,
      plan: options.plan || 'free',
    })
    .returning();

  return {
    ...result[0],
    blueprint: result[0].blueprint as unknown as BlueprintTemplate,
    uiConfig: result[0].uiConfig as Record<string, unknown> | null,
    isDefault: !!result[0].isDefault,
  } as BlueprintRecord;
}

/**
 * Get all blueprints
 */
export async function getAllBlueprints(): Promise<BlueprintRecord[]> {
  const results = await publicDb
    .select()
    .from(onboardingBlueprints)
    .orderBy(desc(onboardingBlueprints.createdAt));

  return results.map((r) => ({
    ...r,
    blueprint: r.blueprint as unknown as BlueprintTemplate,
    uiConfig: r.uiConfig as Record<string, unknown> | null,
    isDefault: !!r.isDefault,
  })) as BlueprintRecord[];
}

/**
 * Get blueprint by ID
 */
export async function getBlueprintById(
  id: string
): Promise<BlueprintRecord | null> {
  const results = await publicDb
    .select()
    .from(onboardingBlueprints)
    .where(eq(onboardingBlueprints.id, id))
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
  } as BlueprintRecord;
}

/**
 * Get default blueprint for a plan
 */
export async function getDefaultBlueprint(
  plan = 'free'
): Promise<BlueprintRecord | null> {
  const results = await publicDb
    .select()
    .from(onboardingBlueprints)
    .where(
      and(
        eq(onboardingBlueprints.isDefault, true),
        eq(onboardingBlueprints.plan, plan)
      )
    )
    .limit(1);

  if (results.length === 0) {
    // Return any blueprint for this plan if no default
    const anyBlueprint = await publicDb
      .select()
      .from(onboardingBlueprints)
      .where(eq(onboardingBlueprints.plan, plan))
      .limit(1);

    if (anyBlueprint.length === 0) {
      // 🛡️ S21 FIX: Hardcoded fallback if database is empty
      return {
        id: 'hardcoded-default',
        name: defaultBlueprintTemplate.name,
        description: defaultBlueprintTemplate.description || null,
        blueprint: defaultBlueprintTemplate,
        isDefault: true,
        plan: plan,
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
    } as BlueprintRecord;
  }

  const res = results[0];
  return {
    ...res,
    blueprint: res.blueprint as unknown as BlueprintTemplate,
    uiConfig: res.uiConfig as Record<string, unknown> | null,
    isDefault: !!res.isDefault,
  } as BlueprintRecord;
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
    plan?: string;
  }
): Promise<BlueprintRecord | null> {
  // Validate if blueprint is being updated
  if (updates.blueprint) {
    validateBlueprint(updates.blueprint);
  }

  if (updates.isDefault && updates.plan) {
    await publicDb
      .update(onboardingBlueprints)
      .set({ isDefault: false })
      .where(eq(onboardingBlueprints.plan, updates.plan));
  }

  const updateData: Partial<typeof onboardingBlueprints.$inferInsert> = {};
  if (updates.name) updateData.name = updates.name;
  if (updates.description !== undefined)
    updateData.description = updates.description;
  if (updates.blueprint) updateData.blueprint = updates.blueprint;
  if (updates.isDefault !== undefined) updateData.isDefault = updates.isDefault;
  if (updates.plan) updateData.plan = updates.plan;

  const result = await publicDb
    .update(onboardingBlueprints)
    .set(updateData)
    .where(eq(onboardingBlueprints.id, id))
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
  } as BlueprintRecord;
}

/**
 * Delete a blueprint
 */
export async function deleteBlueprint(id: string): Promise<boolean> {
  const result = await publicDb
    .delete(onboardingBlueprints)
    .where(eq(onboardingBlueprints.id, id))
    .returning({ id: onboardingBlueprints.id });

  return result.length > 0;
}
