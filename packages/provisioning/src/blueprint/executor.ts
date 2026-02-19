import { MASTER_FEATURE_LIST, MASTER_QUOTA_LIST } from './constants.js';
import type {
  BlueprintConfig,
  BlueprintContext,
  BlueprintTemplate,
  SeederModule,
} from './types.js';

export class BlueprintExecutor {
  private modules: Map<string, SeederModule> = new Map();

  register(module: SeederModule) {
    this.modules.set(module.name, module);
  }

  async execute(ctx: BlueprintContext, config: BlueprintConfig) {
    console.log(
      `[BlueprintExecutor] Starting execution for ${ctx.subdomain} (Plan: ${ctx.plan}, Niche: ${ctx.nicheType || 'generic'})`
    );

    // 1. S2.5: Industry-Based Auto-Activation
    if (ctx.nicheType) {
      this.autoEnableModules(ctx, config);
    }

    // 2. Determine execution order (Core must be first if present)
    const requestedModules = Object.keys(config.modules).filter(
      (key) =>
        config.modules[key] === true ||
        (typeof config.modules[key] === 'object' &&
          config.modules[key] !== null)
    );

    // Sort: 'core' always comes first
    requestedModules.sort((a, b) => {
      if (a === 'core') return -1;
      if (b === 'core') return 1;
      return 0;
    });

    for (const moduleName of requestedModules) {
      const module = this.modules.get(moduleName);

      if (!module) {
        console.warn(
          `[BlueprintExecutor] Warning: Requested module '${moduleName}' not found. Skipping.`
        );
        continue;
      }

      // 3. Security: Permission Gate (Niche + Plan)
      this.checkPermissions(module, ctx);

      // 4. Execution with Circuit Breaker
      try {
        console.log(`[BlueprintExecutor] Running module: ${moduleName}`);
        await module.run(ctx, config);
        console.log(
          `[BlueprintExecutor] Module ${moduleName} completed successfully.`
        );
      } catch (error) {
        console.error(
          `[BlueprintExecutor] CRITICAL FAILURE in module '${moduleName}':`,
          error
        );
        // Circuit Breaker: Throw immediately to trigger transaction rollback in parent
        throw new Error(
          `Blueprint Execution Failed at module '${moduleName}': ${error instanceof Error ? error.message : String(error)}`
        );
      }
    }

    console.log(`[BlueprintExecutor] All modules executed successfully.`);
  }

  /**
   * S2.5: Auto-enable modules based on industry niche and plan level
   */
  private autoEnableModules(ctx: BlueprintContext, config: BlueprintConfig) {
    // Example: Health & Wellness (medical-like) + Pro plan gets automated bookings
    if (ctx.nicheType === 'wellness' && ctx.plan === 'pro') {
      console.log(
        `[BlueprintExecutor] Auto-enabling 'bookings' for wellness niche on pro plan.`
      );
      config.modules.bookings = true;
    }

    // Example: Food & Hospitality gets inventory by default on any plan
    if (ctx.nicheType === 'food') {
      console.log(
        `[BlueprintExecutor] Auto-enabling 'inventory' for food niche.`
      );
      config.modules.inventory = true;
    }
  }

  private checkPermissions(module: SeederModule, ctx: BlueprintContext) {
    const { plan, nicheType: _nicheType } = ctx;

    // 1. Plan Check
    if (module.allowedPlans && module.allowedPlans !== '*') {
      if (Array.isArray(module.allowedPlans)) {
        if (!module.allowedPlans.includes(plan)) {
          throw new Error(
            `[Permission Denied] Module '${module.name}' is not allowed for plan '${plan}'.`
          );
        }
      }
    }

    // 2. S2.5: Potential Industry Gating (Future proofing)
    // If a module is strictly for a specific niche...
    // if (module.requiredNiche && module.requiredNiche !== nicheType) {
    //    throw new Error(`[Permission Denied] Module '${module.name}' requires niche '${module.requiredNiche}'.`);
    // }
  }
}

/**
 * Validate Blueprint JSON Structure (S21 Strictness)
 * Enforces that all 41 features and essential quotas are present.
 */
export function validateBlueprint(blueprint: any): BlueprintTemplate {
  if (!blueprint || typeof blueprint !== 'object') {
    throw new Error('Blueprint must be a valid JSON object');
  }

  if (!blueprint.name || typeof blueprint.name !== 'string') {
    throw new Error('Blueprint must have a valid name');
  }

  if (!blueprint.modules || typeof blueprint.modules !== 'object') {
    throw new Error('Blueprint must define modules object');
  }

  // 1. Strict Module Check (All 41 must exist)
  for (const feature of MASTER_FEATURE_LIST) {
    if (!(feature in blueprint.modules)) {
      throw new Error(
        `Validation Error: Missing required feature '${feature}' in blueprint modules.`
      );
    }
  }

  // 2. Strict Quota Check
  if (!blueprint.quotas || typeof blueprint.quotas !== 'object') {
    throw new Error('Blueprint must define quotas object');
  }

  for (const quota of MASTER_QUOTA_LIST) {
    if (!(quota in blueprint.quotas)) {
      throw new Error(
        `Validation Error: Missing required quota '${quota}' in blueprint quotas.`
      );
    }
  }

  return blueprint as BlueprintTemplate;
}
