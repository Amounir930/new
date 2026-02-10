/**
 * Auth Service Tests
 */

import { UnauthorizedException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthService } from './auth.service.js';

describe('AuthService', () => {
  let service: AuthService;
  const mockJwtService = {
    sign: vi.fn(),
    verify: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    service = new AuthService(mockJwtService as any);
  });

  describe('generateToken', () => {
    it('should generate a token for a valid user', async () => {
      const user = { id: 'u1', email: 'test@test.com', tenantId: 't1' };
      mockJwtService.sign.mockReturnValue('mock-token');

      const token = await service.generateToken(user);

      expect(token).toBe('mock-token');
      expect(mockJwtService.sign).toHaveBeenCalledWith({
        sub: user.id,
        email: user.email,
        tenantId: user.tenantId,
      });
    });
  });

  describe('validateUser', () => {
    it('should validate a user with a valid payload', async () => {
      const payload = { sub: 'u1', email: 'test@test.com', tenantId: 't1' };
      const user = await service.validateUser(payload);

      expect(user).toEqual({
        id: 'u1',
        email: 'test@test.com',
        tenantId: 't1',
      });
    });

    it('should throw UnauthorizedException if sub is missing', async () => {
      const payload = { email: 'test@test.com' } as any;
      await expect(service.validateUser(payload)).rejects.toThrow(
        UnauthorizedException
      );
    });
  });

  describe('verifyToken', () => {
    it('should return payload for a valid token', async () => {
      const payload = { sub: 'u1', email: 'test@test.com' };
      mockJwtService.verify.mockReturnValue(payload);

      const result = await service.verifyToken('valid-token');

      expect(result).toBe(payload);
      expect(mockJwtService.verify).toHaveBeenCalledWith('valid-token');
    });

    it('should throw UnauthorizedException for an invalid token', async () => {
      mockJwtService.verify.mockImplementation(() => {
        throw new Error('Invalid');
      });

      await expect(service.verifyToken('invalid-token')).rejects.toThrow(
        UnauthorizedException
      );
    });
  });
});
