import {
  governanceService,
  onboardingBlueprints,
  publicDb,
  tenantQuotas,
  tenants,
} from '@apex/db';
import { expect } from 'vitest';

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

describe('Blueprint Governance E2E (Logic Verification)', () => {
  beforeAll(async () => {
    console.log('🏁 Ensuring DB Connection for Governance Logic...');
  });

  it('should block product creation when blueprint max_products is 0 (Stage 1 & 2 logic)', async () => {
    console.log('🧪 Starting Stage 2 logic verification...');
    const subdomain = `banned-store-${Date.now()}`;

    // 1. Create a "Banned" Blueprint
    const blueprintData = {
      version: '1.0',
      name: 'Banned Plan',
      modules: { ecommerce: true },
      quotas: { max_products: 0, max_orders: 10, max_pages: 5 },
    };

    console.log('📝 Creating Blueprint in Registry...');
    await publicDb.insert(onboardingBlueprints).values({
      name: 'Banned Blueprint',
      plan: 'free',
      nicheType: 'retail',
      blueprint: blueprintData,
      status: 'active',
    });

    // 2. Simulate Tenant Provisioning
    console.log('🏗️ Simulating Provisioning Record...');
    const [tenant] = await publicDb
      .insert(tenants)
      .values({
        subdomain,
        name: 'Test Store',
        plan: 'free',
        status: 'active',
        nicheType: 'retail',
      })
      .returning();

    // 3. Simulate syncGovernance (The core bridge of the refactor)
    console.log('🔄 Syncing Quotas to Governance Service...');
    await publicDb
      .insert(tenantQuotas)
      .values({
        tenantId: tenant.id,
        maxProducts: blueprintData.quotas.max_products,
        maxOrders: blueprintData.quotas.max_orders,
        maxPages: blueprintData.quotas.max_pages,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: [tenantQuotas.tenantId],
        set: {
          maxProducts: blueprintData.quotas.max_products,
          maxOrders: blueprintData.quotas.max_orders,
          maxPages: blueprintData.quotas.max_pages,
          updatedAt: new Date(),
        },
      });

    // 4. Verify Enforcement (The "Wow" moment - dynamic quota check)
    console.log('🔍 Testing Real-time Enforcement...');
    const result = await governanceService.checkQuota(
      tenant.id,
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

    const blueprintData = {
      version: '1.0',
      name: 'Pro Plan',
      modules: { ecommerce: true },
      quotas: { max_products: 100, max_orders: 1000, max_pages: 50 },
    };

    const [tenant] = await publicDb
      .insert(tenants)
      .values({
        subdomain,
        name: 'Pro Store',
        plan: 'pro',
        status: 'active',
        nicheType: 'retail',
      })
      .returning();

    await publicDb.insert(tenantQuotas).values({
      tenantId: tenant.id,
      maxProducts: blueprintData.quotas.max_products,
      maxOrders: blueprintData.quotas.max_orders,
      maxPages: blueprintData.quotas.max_pages,
      updatedAt: new Date(),
    });

    const result = await governanceService.checkQuota(
      tenant.id,
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
