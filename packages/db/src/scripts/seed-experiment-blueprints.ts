import { eq } from 'drizzle-orm';
import { onboardingBlueprints, publicDb } from '../index';

const PLANS = ['free', 'basic', 'pro', 'enterprise'];
const SECTORS = [
  'retail',
  'wellness',
  'education',
  'services',
  'hospitality',
  'real-estate',
  'creative',
];

function getQuotasForPlan(plan: string) {
  switch (plan) {
    case 'free':
      return { max_products: 10, max_orders: 50, max_pages: 5 };
    case 'basic':
      return { max_products: 100, max_orders: 500, max_pages: 20 };
    case 'pro':
      return { max_products: 1000, max_orders: 5000, max_pages: 50 };
    case 'enterprise':
      return { max_products: 10000, max_orders: 50000, max_pages: 200 };
    default:
      return { max_products: 10, max_orders: 50, max_pages: 5 };
  }
}

async function seed() {
  console.log(
    '🚀 Forcing new version deployment (Wipe & Recreate ALL Sectors)...'
  );

  for (const sector of SECTORS) {
    console.log(`\n=== Processing Sector: ${sector.toUpperCase()} ===`);

    // 1. Wipe all existing blueprints for this sector
    console.log(`🗑️  WIPING all blueprints for sector: ${sector}...`);
    await publicDb
      .delete(onboardingBlueprints)
      .where(eq(onboardingBlueprints.nicheType, sector));

    console.log(`🌱 Seeding Experiment Blueprints for Sector: ${sector}...`);

    for (const plan of PLANS) {
      const blueprintData = {
        version: '1.0',
        name: `${plan.toUpperCase()} Plan`,
        modules: { ecommerce: true, catalog: true },
        quotas: getQuotasForPlan(plan),
      };

      console.log(`📝 Inserting Blueprint for ${sector}/${plan}...`);

      await publicDb.insert(onboardingBlueprints).values({
        name: `${sector}-${plan}-blueprint`,
        nicheType: `${sector}-${plan}`,
        plan: plan,
        blueprint: blueprintData,
        uiConfig: blueprintData,
        status: 'active',
      });
    }
  }

  console.log('\n✅ All Experiment Blueprints Seeded Successfully!');
  process.exit(0);
}

seed().catch((err) => {
  console.error(`❌ Seeding Failed: ${err}`);
  process.exit(1);
});
