/**
 * OrphanMediaCleanupCron — Architect-Directed Fallback Cleanup Strategy
 *
 * Runs daily at 03:00 UTC. Scans each tenant bucket's `public/products/` prefix
 * and deletes any object whose URL is not referenced in the `products_in_storefront`
 * table (i.e. abandoned by a form that was closed before submission).
 *
 * Protocol compliance:
 *  - S7: Uses env.MINIO_ENDPOINT (not hardcoded)
 *  - Protocol B3: Fully unit-testable via Mock S3 adapter
 *  - Protocol B6: No synchronous blocking calls
 */

import { env } from '@apex/config';
import {
  adminDb,
  and,
  eq,
  getTenantDb,
  isNotNull,
  isNull,
  lt,
  productsInStorefront,
  tenantsInGovernance,
} from '@apex/db';
import {
  DeleteObjectCommand,
  ListObjectsV2Command,
  S3Client,
} from '@aws-sdk/client-s3';
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';

/**
 * OrphanMediaCleanupCron — Architect-Directed Remediation (Incident A Fix)
 *
 * Scans all active tenant buckets and deletes orphaned media/drafts.
 * Protocols Applied:
 * - Dynamic Tenant Iteration: Respects physical schema isolation.
 * - S1/S7 Compliance: Uses secure credential loading and TLS.
 * - Memory Safety: Explicit connection release via [Symbol.asyncDispose] or manual release().
 */
@Injectable()
export class OrphanMediaCleanupCron {
  private readonly logger = new Logger(OrphanMediaCleanupCron.name);

  /**
   * Scans each tenant's assets and purges objects not referenced in DB.
   */
  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async cleanupOrphanedMedia(): Promise<void> {
    this.logger.log('ORPHAN_CLEANUP_START: Discovering active tenants...');

    const tenants = await this.getActiveTenants();
    if (tenants.length === 0) {
      this.logger.warn('ORPHAN_CLEANUP_SKIP: No active tenants found.');
      return;
    }

    const s3Client = this.getS3Client();
    for (const tenant of tenants) {
      const schemaName = this.getSchemaName(tenant.subdomain);
      await this.processTenantMediaCleanup(
        tenant.id,
        schemaName,
        tenant.subdomain,
        s3Client
      );
    }

    this.logger.log(
      `ORPHAN_CLEANUP_DONE: Processed ${tenants.length} tenants.`
    );
  }

  /**
   * Draft GC — Purges abandoned drafts (isActive=false, unpublished) older than 24h.
   */
  @Cron('30 3 * * *')
  async cleanupAbandonedDrafts(): Promise<void> {
    this.logger.log('DRAFT_GC_START: Discovering active tenants...');

    const tenants = await this.getActiveTenants();
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    for (const tenant of tenants) {
      const schemaName = this.getSchemaName(tenant.subdomain);
      await this.processTenantDraftCleanup(
        tenant.id,
        schemaName,
        tenant.subdomain,
        cutoff
      );
    }

    this.logger.log(`DRAFT_GC_DONE: Processed ${tenants.length} tenants.`);
  }

  // ─── Private Helpers ───────────────────────────────────────────────────────

  private async getActiveTenants() {
    return await adminDb
      .select({
        id: tenantsInGovernance.id,
        subdomain: tenantsInGovernance.subdomain,
      })
      .from(tenantsInGovernance)
      .where(
        and(
          eq(tenantsInGovernance.status, 'active'),
          isNotNull(tenantsInGovernance.subdomain)
        )
      );
  }

  private getSchemaName(subdomain: string): string {
    return `tenant_${subdomain.toLowerCase().replace(/[^a-z0-9]/g, '')}`;
  }

  /**
   * Cognitive Complexity < 15: Per-tenant media cleanup logic.
   */
  private async processTenantMediaCleanup(
    tenantId: string,
    schemaName: string,
    subdomain: string,
    s3Client: S3Client
  ) {
    const { db, release } = await getTenantDb(tenantId, schemaName);
    const bucketName = `tenant-${subdomain.toLowerCase()}-assets`;

    try {
      // 1. Collect valid media URLs from this tenant's schema
      const products = await db
        .select({
          mainImage: productsInStorefront.mainImage,
          galleryImages: productsInStorefront.galleryImages,
        })
        .from(productsInStorefront);

      const validUrls = new Set<string>();
      for (const p of products) {
        if (p.mainImage) validUrls.add(p.mainImage);
        if (Array.isArray(p.galleryImages)) {
          for (const img of p.galleryImages as Array<{ url?: string }>) {
            if (img.url) validUrls.add(img.url);
          }
        }
      }

      // 2. Scan bucket for orphans
      let continuationToken: string | undefined;
      do {
        const listResult = await s3Client.send(
          new ListObjectsV2Command({
            Bucket: bucketName,
            Prefix: 'public/products/',
            ContinuationToken: continuationToken,
          })
        );

        for (const obj of listResult.Contents ?? []) {
          if (!obj.Key) continue;
          const fullUrl = `${env.STORAGE_PUBLIC_URL}/${bucketName}/${obj.Key}`;

          if (!validUrls.has(fullUrl)) {
            await s3Client.send(
              new DeleteObjectCommand({ Bucket: bucketName, Key: obj.Key })
            );
            this.logger.debug(
              `ORPHAN_DELETED [${subdomain}]: ${obj.Key}`
            );
          }
        }

        continuationToken = listResult.IsTruncated
          ? listResult.NextContinuationToken
          : undefined;
      } while (continuationToken);
    } catch (err) {
      this.logger.error(
        `ORPHAN_TENANT_FATAL [${subdomain}]: ${err instanceof Error ? err.message : String(err)}`
      );
    } finally {
      await release();
    }
  }

  /**
   * Cognitive Complexity < 15: Per-tenant draft garbage collection logic.
   */
  private async processTenantDraftCleanup(
    tenantId: string,
    schemaName: string,
    subdomain: string,
    cutoff: string
  ) {
    const { db, release } = await getTenantDb(tenantId, schemaName);
    const { deletePrefix } = await import('@apex/provisioning');

    try {
      const stale = await db
        .select({ id: productsInStorefront.id })
        .from(productsInStorefront)
        .where(
          and(
            eq(productsInStorefront.isActive, false),
            isNull(productsInStorefront.publishedAt),
            lt(productsInStorefront.createdAt, cutoff)
          )
        );

      for (const draft of stale) {
        await db
          .delete(productsInStorefront)
          .where(eq(productsInStorefront.id, draft.id));
        
        try {
          await deletePrefix(subdomain, 'public/products/' + draft.id);
        } catch (e) {
          this.logger.warn(`DRAFT_GC_MINIO_WARN [${subdomain}]: ${draft.id}`);
        }
        this.logger.debug(`DRAFT_GC_PURGED [${subdomain}]: ${draft.id}`);
      }
    } catch (err) {
      this.logger.error(
        `DRAFT_GC_TENANT_FATAL [${subdomain}]: ${err instanceof Error ? err.message : String(err)}`
      );
    } finally {
      await release();
    }
  }

  private getS3Client(): S3Client {
    const accessKeyId = env.MINIO_ACCESS_KEY;
    const secretAccessKey = env.MINIO_SECRET_KEY;

    if (!accessKeyId || !secretAccessKey) {
      throw new Error('S1 VIOLATION: MinIO credentials missing.');
    }

    return new S3Client({
      endpoint: env.MINIO_ENDPOINT,
      region: env.MINIO_REGION || 'us-east-1',
      credentials: { accessKeyId, secretAccessKey },
      forcePathStyle: true,
    });
  }
}

