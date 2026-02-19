import { onboardingBlueprints, publicDb } from '../index';

const PLANS = ['free', 'basic', 'pro', 'enterprise'];
const SECTOR = 'retail';

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
  console.log(`🚀 Forcing new version deployment...`);
  console.log(`🌱 Seeding Experiment Blueprints for Sector: ${SECTOR}...`);

  for (const plan of PLANS) {
    const blueprintData = {
      version: '1.0',
      name: `${plan.toUpperCase()} Plan`,
      modules: { ecommerce: true, catalog: true },
      quotas: getQuotasForPlan(plan),
    };

    console.log(`📝 Inserting/Updating Blueprint for ${SECTOR}/${plan}...`);

    await publicDb
      .insert(onboardingBlueprints)
      .values({
        name: `Retail ${plan.charAt(0).toUpperCase()}${plan.slice(1)} Blueprint`,
        plan: plan as any,
        nicheType: SECTOR,
        blueprint: blueprintData,
        status: 'active',
        isDefault: plan === 'free', // Set Free as default
      })
      .onConflictDoUpdate({
        target: [onboardingBlueprints.nicheType, onboardingBlueprints.plan],
        set: {
          blueprint: blueprintData,
          status: 'active',
          updatedAt: new Date(),
        },
      });
  }

  console.log(`✅ Experiment Blueprints Seeded Successfully!`);
  process.exit(0);
}

seed().catch((err) => {
  console.error(`❌ Seeding Failed: ${err}`);
  process.exit(1);
});
