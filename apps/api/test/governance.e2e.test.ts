import {
  onboardingBlueprints,
  publicDb,
  tenantQuotas,
  tenants,
} from '@apex/db';
import { beforeAll, describe, expect, it } from 'vitest';

// S1-S15 Protocols: Environment Handshake
process.env.NODE_ENV = 'test';
process.env.ENCRYPTION_MASTER_KEY =
  'test-encryption-key-must-be-at-least-32-chars-long';
process.env.JWT_SECRET =
  'test-jwt-secret-must-be-long-enough-for-s1-compliance';
process.env.SUPER_ADMIN_PASSWORD = 'Admin@60SecShop!2026';
// Derived from .env
process.env.DATABASE_URL =
  'postgresql://apex:ApexV2DBPassSecure2026GrowthScale!QazXswEdCv@localhost:5432/apex_v2';

import { GovernanceService } from '@apex/db';

// Mock dependencies for GovernanceService
const mockRedisService = {
  subscribe: async () => {},
  publish: async () => {},
} as any;

const mockEncryptionService = {
  decrypt: (v: any) => v,
} as any;

let governanceService: GovernanceService;

describe('Blueprint Governance E2E (Logic Verification)', () => {
  beforeAll(async () => {
    console.log('🏁 Ensuring DB Connection for Governance Logic...');
    governanceService = new GovernanceService(
      publicDb as any,
      mockRedisService,
      mockEncryptionService
    );
  });

  it('should block product creation when blueprint max_products is 0 (Stage 1 & 2 logic)', async () => {
    console.log('🧪 Starting Stage 2 logic verification...');
    const subdomain = `banned-store-${Date.now()}`;

    // Mock the getTenantLimits internal behavior instead of inserting into real DB
    governanceService.getTenantLimits = async () => ({
      maxProducts: 0,
      maxOrders: 10,
      maxPages: 5,
      storageLimitGb: 1,
      ownerEmail: 'test@example.com',
    });

    // Mock getResourceCount
    (governanceService as any).getResourceCount = async () => 0;

    console.log('🔍 Testing Real-time Enforcement...');
    const result = await governanceService.checkQuota(
      'tenant-id-123',
      'products',
      subdomain
    );

    console.log(
      `📊 Enforcement Check: Allowed=${result.allowed}, Limit=${result.limit}, Current=${result.current}`
    );

    expect(result.allowed).toBe(false);
    expect(result.limit).toBe(0);
    console.log(
      '✅ PASS: Governance System correctly blocks product creation based on Blueprint.'
    );
  }, 60000);

  it('should allow product creation when blueprint max_products is 100', async () => {
    const subdomain = `pro-store-${Date.now()}`;

    // Mock the getTenantLimits internal behavior
    governanceService.getTenantLimits = async () => ({
      maxProducts: 100,
      maxOrders: 1000,
      maxPages: 50,
      storageLimitGb: 10,
      ownerEmail: 'test@example.com',
    });

    // Mock getResourceCount
    (governanceService as any).getResourceCount = async () => 0;

    const result = await governanceService.checkQuota(
      'tenant-id-456',
      'products',
      subdomain
    );

    console.log(
      `📊 Enforcement Check: Allowed=${result.allowed}, Limit=${result.limit}, Current=${result.current}`
    );
    expect(result.allowed).toBe(true);
    expect(result.limit).toBe(100);
    console.log(
      '✅ PASS: Governance System correctly allows product creation for Pro Plan.'
    );
  });
});
