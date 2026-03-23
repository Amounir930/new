#!/usr/bin/env bun
/**
 * Governance Tenant Seeder (System Restoration)
 * Usage: bun run src/scripts/seed-governance.ts
 */

import { publicDb as db, tenants } from '@apex/db';

async function main() {
  console.log('🚀 Starting Governance Seed...');

  try {
    const systemTenants = [
      {
        subdomain: 'admin',
        name: 'Apex Merchant Admin',
        plan: 'enterprise',
        status: 'active',
        nicheType: 'system',
      },
      {
        subdomain: 'storage-admin',
        name: 'Apex Storage Admin',
        plan: 'enterprise',
        status: 'active',
        nicheType: 'system',
      },
      {
        subdomain: 'super-admin',
        name: 'Apex Super Admin',
        plan: 'enterprise',
        status: 'active',
        nicheType: 'system',
      }
    ];

    for (const tenant of systemTenants) {
      await db
        .insert(tenants)
        .values(tenant as any)
        .onConflictDoUpdate({
          target: tenants.subdomain,
          set: { status: 'active' }
        });
      console.log(`✅ Seeded tenant: ${tenant.subdomain}`);
    }

    console.log('✨ Governance Seed complete!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

main();
