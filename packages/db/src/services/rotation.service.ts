import { randomUUID } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { eq, isNull, lt, or } from 'drizzle-orm';
import { publicDb } from '../connection.js';
import { tenants } from '../schema/governance.js';

/**
 * Vector 1: PII Salt Rotation Service
 * Automates the 90-day rotation of tenant encryption salts.
 */
@Injectable()
export class RotationService {
  /**
   * Run rotation for all eligible tenants.
   * Eligible: saltRotatedAt > 90 days ago OR saltRotatedAt is null.
   */
  async rotateAllEligible(): Promise<number> {
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const eligibleTenants = await publicDb
      .select({ id: tenants.id, secretSalt: tenants.secretSalt })
      .from(tenants)
      .where(
        or(
          isNull(tenants.saltRotatedAt),
          lt(tenants.saltRotatedAt, ninetyDaysAgo)
        )
      );

    let rotatedCount = 0;
    for (const tenant of eligibleTenants) {
      const newSalt = randomUUID();

      await publicDb
        .update(tenants)
        .set({
          oldSecretSalt: tenant.secretSalt,
          secretSalt: newSalt,
          saltRotatedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(tenants.id, tenant.id));

      rotatedCount++;
    }

    return rotatedCount;
  }
}
