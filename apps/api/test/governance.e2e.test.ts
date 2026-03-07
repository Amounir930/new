import { beforeAll, describe, expect, it, mock } from 'bun:test';
import { adminDb } from '@apex/db';

// S1-S15 Protocols: Environment Handshake
process.env['NODE_ENV'] = 'test';
process.env['ENCRYPTION_MASTER_KEY'] = // gitleaks:allow
  'test-encryption-key-must-be-at-least-32-chars-long';
process.env['JWT_SECRET'] =
  'test-jwt-secret-must-be-long-enough-for-s1-compliance';
process.env['SUPER_ADMIN_PASSWORD'] = 'Admin@60SecShop!2026';
// Derived from .env
process.env['DATABASE_URL'] =
  'postgresql://apex:ApexV2DBPassSecure2026GrowthScale!QazXswEdCv@localhost:5432/apex_v2';

import type { RedisRateLimitStore } from '@apex/middleware';
import { type Mocked, MockFactory } from '@apex/test-utils';
import { GovernanceService } from '../src/governance/governance.service';

// Mock dependencies for GovernanceService
const mockRedisService = {
  getClient: mock(async () => ({
    ping: mock(async () => 'PONG'),
  })),
  subscribe: mock(async () => {}),
  publish: mock(async () => {}),
} as Mocked<RedisRateLimitStore>;

let governanceService: GovernanceService;

describe('Blueprint Governance E2E (Logic Verification)', () => {
  beforeAll(async () => {
    void '🏁 Ensuring DB Connection for Governance Logic...';
    governanceService = new GovernanceService(
      mockRedisService as RedisRateLimitStore
    );
    // Note: publicDb/adminDb usage in GovernanceService is internal,
    // we don't pass it in constructor in the current NestJS implementation.
  });

  it('should block product creation when blueprint max_products is 0 (Stage 1 & 2 logic)', async () => {
    void '🧪 Starting Stage 2 logic verification...';
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
    governanceService.getResourceCount = async () => 0;

    void '🔍 Testing Real-time Enforcement...';
    const result = await governanceService.checkQuota(
      'tenant-id-123',
      'products',
      subdomain
    );

    void `📊 Enforcement Check: Allowed=${result.allowed}, Limit=${result.limit}, Current=${result.current}`;

    expect(result.allowed).toBe(false);
    expect(result.limit).toBe(0);
    void '✅ PASS: Governance System correctly blocks product creation based on Blueprint.';
  }, 60000);

  it('should allow product creation when blueprint max_products is 100', async () => {
    const subdomain = `pro-store-${Date.now()}`;

    // Mock the getTenantLimits internal behavior
    governanceService.getTenantLimits = async (_tenantId: string) => ({
      maxProducts: 100,
      maxOrders: 1000,
      maxPages: 50,
      maxStaff: 10,
      storageLimitGb: 10,
      ownerEmail: 'test@example.com',
    });

    // Mock getResourceCount
    governanceService.getResourceCount = async () => 0;

    const result = await governanceService.checkQuota(
      'tenant-id-456',
      'products',
      subdomain
    );

    void `📊 Enforcement Check: Allowed=${result.allowed}, Limit=${result.limit}, Current=${result.current}`;
    expect(result.allowed).toBe(true);
    expect(result.limit).toBe(100);
    void '✅ PASS: Governance System correctly allows product creation for Pro Plan.';
  });
});
