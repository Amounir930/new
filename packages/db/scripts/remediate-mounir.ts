import { adminDb, and, eq, featureGatesInGovernance } from '@apex/db';

async function remediateMounir() {
  const MOUNIR_TENANT_ID = '20cd61b6-6573-4f99-bea6-f6439761177a';
  console.log(`🚀 Remediating Tenant: ${MOUNIR_TENANT_ID} (mounir)`);

  await adminDb
    .insert(featureGatesInGovernance)
    .values({
      tenantId: MOUNIR_TENANT_ID,
      featureKey: 'ecommerce',
      isEnabled: true,
      rolloutPercentage: 100,
    })
    .onConflictDoUpdate({
      target: [
        featureGatesInGovernance.tenantId,
        featureGatesInGovernance.featureKey,
      ],
      set: { isEnabled: true },
    });

  console.log('✅ Remediation Complete for mounir');
  process.exit(0);
}

remediateMounir().catch((err) => {
  console.error('❌ Remediation Failed:', err);
  process.exit(1);
});
