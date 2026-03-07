/**
 * Onboarding Blueprint Tests
 * S21: Blueprint Editor & Provisioning Templates
 * Rule 4.1: Test Coverage Mandate
 */

import { beforeEach, describe, expect, it, mock } from 'bun:test';
import {
  type Mocked,
  MockFactory,
  type MockQueryBuilder,
} from '@apex/test-utils';

// 🛡️ Drizzle Mocking the RIGHT way (No 'as unknown')
let mockDb: Mocked<MockQueryBuilder>;

mock.module('@apex/db', () => {
  const db = MockFactory.createQueryBuilder();
  mockDb = db;
  return {
    adminDb: db,
    onboardingBlueprintsInGovernance: {
      id: 'id',
      name: 'name',
      plan: 'plan',
      isDefault: 'isDefault',
      blueprint: 'blueprint',
      createdAt: 'createdAt',
    },
    and: mock((...args: unknown[]) => ({ type: 'and', args })),
    desc: mock((arg: unknown) => ({ type: 'desc', arg })),
    eq: mock((a: unknown, b: unknown) => ({ type: 'eq', a, b })),
  };
});

import {
  createBlueprint,
  getAllBlueprints,
  getBlueprintById,
  getDefaultBlueprint,
  validateBlueprint,
} from './blueprint';
import { MASTER_FEATURE_LIST, MASTER_QUOTA_LIST } from './blueprint/constants';
import type { BlueprintTemplate } from './blueprint/types';

const createValidBlueprint = (
  overrides: Partial<BlueprintTemplate> = {}
): BlueprintTemplate => {
  // 🛡️ Proper Initialization instead of 'unknown'
  const modules: Record<string, boolean> = {};
  for (const f of MASTER_FEATURE_LIST) modules[f] = true;

  const quotas: Record<string, number> = {};
  for (const q of MASTER_QUOTA_LIST) quotas[q] = 100;

  return {
    version: '1.0',
    name: 'Standard',
    modules,
    quotas,
    settings: {},
    ...overrides,
  } as BlueprintTemplate;
};

describe('BlueprintManager', () => {
  beforeEach(() => {
    // 🛡️ Reset the shared mock engine between tests
    mockDb.select.mockClear();
    mockDb.from.mockClear();
    mockDb.insert.mockClear();
    mockDb.limit.mockClear();
    mockDb.returning.mockClear();
  });

  describe('validateBlueprint', () => {
    it('should validate a valid minimal blueprint', () => {
      const blueprint = createValidBlueprint();
      expect(validateBlueprint(blueprint)).toBe(blueprint);
    });

    it('should throw if name is missing', () => {
      const blueprint = createValidBlueprint({ name: undefined });
      expect(() => validateBlueprint(blueprint)).toThrow(
        /must have a valid name/
      );
    });

    it('should throw if modules are missing one feature', () => {
      const blueprint = createValidBlueprint();
      delete blueprint.modules['home']; // 🛡️ Clean delete without assertion
      expect(() => validateBlueprint(blueprint)).toThrow(
        /Missing required feature 'home'/
      );
    });

    it('should throw if quotas are missing one quota', () => {
      const blueprint = createValidBlueprint();
      if (blueprint.quotas && 'max_products' in blueprint.quotas) {
        const q = blueprint.quotas as Record<string, number>;
        delete q['max_products'];
      }
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
      // 🛡️ No assertion required, mockDb already has the correct types
      mockDb.returning.mockResolvedValue([mockRecord]);

      const result = await createBlueprint(
        'Test',
        createValidBlueprint({ name: 'Test' })
      );

      expect(result.id).toBe('uuid-1');
      expect(mockDb.insert).toHaveBeenCalled();
    });

    it('should get all blueprints', async () => {
      // In getAllBlueprints, orderBy is the terminal method
      mockDb.orderBy.mockResolvedValue([mockRecord]);

      const results = await getAllBlueprints();
      expect(results).toHaveLength(1);
      expect(results[0].name).toBe('Test Blueprint');
    });

    it('should get blueprint by ID', async () => {
      // 🛡️ Fixed the Syntax Error
      mockDb.limit.mockResolvedValueOnce([mockRecord]);

      const result = await getBlueprintById('uuid-1');
      expect(result?.id).toBe('uuid-1');
    });

    it('should return null if blueprint ID not found', async () => {
      mockDb.limit.mockResolvedValueOnce([]);

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

      mockDb.limit.mockResolvedValueOnce([mockDefault]);

      const result = await getDefaultBlueprint('free');
      expect(result?.isDefault).toBe(true);
      expect(result?.name).toBe('Default');
    });
  });
});
