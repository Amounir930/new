/**
 * Onboarding Blueprint Tests
 * S21: Blueprint Editor & Provisioning Templates
 * Rule 4.1: Test Coverage Mandate
 */

import { beforeEach, describe, expect, it, mock } from 'bun:test';
import { adminDb } from '@apex/db';
import {
  MASTER_FEATURE_LIST,
  MASTER_QUOTA_LIST,
} from './blueprint/constants';
import {
  createBlueprint,
  getAllBlueprints,
  getBlueprintById,
  getDefaultBlueprint,
  validateBlueprint,
} from './blueprint';

// Mock DB
mock.module('@apex/db', () => ({
  adminDb: {
    select: mock().mockReturnThis(),
    from: mock().mockReturnThis(),
    where: mock().mockReturnThis(),
    orderBy: mock().mockReturnThis(),
    limit: mock().mockReturnThis(),
    update: mock().mockReturnThis(),
    set: mock().mockReturnThis(),
    insert: mock().mockReturnThis(),
    values: mock().mockReturnThis(),
    returning: mock(),
    delete: mock().mockReturnThis(),
  },
  onboardingBlueprintsInGovernance: {
    id: 'id',
    name: 'name',
    plan: 'plan',
    isDefault: 'isDefault',
    blueprint: 'blueprint',
    createdAt: 'createdAt',
  },
}));

// Helper to create a valid minimal blueprint structure
const createValidBlueprint = (overrides = {}) => {
  const modules: unknown = {};
  for (const f of MASTER_FEATURE_LIST) modules[f] = true;

  const quotas: unknown = {};
  for (const q of MASTER_QUOTA_LIST) quotas[q] = 100;

  return {
    version: '1.0',
    name: 'Standard',
    modules,
    quotas,
    settings: {}, // Add settings to avoid missing errors
    ...overrides,
  };
};

describe('BlueprintManager', () => {
  beforeEach(() => {
    mock.restore();
  });

  describe('validateBlueprint', () => {
    it('should validate a valid minimal blueprint', () => {
      const blueprint = createValidBlueprint();
      expect(validateBlueprint(blueprint)).toBe(blueprint as never);
    });

    it('should validate with products and pages', () => {
      const blueprint = createValidBlueprint({
        products: [{ name: 'P1', price: 10 }],
        pages: [{ slug: 's', title: 't', content: 'c' }],
      });
      expect(validateBlueprint(blueprint)).toBe(blueprint as never);
    });

    it('should throw if version is wrong', () => {
      const blueprint = createValidBlueprint({ version: '2.0' });
      // The real implementation throws "Blueprint must define modules object" if it doesn't match?
      // Let's check internal logic. If version check is missing in validateBlueprint, let's add it.
      expect(() => validateBlueprint(blueprint)).toThrow();
    });

    it('should throw if name is missing', () => {
      const blueprint = createValidBlueprint({ name: undefined });
      expect(() => validateBlueprint(blueprint)).toThrow(
        /must have a valid name/
      );
    });

    it('should throw if modules are missing one feature', () => {
      const blueprint = createValidBlueprint();
      delete (blueprint.modules as never).home;
      expect(() => validateBlueprint(blueprint)).toThrow(
        /Missing required feature 'home'/
      );
    });

    it('should throw if quotas are missing one quota', () => {
      const blueprint = createValidBlueprint();
      delete (blueprint.quotas as never).max_products;
      expect(() => validateBlueprint(blueprint)).toThrow(
        /Missing required quota 'max_products'/
      );
    });
  });

  describe('Database Operations', () => {
    const mockRecord = {
      id: 'uuid-1',
      name: 'Test Blueprint',
      blueprint: JSON.stringify(createValidBlueprint({ name: 'Test' })),
      isDefault: 'true',
      plan: 'free',
    };

    it('should create a blueprint', async () => {
      (adminDb.returning as never).mockResolvedValue([mockRecord]);

      const result = await createBlueprint(
        'Test',
        createValidBlueprint({ name: 'Test' })
      );

      expect(result.id).toBe('uuid-1');
      expect(result.isDefault).toBe(true);
      expect(adminDb.insert).toHaveBeenCalled();
    });

    it('should get all blueprints', async () => {
      (adminDb.select().from().orderBy as never).mockResolvedValue([
        mockRecord,
      ]);

      const results = await getAllBlueprints();

      expect(results).toHaveLength(1);
      expect(results[0].name).toBe('Test Blueprint');
    });

    it('should get blueprint by ID', async () => {
      (adminDb.limit as never).mockResolvedValue([mockRecord]);

      const result = await getBlueprintById('uuid-1');

      expect(result?.id).toBe('uuid-1');
    });

    it('should return null if blueprint ID not found', async () => {
      (adminDb.limit as never).mockResolvedValue([]);

      const result = await getBlueprintById('missing');

      expect(result).toBeNull();
    });
  });

  describe('getDefaultBlueprint', () => {
    it('should return default blueprint for plan', async () => {
      const mockDefault = {
        name: 'Default',
        blueprint: JSON.stringify(createValidBlueprint({ name: 'D' })),
        isDefault: 'true',
        plan: 'free',
      };
      (adminDb.limit as never).mockResolvedValue([mockDefault]);

      const result = await getDefaultBlueprint('free');

      expect(result?.isDefault).toBe(true);
      expect(result?.name).toBe('Default');
    });

    it('should fallback to a blueprint if no default is found', async () => {
      (adminDb.limit as never).mockResolvedValueOnce([]); // No default
      (adminDb.limit as never).mockResolvedValueOnce([
        {
          name: 'Fallback',
          blueprint: JSON.stringify(createValidBlueprint({ name: 'F' })),
          isDefault: 'false',
          plan: 'free',
        },
      ]);

      const result = await getDefaultBlueprint('free');

      expect(result?.name).toBe('Fallback');
      expect(result?.isDefault).toBe(true);
    });
  });
});
