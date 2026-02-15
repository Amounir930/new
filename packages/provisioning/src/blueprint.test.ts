/**
 * Onboarding Blueprint Tests
 * S21: Blueprint Editor & Provisioning Templates
 * Rule 4.1: Test Coverage Mandate
 */

import { beforeEach, describe, expect, it, mock } from 'bun:test';
import { publicDb } from '@apex/db';
import {
  createBlueprint,
  getAllBlueprints,
  getBlueprintById,
  getDefaultBlueprint,
  validateBlueprint,
} from './blueprint.js';

// Mock DB
mock.module('@apex/db', () => ({
  publicDb: {
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
  onboardingBlueprints: {
    id: 'id',
    name: 'name',
    plan: 'plan',
    isDefault: 'isDefault',
    createdAt: 'createdAt',
  },
}));

describe('BlueprintManager', () => {
  beforeEach(() => {
    mock.restore();
  });

  describe('validateBlueprint', () => {
    it.each([
      {
        name: 'Valid Minimal Blueprint',
        blueprint: { version: '1.0', name: 'Standard' },
        valid: true,
      },
      {
        name: 'Valid with Products and Pages',
        blueprint: {
          version: '1.0',
          name: 'Full',
          products: [{ name: 'P1', price: 10 }],
          pages: [{ slug: 's', title: 't', content: 'c' }],
        },
        valid: true,
      },
      {
        name: 'Error: Wrong Version',
        blueprint: { version: '2.0', name: 'Bad' },
        error: 'version must be "1.0"',
      },
      {
        name: 'Error: Missing Name',
        blueprint: { version: '1.0' },
        error: 'must have a name',
      },
      {
        name: 'Error: Invalid Products',
        blueprint: { version: '1.0', name: 'N', products: 'not-array' },
        error: 'products must be an array',
      },
    ])('$name', ({ blueprint, error }) => {
      if (error) {
        expect(() => validateBlueprint(blueprint)).toThrow(error);
      } else {
        expect(validateBlueprint(blueprint)).toBe(true);
      }
    });
  });

  describe('Database Operations', () => {
    const mockRecord = {
      id: 'uuid-1',
      name: 'Test Blueprint',
      blueprint: JSON.stringify({ version: '1.0', name: 'Test' }),
      isDefault: 'true',
      plan: 'free',
    };

    it('should create a blueprint', async () => {
      (publicDb.returning as any).mockResolvedValue([mockRecord]);

      const result = await createBlueprint('Test', {
        version: '1.0',
        name: 'Test',
      });

      expect(result.id).toBe('uuid-1');
      expect(result.isDefault).toBe(true);
      expect(publicDb.insert).toHaveBeenCalled();
    });

    it('should get all blueprints', async () => {
      (publicDb.select().from().orderBy as any).mockResolvedValue([mockRecord]);

      const results = await getAllBlueprints();

      expect(results).toHaveLength(1);
      expect(results[0].name).toBe('Test Blueprint');
    });

    it('should get blueprint by ID', async () => {
      (publicDb.select().from().where().limit as any).mockResolvedValue([
        mockRecord,
      ]);

      const result = await getBlueprintById('uuid-1');

      expect(result?.id).toBe('uuid-1');
    });

    it('should return null if blueprint ID not found', async () => {
      (publicDb.select().from().where().limit as any).mockResolvedValue([]);

      const result = await getBlueprintById('missing');

      expect(result).toBeNull();
    });
  });

  describe('getDefaultBlueprint', () => {
    it('should return default blueprint for plan', async () => {
      const mockDefault = {
        name: 'Default',
        blueprint: JSON.stringify({ version: '1.0', name: 'D' }),
        isDefault: 'true',
        plan: 'free',
      };
      (publicDb.select().from().where().limit as any).mockResolvedValue([
        mockDefault,
      ]);

      const result = await getDefaultBlueprint('free');

      expect(result?.isDefault).toBe(true);
      expect(result?.name).toBe('Default');
    });

    it('should fallback to any blueprint if no default is found', async () => {
      (publicDb.select().from().where().limit as any).mockResolvedValueOnce([]); // No default
      (publicDb.select().from().where().limit as any).mockResolvedValueOnce([
        {
          name: 'Fallback',
          blueprint: JSON.stringify({ version: '1.0', name: 'F' }),
          isDefault: 'false',
          plan: 'free',
        },
      ]);

      const result = await getDefaultBlueprint('free');

      expect(result?.name).toBe('Fallback');
      expect(result?.isDefault).toBe(false);
    });
  });
});
