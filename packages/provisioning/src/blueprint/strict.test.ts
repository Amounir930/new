import { describe, expect, it } from 'bun:test';
import { MASTER_FEATURE_LIST } from './constants';
import { validateBlueprint } from './executor';

describe('S21 Strict Validation', () => {
  it('should reject a blueprint missing even 1 feature', () => {
    const completeModules = MASTER_FEATURE_LIST.reduce(
      (acc, f) => {
        acc[f] = true;
        return acc;
      },
      {} as Record<string, boolean>
    );

    const incompleteModules: Record<string, boolean> = { ...completeModules };
    delete incompleteModules['home']; // Remove 1

    const blueprint = {
      name: 'Test',
      version: '1.0',
      modules: incompleteModules,
      quotas: {
        max_products: 10,
        max_orders: 10,
        max_pages: 1,
        max_staff: 5,
        max_categories: 10,
        max_coupons: 5,
        storage_limit_gb: 1,
        api_rate_limit: 100,
      },
    };

    expect(() => validateBlueprint(blueprint)).toThrow(
      "Missing required feature 'home'"
    );
  });

  it('should accept a blueprint with all 41 features', () => {
    const completeModules = MASTER_FEATURE_LIST.reduce(
      (acc, f) => {
        acc[f] = true;
        return acc;
      },
      {} as Record<string, boolean>
    );
    const blueprint = {
      name: 'Valid',
      version: '1.0',
      modules: completeModules,
      quotas: {
        max_products: 10,
        max_orders: 10,
        max_pages: 1,
        max_staff: 5,
        max_categories: 10,
        max_coupons: 5,
        storage_limit_gb: 1,
        api_rate_limit: 100,
      },
    };

    expect(() => validateBlueprint(blueprint)).not.toThrow();
  });
});
