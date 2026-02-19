/**
 * Tests for quota service (S21 Data-Driven Version)
 */

import { beforeEach, describe, expect, it, mock } from 'bun:test';
import {
  checkProvisioningQuota,
  checkQuota,
  isFeatureAllowed,
  validateSubdomainAvailability,
} from './quota-service.js';

describe('QuotaService (Data-Driven)', () => {
  beforeEach(() => {
    mock.restore();
  });

  describe('checkProvisioningQuota', () => {
    it('should allow provisioning (governance handled in service)', async () => {
      const result = await checkProvisioningQuota('free', 'org-123');
      expect(result.allowed).toBe(true);
    });
  });

  describe('isFeatureAllowed', () => {
    it('should allow enterprise to have everything', () => {
      expect(isFeatureAllowed('enterprise', 'any_feature')).toBe(true);
    });

    it('should allow core features for all plans', () => {
      expect(isFeatureAllowed('free', 'products')).toBe(true);
      expect(isFeatureAllowed('free', 'orders')).toBe(true);
    });

    it('should deny non-core features (S21: enforced via DB feature_gates)', () => {
      expect(isFeatureAllowed('free', 'custom_ai_widget')).toBe(false);
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
  });

  describe('checkQuota (Simplified Signature)', () => {
    it('should allow when under limit', () => {
      // S21 Signature: (currentUsage, limit)
      const result = checkQuota(5, 10);
      expect(result).toBe(true);
    });

    it('should deny when at limit', () => {
      const result = checkQuota(10, 10);
      expect(result).toBe(false);
    });

    it('should deny when over limit', () => {
      const result = checkQuota(15, 10);
      expect(result).toBe(false);
    });
  });
});
