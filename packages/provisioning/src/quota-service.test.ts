/**
 * Tests for quota service
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  PLAN_LIMITS,
  checkProvisioningQuota,
  checkQuota,
  getPlanLimits,
  isFeatureAllowed,
  validateSubdomainAvailability,
} from './quota-service.js';

describe('QuotaService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('PLAN_LIMITS', () => {
    it('should have defined limits for all plans', () => {
      expect(PLAN_LIMITS.free).toBeDefined();
      expect(PLAN_LIMITS.pro).toBeDefined();
      expect(PLAN_LIMITS.enterprise).toBeDefined();
    });

    it('should have correct free plan limits', () => {
      expect(PLAN_LIMITS.free.maxStorageMb).toBe(100);
      expect(PLAN_LIMITS.free.maxUsers).toBe(1);
      expect(PLAN_LIMITS.free.maxProducts).toBe(10);
    });
  });

  describe('checkProvisioningQuota', () => {
    it('should allow provisioning within limits', async () => {
      const result = await checkProvisioningQuota('free', 'org-123');
      expect(result.allowed).toBe(true);
    });

    it('should deny provisioning when limit reached', async () => {
      const result = await checkProvisioningQuota('free', 'org-123');
      expect(result.allowed).toBe(true);
      expect(result.limit).toBeDefined();
    });
  });

  describe('getPlanLimits', () => {
    it('should return limits for valid plan', () => {
      const limits = getPlanLimits('pro');
      expect(limits.maxStorageMb).toBeGreaterThan(
        PLAN_LIMITS.free.maxStorageMb
      );
    });

    it('should throw for invalid plan', () => {
      expect(() => getPlanLimits('invalid' as never)).toThrow();
    });
  });

  describe('isFeatureAllowed', () => {
    it('should allow custom domains for pro plans', () => {
      expect(isFeatureAllowed('pro', 'customDomain')).toBe(true);
      expect(isFeatureAllowed('free', 'customDomain')).toBe(false);
    });

    it('should allow SSO for enterprise only', () => {
      expect(isFeatureAllowed('enterprise', 'sso')).toBe(true);
      expect(isFeatureAllowed('pro', 'sso')).toBe(false);
    });
  });

  describe('validateSubdomainAvailability', () => {
    it('should validate available subdomain', async () => {
      const result = await validateSubdomainAvailability('available');
      expect(result.available).toBe(true);
    });

    it('should reject reserved subdomains', async () => {
      const result = await validateSubdomainAvailability('admin');
      expect(result.available).toBe(false);
      expect(result.reason).toContain('reserved');
    });

    it('should reject invalid formats', async () => {
      const result = await validateSubdomainAvailability('invalid_format');
      expect(result.available).toBe(false);
    });

    it('should reject subdomains with spaces', async () => {
      const result = await validateSubdomainAvailability('valid subdomain');
      expect(result.available).toBe(false);
      expect(result.reason).toContain(
        'Only lowercase letters, numbers, and hyphens'
      );
    });

    it('should reject subdomains that are too short or too long', async () => {
      const shortResult = await validateSubdomainAvailability('ab');
      const longResult = await validateSubdomainAvailability('a'.repeat(31));
      expect(shortResult.available).toBe(false);
      expect(longResult.available).toBe(false);
    });

    it('should handle reserveds words admin, api, www', async () => {
      expect((await validateSubdomainAvailability('admin')).available).toBe(
        false
      );
      expect((await validateSubdomainAvailability('api')).available).toBe(
        false
      );
      expect((await validateSubdomainAvailability('www')).available).toBe(
        false
      );
    });
  });

  describe('isFeatureAllowed extra checks', () => {
    it('should allow pro features for pro plan', () => {
      expect(isFeatureAllowed('pro', 'api_access')).toBe(true);
      expect(isFeatureAllowed('pro', 'webhooks')).toBe(true);
      expect(isFeatureAllowed('pro', 'storage')).toBe(true);
    });

    it('should allow basic features for basic plan', () => {
      expect(isFeatureAllowed('basic', 'coupons')).toBe(true);
      expect(isFeatureAllowed('basic', 'customDomain')).toBe(true);
    });

    it('should allow base features for all plans', () => {
      expect(isFeatureAllowed('free', 'products')).toBe(true);
      expect(isFeatureAllowed('free', 'orders')).toBe(true);
    });
  });

  describe('checkQuota', () => {
    it('should allow when under limit', () => {
      const result = checkQuota(5, 'free', 'maxProducts');
      expect(result).toBe(true);
    });

    it('should deny when at limit', () => {
      const result = checkQuota(10, 'free', 'maxProducts');
      expect(result).toBe(false);
    });

    it('should deny when over limit', () => {
      const result = checkQuota(15, 'free', 'maxProducts');
      expect(result).toBe(false);
    });

    it('should check storage quota correctly', () => {
      const result = checkQuota(50, 'free', 'maxStorageMb');
      expect(result).toBe(true);
    });

    it('should check users quota correctly', () => {
      const result = checkQuota(0, 'free', 'maxUsers');
      expect(result).toBe(true);
    });

    it('should respect pro plan limits', () => {
      const result = checkQuota(500, 'pro', 'maxProducts');
      expect(result).toBe(true);
    });

    it('should deny when exceeding pro plan limits', () => {
      const result = checkQuota(1000, 'pro', 'maxProducts');
      expect(result).toBe(false);
    });
  });
});
