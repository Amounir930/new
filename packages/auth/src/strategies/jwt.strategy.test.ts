/**
 * JWT Strategy Tests
 */

import { UnauthorizedException } from '@nestjs/common';
import { beforeEach, describe, expect, it, mock } from 'bun:test';
import { JwtStrategy } from './jwt.strategy.js';

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;
  const mockConfigService = {
    get: mock().mockReturnValue('super-secret-key-at-least-32-chars-long'),
  };

  beforeEach(() => {
    mock.restore();
    strategy = new JwtStrategy(mockConfigService as any);
  });

  describe('validate', () => {
    it('should validate a valid payload', async () => {
      const payload = { sub: 'u1', email: 'test@test.com', tenantId: 't1' };
      const result = await strategy.validate(payload);

      expect(result).toEqual({
        id: 'u1',
        email: 'test@test.com',
        tenantId: 't1',
      });
    });

    it('should throw UnauthorizedException if sub is missing', async () => {
      const payload = { email: 'test@test.com' } as any;
      await expect(strategy.validate(payload)).rejects.toThrow(
        UnauthorizedException
      );
    });

    it('should throw UnauthorizedException if payload is null', async () => {
      await expect(strategy.validate(null as any)).rejects.toThrow(
        UnauthorizedException
      );
    });
  });
});
