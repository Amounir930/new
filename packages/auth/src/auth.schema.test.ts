import { describe, expect, it } from 'bun:test';
import {
  JwtPayloadSchema,
  LoginSchema,
  RegisterSchema,
} from './auth.schema.js';

describe('Auth Schemas (Rule 5.1)', () => {
  describe('LoginSchema', () => {
    it('should validate correct login data', () => {
      const valid = {
        email: 'admin@example.com',
        password: 'password123',
      };
      expect(LoginSchema.parse(valid)).toEqual(valid);
    });

    it('should fail on invalid email', () => {
      const invalid = {
        email: 'not-an-email',
        password: 'password123',
      };
      expect(() => LoginSchema.parse(invalid)).toThrow();
    });

    it('should fail on short password', () => {
      const invalid = {
        email: 'admin@example.com',
        password: 'short',
      };
      expect(() => LoginSchema.parse(invalid)).toThrow();
    });
  });

  describe('RegisterSchema', () => {
    it('should validate strong passwords', () => {
      const valid = {
        email: 'user@test.com',
        password: 'SecurePass123!',
        tenantId: '550e8400-e29b-41d4-a716-446655440000',
      };
      expect(RegisterSchema.parse(valid)).toEqual(valid);
    });

    it('should fail if password has no uppercase', () => {
      const invalid = {
        email: 'user@test.com',
        password: 'securepass123!',
        tenantId: '550e8400-e29b-41d4-a716-446655440000',
      };
      expect(() => RegisterSchema.parse(invalid)).toThrow('uppercase');
    });

    it('should fail if password has no lowercase', () => {
      const invalid = {
        email: 'user@test.com',
        password: 'SECUREPASS123!',
        tenantId: '550e8400-e29b-41d4-a716-446655440000',
      };
      expect(() => RegisterSchema.parse(invalid)).toThrow('lowercase');
    });

    it('should fail if password has no number', () => {
      const invalid = {
        email: 'user@test.com',
        password: 'SecurePasswd!',
        tenantId: '550e8400-e29b-41d4-a716-446655440000',
      };
      expect(() => RegisterSchema.parse(invalid)).toThrow('number');
    });

    it('should fail on invalid tenantId UUID', () => {
      const invalid = {
        email: 'user@test.com',
        password: 'SecurePass123!',
        tenantId: 'invalid-uuid',
      };
      expect(() => RegisterSchema.parse(invalid)).toThrow();
    });

    it('should fail if password has no special character', () => {
      const invalid = {
        email: 'user@test.com',
        password: 'SecurePass123',
        tenantId: '550e8400-e29b-41d4-a716-446655440000',
      };
      expect(() => RegisterSchema.parse(invalid)).toThrow('special character');
    });

    it('should fail if password contains common words', () => {
      const invalid = {
        email: 'user@test.com',
        password: 'Password123!!',
        tenantId: '550e8400-e29b-41d4-a716-446655440000',
      };
      expect(() => RegisterSchema.parse(invalid)).toThrow('common words');
    });
  });

  describe('JwtPayloadSchema', () => {
    it('should validate correct payload', () => {
      const valid = {
        sub: '550e8400-e29b-41d4-a716-446655440000',
        email: 'admin@example.com',
        tenantId: '550e8400-e29b-41d4-a716-446655440000',
        role: 'admin',
        iat: Date.now(),
        exp: Date.now() + 3600,
      };
      expect(JwtPayloadSchema.parse(valid)).toEqual(valid);
    });

    it('should fail on invalid role', () => {
      const invalid = {
        sub: '550e8400-e29b-41d4-a716-446655440000',
        email: 'admin@example.com',
        tenantId: '550e8400-e29b-41d4-a716-446655440000',
        role: 'invalid-role',
        iat: Date.now(),
        exp: Date.now() + 3600,
      };
      expect(() => JwtPayloadSchema.parse(invalid)).toThrow();
    });
  });
});
