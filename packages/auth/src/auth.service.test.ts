/**
 * Auth Service Tests
 */

import { beforeEach, describe, expect, it, mock } from 'bun:test';
import { MockFactory } from '@apex/test-utils';
import { UnauthorizedException } from '@nestjs/common';
import { AuthService, type JwtPayload } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  const mockJwtService = MockFactory.createJwtService();

  beforeEach(() => {
    mock.restore();
    service = new AuthService(mockJwtService);
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
        role: undefined,
        jti: expect.any(String),
        dfp: undefined,
      });
    });
  });

  describe('validateUser', () => {
    it('should validate a user with a valid payload', async () => {
      const payload = {
        sub: 'u1',
        email: 'test@test.com',
        tenantId: 't1',
        jti: 'test-jti',
      };
      const user = await service.validateUser(payload);

      expect(user).toEqual({
        id: 'u1',
        email: 'test@test.com',
        tenantId: 't1',
        role: undefined,
      });
    });

    it('should throw UnauthorizedException if sub is missing', async () => {
      const payload: Partial<JwtPayload> = {
        email: 'test@test.com',
        tenantId: 't1',
      };
      await expect(service.validateUser(payload as JwtPayload)).rejects.toThrow(
        UnauthorizedException
      );
    });
  });

  describe('verifyToken', () => {
    it('should return payload for a valid token', async () => {
      const payload = {
        sub: 'u1',
        email: 'test@test.com',
        tenantId: 't1',
        jti: 'test-jti',
      };
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
