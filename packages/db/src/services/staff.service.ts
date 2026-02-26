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
    // C-1 Fix: No fallback salt allowed — fail hard per S1 Mandate.
    // A static salt in source code allows any reader to compute tokenHash and forge sessions.
    const salt = process.env.SESSION_SALT;
    if (!salt || salt.trim().length < 32) {
      throw new Error(
        'S1 Violation: SESSION_SALT is missing or too short (min 32 chars). Cannot create secure staff sessions.'
      );
    }
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
    // C-1 Fix: Same fail-hard logic for validation path.
    const salt = process.env.SESSION_SALT;
    if (!salt || salt.trim().length < 32) {
      throw new Error(
        'S1 Violation: SESSION_SALT is missing or too short (min 32 chars). Cannot validate staff sessions.'
      );
    }
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

      const session = result[0];

      if (!session) {
        // Order 4: Log failed session validation attempt as a security incident.
        await db.execute(sql`
          INSERT INTO governance.audit_logs (actor_id, action, tenant_id, metadata)
          VALUES (
            'SYSTEM',
            'STAFF_SESSION_FAILED',
            ${tenantId},
            jsonb_build_object(
              'reason', 'TOKEN_NOT_FOUND_OR_REVOKED',
              'timestamp', CLOCK_TIMESTAMP()
            )
          )
        `);
      }

      return session || null;
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
