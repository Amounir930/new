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

@Injectable()
export class OrphanMediaCleanupCron {
  private readonly logger = new Logger(OrphanMediaCleanupCron.name);

  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async cleanupOrphanedMedia(): Promise<void> {
    this.logger.log('ORPHAN_CLEANUP_START: Scanning all tenant buckets...');

    const accessKeyId = env.MINIO_ACCESS_KEY;
    const secretAccessKey = env.MINIO_SECRET_KEY;

    if (!accessKeyId || !secretAccessKey) {
      this.logger.error(
        'ORPHAN_CLEANUP_FATAL: MinIO credentials missing in environment.'
      );
      return;
    }

    const s3Client = new S3Client({
      endpoint: env.MINIO_ENDPOINT,
      region: env.MINIO_REGION || 'us-east-1',
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
      forcePathStyle: true,
    });

    // 1. Collect all valid media URLs stored in the database
    const products = await adminDb
      .select({
        mainImage: productsInStorefront.mainImage,
        galleryImages: productsInStorefront.galleryImages,
      })
      .from(productsInStorefront);

    const validUrls = new Set<string>();
    for (const product of products) {
      if (product.mainImage) {
        validUrls.add(product.mainImage);
      }
      const gallery = product.galleryImages;
      if (Array.isArray(gallery)) {
        for (const img of gallery as Array<{ url?: string }>) {
          if (img.url) validUrls.add(img.url);
        }
      }
    }

    this.logger.log(
      `ORPHAN_CLEANUP: Found ${validUrls.size} valid URLs referenced in DB.`
    );

    // 2. Dynamic tenant bucket discovery (no manual env var needed)
    const tenants = await adminDb
      .select({
        subdomain: tenantsInGovernance.subdomain,
        status: tenantsInGovernance.status,
      })
      .from(tenantsInGovernance)
      .where(
        and(
          eq(tenantsInGovernance.status, 'active'),
          isNotNull(tenantsInGovernance.subdomain)
        )
      );

    const buckets = tenants.map(
      (t) => `tenant-${t.subdomain.toLowerCase()}-assets`
    );

    this.logger.log(
      `ORPHAN_CLEANUP: Discovered ${buckets.length} active tenant buckets.`
    );

    if (buckets.length === 0) {
      this.logger.warn(
        'ORPHAN_CLEANUP_SKIP: No active tenant buckets found in database.'
      );
      return;
    }

    let totalDeleted = 0;

    for (const bucketName of buckets) {
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
            try {
              await s3Client.send(
                new DeleteObjectCommand({ Bucket: bucketName, Key: obj.Key })
              );
              totalDeleted++;
              this.logger.debug(`ORPHAN_DELETED: ${obj.Key}`);
            } catch (deleteErr) {
              this.logger.warn(
                `ORPHAN_DELETE_FAILED: ${obj.Key} — ${deleteErr instanceof Error ? deleteErr.message : String(deleteErr)}`
              );
            }
          }
        }

        continuationToken = listResult.IsTruncated
          ? listResult.NextContinuationToken
          : undefined;
      } while (continuationToken);
    }

    this.logger.log(
      `ORPHAN_CLEANUP_DONE: Deleted ${totalDeleted} orphaned objects across ${buckets.length} buckets.`
    );
  }

  /**
   * Draft GC — Architect Mandate (Modification 2)
   * Hard-deletes abandoned drafts (is_active=false, never published) older than 24h + wipes MinIO.
   */
  @Cron('30 3 * * *')
  async cleanupAbandonedDrafts(): Promise<void> {
    this.logger.log(
      'DRAFT_GC_START: Purging abandoned drafts older than 24h...'
    );
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
    try {
      const stale = await adminDb
        .select({ id: productsInStorefront.id })
        .from(productsInStorefront)
        .where(
          and(
            eq(productsInStorefront.isActive, false),
            isNull(productsInStorefront.publishedAt),
            lt(productsInStorefront.createdAt, cutoff.toISOString())
          )
        );

      if (stale.length === 0) {
        this.logger.log('DRAFT_GC_DONE: No abandoned drafts.');
        return;
      }

      const tenants = await adminDb
        .select({ subdomain: tenantsInGovernance.subdomain })
        .from(tenantsInGovernance)
        .where(
          and(
            eq(tenantsInGovernance.status, 'active'),
            isNotNull(tenantsInGovernance.subdomain)
          )
        );

      const { deletePrefix } = await import('@apex/provisioning');

      for (const draft of stale) {
        await adminDb
          .delete(productsInStorefront)
          .where(eq(productsInStorefront.id, draft.id));
        for (const t of tenants) {
          try {
            await deletePrefix(t.subdomain, 'public/products/' + draft.id);
          } catch (e) {
            this.logger.warn('DRAFT_GC_MINIO_WARN: ' + draft.id);
          }
        }
        this.logger.debug('DRAFT_GC_PURGED: ' + draft.id);
      }
      this.logger.log(
        'DRAFT_GC_DONE: Purged ' + stale.length + ' abandoned draft(s).'
      );
    } catch (err) {
      this.logger.error(
        'DRAFT_GC_FATAL: ' + (err instanceof Error ? err.message : String(err))
      );
    }
  }
}
