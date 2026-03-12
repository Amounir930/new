import {
  adminDb,
  onboardingBlueprintsInGovernance,
  subscriptionPlansInGovernance,
} from '@apex/db';
import { eq } from 'drizzle-orm';

async function seedGovernance() {
  console.log('🚀 Seeding Governance Subscription Plans...');

  const plans = [
    {
      code: 'free',
      name: 'Free Plan',
      description: 'Perfect for getting started',
      priceMonthly: 0,
      priceYearly: 0,
      priceMonthlyV2: '0',
      priceYearlyV2: '0',
      defaultMaxProducts: 50,
      defaultMaxOrders: 100,
      defaultMaxPages: 5,
      defaultMaxStaff: 1,
      defaultMaxStorageGb: 1,
      isActive: true,
      sortOrder: 1,
    },
    {
      code: 'pro',
      name: 'Pro Plan',
      description: 'Advanced features for growing stores',
      priceMonthly: 2900, // $29.00
      priceYearly: 29000, // $290.00
      priceMonthlyV2: '29.00',
      priceYearlyV2: '290.00',
      defaultMaxProducts: 1000,
      defaultMaxOrders: 5000,
      defaultMaxPages: 50,
      defaultMaxStaff: 10,
      defaultMaxStorageGb: 20,
      isActive: true,
      sortOrder: 2,
    },
    {
      code: 'enterprise',
      name: 'Enterprise Plan',
      description: 'Unlimited scale and dedicated support',
      priceMonthly: 19900, // $199.00
      priceYearly: 199000, // $1990.00
      priceMonthlyV2: '199.00',
      priceYearlyV2: '1990.00',
      defaultMaxProducts: 100000,
      defaultMaxOrders: 1000000,
      defaultMaxPages: 1000,
      defaultMaxStaff: 100,
      defaultMaxStorageGb: 1000,
      isActive: true,
      sortOrder: 3,
    },
  ];

  for (const plan of plans) {
    console.log(`Checking plan: ${plan.code}`);
    await adminDb
      .insert(subscriptionPlansInGovernance)
      .values(plan as any)
      .onConflictDoUpdate({
        target: subscriptionPlansInGovernance.code,
        set: plan as any,
      });
  }

  console.log('📦 Seeding Onboarding Blueprints...');

  const blueprints = [
    {
      name: 'Retail Default',
      plan: 'free',
      nicheType: 'retail',
      isDefault: true,
      status: 'active',
      blueprint: {
        name: 'Retail Default',
        version: '1.0',
        modules: {
          core: { siteName: 'My Store', currency: 'USD' },
          catalog: true,
          cart: true,
          checkout: true,
        },
      },
      uiConfig: { theme: 'modern', primaryColor: '#000000' },
    },
    {
      name: 'Pro Retail',
      plan: 'pro',
      nicheType: 'retail',
      isDefault: true,
      status: 'active',
      blueprint: {
        name: 'Pro Retail',
        version: '1.0',
        modules: {
          core: { siteName: 'Pro Store', currency: 'USD' },
          catalog: true,
          inventory: true,
          analytics: true,
        },
      },
      uiConfig: { theme: 'premium', primaryColor: '#1a1a1a' },
    },
    {
      name: 'Enterprise Retail',
      plan: 'enterprise',
      nicheType: 'retail',
      isDefault: true,
      status: 'active',
      blueprint: {
        name: 'Enterprise Retail',
        version: '1.0',
        modules: {
          core: { siteName: 'Enterprise Store', currency: 'USD' },
          catalog: true,
          inventory: true,
          analytics: true,
          apiAccess: true,
          pos: true,
        },
      },
      uiConfig: { theme: 'enterprise', primaryColor: '#003366' },
    },
  ];

  for (const bp of blueprints) {
    console.log(`Checking blueprint: ${bp.name} for plan ${bp.plan}`);
    // Check if exists first since we don't have a simple unique constraint on name/plan/niche in schema but we should
    await adminDb.insert(onboardingBlueprintsInGovernance).values(bp as any);
  }

  console.log('✅ Governance Seeding Task Complete');
  process.exit(0);
}

seedGovernance().catch((err) => {
  console.error('❌ Seeding Failed:', err);
  process.exit(1);
});
