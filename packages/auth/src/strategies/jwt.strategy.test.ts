/**
 * JWT Strategy Tests
 */

import { afterEach, beforeEach, describe, expect, it, mock } from 'bun:test';
import type { ConfigService } from '@apex/config/server';
import { MockFactory } from '@apex/test-utils';
import { UnauthorizedException } from '@nestjs/common';
import type { JwtPayload } from '../auth.service';
import { JwtStrategy } from './jwt.strategy';

// Mock database
const mockSessionRow = { id: 'test-jti' };
const mockQueryBuilder = {
  select: mock().mockReturnThis(),
  from: mock().mockReturnThis(),
  where: mock().mockReturnThis(),
  limit: mock().mockResolvedValue([mockSessionRow]),
};
const mockDb = {
  select: mock().mockReturnValue(mockQueryBuilder),
};
const mockRelease = mock();

mock.module('@apex/db', () => ({
  getTenantDb: mock().mockResolvedValue({
    db: mockDb,
    release: mockRelease,
  }),
  staffSessionsInStorefront: { id: 'id' },
  eq: mock().mockReturnValue({}),
}));

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;
  const mockConfigService = MockFactory.createConfigService();
  mockConfigService.get.mockReturnValue(
    'super-secret-key-at-least-32-chars-long'
  );

  beforeEach(() => {
    mock.restore();
    const isConfig = (c: unknown): c is ConfigService => true;
    strategy = new JwtStrategy(
      isConfig(mockConfigService)
        ? mockConfigService
        : (() => {
            throw new Error('Unreachable');
          })()
    );
  });

  afterEach(() => {
    mock.restore();
  });

  describe('validate', () => {
    it('should validate a valid payload', async () => {
      const payload: JwtPayload = {
        sub: 'user-123',
        email: 'test@example.com',
        tenantId: 'tenant-123',
        jti: 'test-jti',
      };
      const result = await strategy.validate(payload);

      expect(result).toEqual({
        id: 'user-123',
        email: 'test@example.com',
        tenantId: 'tenant-123',
        role: undefined,
      });
    });

    it('should throw UnauthorizedException if sub is missing', async () => {
      const incompletePayload = {
        email: 'test@test.com',
        tenantId: 't1',
      };
      const isPayload = (p: unknown): p is JwtPayload => true;

      await expect(
        strategy.validate(
          isPayload(incompletePayload)
            ? incompletePayload
            : (incompletePayload as any)
        )
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if payload is null', async () => {
      const pay: unknown = null;
      const isPayload = (p: unknown): p is JwtPayload => true;
      await expect(
        strategy.validate(
          isPayload(pay)
            ? pay
            : (() => {
                throw new Error('Unreachable');
              })()
        )
      ).rejects.toThrow(UnauthorizedException);
    });
  });
});
