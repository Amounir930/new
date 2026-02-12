import type { Blueprint, Brick } from '../schema/v3';

/**
 * 🌿 Resolved Brick (LEGO v3)
 * A Brick that has been processed by the resolver (data bound and conditioned).
 */
export interface ResolvedBrick {
  id: string;
  type: string;
  props: Record<string, any>;
  slots?: Record<string, ResolvedBrick[]>;
  meta?: any;
}

/**
 * 🧩 Template Context (LEGO v3)
 */
export interface ResolverContext {
  data: Record<string, any>;
  locale: string;
  isRTL: boolean;
  builderMode: boolean;
}

/**
 * ⚙️ V3 Recursive Resolver Engine
 */
export class V3Resolver {
  /**
   * Resolve a complete Blueprint
   */
  resolveBlueprint(
    blueprint: Blueprint,
    context: ResolverContext
  ): ResolvedBrick {
    return this.resolveBrick(blueprint.root, context);
  }

  /**
   * Resolve a single Brick and its children recursively
   */
  resolveBrick(brick: Brick, context: ResolverContext): any {
    // 1. Check Condition
    if (
      brick.data?.condition &&
      !this.evaluateCondition(brick.data.condition, context)
    ) {
      return null;
    }

    // 2. Resolve Data Binding for Props & Inject RTL
    const resolvedProps = {
      ...this.resolveProps(brick.props, context),
      isRTL: context.isRTL, // Native S1/S8 RTL injection
    };

    // 3. Resolve Slots recursively
    const resolvedSlots: Record<string, ResolvedBrick[]> = {};
    if (brick.slots) {
      for (const [slotName, childBricks] of Object.entries(brick.slots)) {
        const processed = (childBricks as Brick[])
          .map((cb: Brick) => this.resolveBrick(cb, context))
          .filter(Boolean); // Remove nulls from failed conditions

        if (processed.length > 0) {
          resolvedSlots[slotName] = processed;
        }
      }
    }

    return {
      id: brick.id,
      type: brick.type,
      props: resolvedProps,
      slots: Object.keys(resolvedSlots).length > 0 ? resolvedSlots : undefined,
      meta: brick.meta,
    };
  }

  /**
   * Resolve props by binding dynamic values (supports interpolation and raw objects)
   */
  private resolveProps(
    props: Record<string, any>,
    context: ResolverContext
  ): Record<string, any> {
    const resolved: Record<string, any> = {};
    for (const [key, value] of Object.entries(props)) {
      if (typeof value === 'string') {
        const trimmed = value.trim();
        // Case 1: Standalone binding (return raw object/array)
        const match = trimmed.match(/^\{\{\s*([\w.]+)\s*\}\}$/);
        if (match) {
          const path = match[1];
          resolved[key] = this.getValueByPath(context.data, path);
          continue;
        }

        // Case 2: String interpolation
        resolved[key] = value.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (_, path) => {
          const val = this.getValueByPath(context.data, path);
          return val !== undefined ? String(val) : '';
        });
      } else {
        resolved[key] = value;
      }
    }
    return resolved;
  }

  /**
   * Simple logic for data path resolution
   */
  private getValueByPath(obj: any, path: string): any {
    return path.split('.').reduce((acc, part) => acc?.[part], obj);
  }

  /**
   * Simple logic for condition evaluation
   * TODO: Add strict security sandbox for expressions (S1/S8)
   */
  private evaluateCondition(
    condition: string,
    context: ResolverContext
  ): boolean {
    try {
      // Basic implementation: check if data key exists and is truthy
      return !!this.getValueByPath(context.data, condition);
    } catch {
      return false;
    }
  }
}

export const v3Resolver = new V3Resolver();
