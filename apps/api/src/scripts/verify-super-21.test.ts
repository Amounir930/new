/**
 * Super-#21 Verification Script (Mocked)
 * Tests BlueprintsService for CRUD and Security (S3, S4) isolation.
 * Run with: bun apps/api/src/scripts/verify-super-21.ts
 */

import { mock } from 'bun:test';
import { BlueprintsService } from '../blueprints/blueprints.service.js';
import type { CreateBlueprintDto } from '../blueprints/dto/blueprint.dto.js';

// Mock Dependencies
const mockPool = {
  connect: mock(),
  query: mock(),
};

const mockAudit = {
  log: mock(),
};

// Mock Drizzle methods
const mockDb = {
  select: mock().mockReturnThis(),
  from: mock().mockReturnThis(),
  where: mock().mockReturnThis(),
  insert: mock().mockReturnThis(),
  values: mock().mockReturnThis(),
  update: mock().mockReturnThis(),
  set: mock().mockReturnThis(),
  delete: mock().mockReturnThis(),
  returning: mock(),
};

// No need for global module mocking since we instantiate the service manually
// and inject the mockDb directly on line 55.

async function verify() {
  console.log('🚀 Starting Super-#21 Logic Verification (Mocked DB)...');

  // Override drizzle in the service context if possible,
  // but since it's instantiated in constructor, we might need to rely on the mock above
  // OR just instantiate the service manually for this unit test script.

  // Let's use manual instantiation for absolute control and no DI complexity
  const service = new BlueprintsService(mockPool, mockAudit as any);
  (service as any).db = mockDb as any;

  const userId = 'super-admin-01';

  // 1. Test Create (Valid)
  console.log('\n🧪 Test 1: Create Valid Blueprint');
  const dto: CreateBlueprintDto = {
    name: 'Test Blueprint',
    description: 'A test blueprint',
    plan: 'free',
    isDefault: false,
    blueprint: JSON.stringify({ products: [] }),
  };

  mockDb.returning.mockResolvedValueOnce([{ id: 'bp-123', ...dto }]);

  try {
    const created = await service.create(userId, dto);
    console.log('✅ Created:', created.id);

    // Verify Audit
    if (mockAudit.log.mock.calls.length > 0) {
      console.log('✅ S4 Audit Log Triggered');
      const logCall = mockAudit.log.mock.calls[0][0];
      if (
        logCall.action === 'BLUEPRINT_CREATED' &&
        logCall.entityType === 'onboarding_blueprints'
      ) {
        console.log('✅ Audit Log Content Verified');
      } else {
        console.error('❌ Audit Log Mismatch:', logCall);
      }
    } else {
      console.error('❌ S4 Audit Log NOT Triggered');
    }
  } catch (e) {
    console.error('❌ Failed to create:', e);
  }

  // 2. Test S3: Invalid JSON
  console.log('\n🧪 Test 2: S3 Input Validation (Invalid JSON)');
  try {
    const invalidDto = { ...dto, blueprint: '{ invalid json ' };
    await service.create(userId, invalidDto);
    console.error('❌ Failed: Should have rejected invalid JSON');
  } catch (e: any) {
    if (e?.message?.includes('Invalid JSON')) {
      console.log('✅ S3 Caught Invalid JSON');
    } else {
      console.error('❌ Unexpected error:', e);
    }
  }

  // 3. Test Update (S4 Audit)
  console.log('\n🧪 Test 3: Update Blueprint (S4 Audit)');
  mockDb.returning.mockResolvedValueOnce([
    { id: 'bp-123', description: 'Updated' },
  ]);

  try {
    await service.update(userId, 'bp-123', { description: 'Updated' });

    // Check latest audit log
    const latestLog =
      mockAudit.log.mock.calls[mockAudit.log.mock.calls.length - 1][0];
    if (latestLog.action === 'BLUEPRINT_UPDATED') {
      console.log('✅ S4 Audit Log Triggered (Update)');
    } else {
      console.error('❌ Audit Log Mismatch for Update:', latestLog);
    }
  } catch (e) {
    console.error('❌ Update failed:', e);
  }

  console.log('\n🏁 Verification Complete');
}

verify().catch(console.error);
