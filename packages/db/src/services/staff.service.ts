import { createHash, randomBytes } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { and, eq, isNull, sql } from 'drizzle-orm';
import { withTenantConnection } from '../core.js';
import {
  type StaffMember,
  staffMembers,
  staffSessions,
} from '../schema/storefront/staff.js';

@Injectable()
export class StaffService {
  /**
   * Create a secure hashed session for a staff member.
   * Mandate #14: Never store raw session tokens in DB.
   */
  async createSession(
    tenantId: string,
    staffId: string,
    metadata: {
      ipAddress?: string;
      userAgent?: string;
      deviceFingerprint?: string;
    }
  ): Promise<{ token: string; expiresAt: Date }> {
    const rawToken = randomBytes(32).toString('hex');
    // Risk #Staff-S01: Forensic Salt for token hashing
    const salt = process.env.SESSION_SALT || 'ultimate_forensic_salt_2026';
    const tokenHash = createHash('sha256')
      .update(rawToken + salt)
      .digest('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h

    await withTenantConnection(tenantId, async (db) => {
      await db.insert(staffSessions).values({
        tenantId,
        staffId,
        tokenHash,
        expiresAt,
        ipAddress: metadata.ipAddress,
        userAgent: metadata.userAgent,
        deviceFingerprint: metadata.deviceFingerprint,
      });
    });

    return { token: rawToken, expiresAt };
  }

  /**
   * Validate a session token strictly via hash.
   */
  async validateSession(tenantId: string, token: string) {
    const salt = process.env.SESSION_SALT || 'ultimate_forensic_salt_2026';
    const tokenHash = createHash('sha256')
      .update(token + salt)
      .digest('hex');

    return await withTenantConnection(tenantId, async (db) => {
      const result = await db
        .select()
        .from(staffSessions)
        .where(
          and(
            eq(staffSessions.tokenHash, tokenHash),
            eq(staffSessions.tenantId, tenantId),
            isNull(staffSessions.revokedAt),
            sql`expires_at > CLOCK_TIMESTAMP()`
          )
        )
        .limit(1);

      return result[0] || null;
    });
  }

  /**
   * Revoke a specific session.
   */
  async revokeSession(tenantId: string, sessionId: string) {
    await withTenantConnection(tenantId, async (db) => {
      await db
        .update(staffSessions)
        .set({ revokedAt: sql`CLOCK_TIMESTAMP()` })
        .where(eq(staffSessions.id, sessionId));
    });
  }

  /**
   * Find staff member by user ID.
   */
  async findByUserId(
    tenantId: string,
    userId: string
  ): Promise<StaffMember | null> {
    return await withTenantConnection(tenantId, async (db) => {
      const result = await db
        .select()
        .from(staffMembers)
        .where(
          and(eq(staffMembers.userId, userId), isNull(staffMembers.deletedAt))
        )
        .limit(1);

      return result[0] || null;
    });
  }
}
