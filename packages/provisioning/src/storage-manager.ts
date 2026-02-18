import { env } from '@apex/config';
import * as Minio from 'minio';

// Define types inline since types.ts doesn't exist
export interface BucketCreationResult {
  success: boolean;
  bucketName: string;
  error?: string;
  endpoint?: string;
  quotaBytes?: number;
  durationMs?: number;
  createdAt?: Date;
}

export interface StorageStats {
  totalObjects: number;
  totalSize: number;
  lastModified: Date | null;
  usedBytes?: number;
  quotaBytes?: number;
  usagePercent?: number;
}

// Simple logger - uses console.info/info for S4 compliance (not console.log)
const logger = {
  info: (message: string, meta?: Record<string, unknown>) => {
    // eslint-disable-next-line no-console
    console.info(`[INFO] ${message}`, meta ? JSON.stringify(meta) : '');
  },
  error: (message: string, meta?: Record<string, unknown>) => {
    console.error(`[ERROR] ${message}`, meta ? JSON.stringify(meta) : '');
  },
};

export let minioClient: Minio.Client | null = null;

function getMinioClient(): Minio.Client {
  if (!minioClient) {
    minioClient = new Minio.Client({
      endPoint: env.MINIO_ENDPOINT,
      port: Number.parseInt(env.MINIO_PORT, 10),
      useSSL: env.MINIO_USE_SSL === 'true',
      accessKey: env.MINIO_ACCESS_KEY,
      secretKey: env.MINIO_SECRET_KEY,
    });
  }
  return minioClient;
}

/**
 * Reset MinIO client singleton (Internal use for testing only)
 */
export function resetMinioClient(): void {
  minioClient = null;
}

/**
 * Set MinIO client singleton (Internal use for testing only)
 */
export function setMinioClient(client: Minio.Client): void {
  minioClient = client;
}

function sanitizeBucketName(subdomain: string): string {
  return `tenant-${subdomain.toLowerCase().replace(/[^a-z0-9]/g, '')}-assets`;
}

// Plan quotas in bytes
const PLAN_QUOTAS: Record<string, number> = {
  free: 1024 * 1024 * 1024, // 1GB
  basic: 10 * 1024 * 1024 * 1024, // 10GB
  pro: 100 * 1024 * 1024 * 1024, // 100GB
};

export async function createStorageBucket(
  subdomain: string,
  plan = 'free',
  injectedClient?: Minio.Client
): Promise<BucketCreationResult> {
  const start = Date.now();
  const bucketName = sanitizeBucketName(subdomain);
  const client = injectedClient || getMinioClient();

  try {
    // Retry logic for S15 Race Condition mitigation
    let attempts = 0;
    const maxAttempts = 3;
    while (attempts < maxAttempts) {
      try {
        await ensureBucket(client, bucketName);
        break;
      } catch (err: any) {
        attempts++;
        if (attempts >= maxAttempts) throw err;
        // Wait 1s before retry
        await new Promise((r) => setTimeout(r, 1000));
      }
    }

    // Setup bucket attributes and structure (Extracted to reduce complexity)
    await setupBucket(client, bucketName, plan, subdomain);

    const duration = Date.now() - start;

    logger.info(`Bucket created for tenant: ${subdomain}`, {
      bucketName,
      plan,
      duration,
    });

    return {
      success: true,
      bucketName,
      endpoint: `${env.MINIO_USE_SSL === 'true' ? 'https' : 'http'}://${
        env.MINIO_ENDPOINT
      }:${env.MINIO_PORT}/${bucketName}`,
      quotaBytes: PLAN_QUOTAS[plan] || PLAN_QUOTAS.free,
      durationMs: duration,
      createdAt: new Date(),
    };
  } catch (error) {
    logger.error('Failed to create storage bucket', { subdomain, error });
    throw new Error(
      `Failed to create storage bucket: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`
    );
  }
}

/**
 * Internal helper for bucket initialization
 */
async function setupBucket(
  client: Minio.Client,
  bucketName: string,
  plan: string,
  subdomain: string
): Promise<void> {
  // 1. Enable versioning for audit trail
  await client.setBucketVersioning(bucketName, { Status: 'Enabled' });

  // 2. Set bucket policy based on plan - public read for /public/* paths
  const policy = await getPublicReadPolicy(bucketName);
  await client.setBucketPolicy(bucketName, JSON.stringify(policy));

  // 3. Set bucket tagging with plan info
  await client.setBucketTagging(bucketName, {
    plan,
    tenant: subdomain,
  } as any);

  // 4. Create folder structure
  await client.putObject(bucketName, 'public/products/.keep', Buffer.from(''));
  await client.putObject(bucketName, 'private/exports/.keep', Buffer.from(''));
}

/**
 * Ensures bucket exists
 */
async function ensureBucket(
  client: Minio.Client,
  bucketName: string
): Promise<void> {
  const exists = await client.bucketExists(bucketName);
  if (exists) {
    logger.info(`Bucket ${bucketName} already exists. Skipping creation.`);
    return;
  }

  try {
    await client.makeBucket(bucketName, env.MINIO_REGION || 'us-east-1');
  } catch (err: any) {
    if (
      err.code === 'BucketAlreadyOwnedByYou' ||
      err.code === 'BucketAlreadyExists'
    ) {
      logger.info(
        `Bucket ${bucketName} already exists (caught error). Skipping creation.`
      );
    } else {
      throw err;
    }
  }
}

export async function deleteStorageBucket(
  subdomain: string,
  force = false
): Promise<boolean> {
  const bucketName = sanitizeBucketName(subdomain);
  const client = getMinioClient();

  try {
    const exists = await client.bucketExists(bucketName);
    if (!exists) {
      return false;
    }

    if (!force) {
      const objects = await client.listObjects(bucketName, '', true).toArray();
      if (objects.length > 0) {
        throw new Error('Bucket not empty. Use force=true to delete anyway.');
      }
    }

    await client.removeBucket(bucketName);
    logger.info(`Bucket deleted: ${bucketName}`);
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('not empty')) {
      throw error;
    }
    logger.error('Failed to delete bucket', { bucketName, error });
    return false;
  }
}

export async function getSignedUploadUrl(
  subdomain: string,
  objectName: string,
  expiry = 3600
): Promise<string> {
  const bucketName = sanitizeBucketName(subdomain);
  const client = getMinioClient();

  try {
    const url = await client.presignedPutObject(bucketName, objectName, expiry);
    return url;
  } catch (error) {
    logger.error('Failed to generate upload URL', {
      bucketName,
      objectName,
      error,
    });
    throw new Error('Failed to generate upload URL');
  }
}

export async function getSignedDownloadUrl(
  subdomain: string,
  objectName: string,
  expiry = 3600
): Promise<string> {
  const bucketName = sanitizeBucketName(subdomain);
  const client = getMinioClient();

  try {
    const url = await client.presignedGetObject(bucketName, objectName, expiry);
    return url;
  } catch (error) {
    logger.error('Failed to generate download URL', {
      bucketName,
      objectName,
      error,
    });
    throw new Error('Failed to generate download URL');
  }
}

export async function deleteObject(
  subdomain: string,
  objectName: string
): Promise<boolean> {
  const bucketName = sanitizeBucketName(subdomain);
  const client = getMinioClient();

  try {
    await client.removeObject(bucketName, objectName);
    return true;
  } catch (error) {
    logger.error('Failed to delete object', { bucketName, objectName, error });
    return false;
  }
}

export async function getStorageStats(
  subdomain: string
): Promise<StorageStats> {
  const bucketName = sanitizeBucketName(subdomain);
  const client = getMinioClient();

  try {
    const objects = await client.listObjects(bucketName, '', true).toArray();
    const totalSize = objects.reduce((acc, obj) => acc + (obj.size || 0), 0);

    // Get quota from bucket tags
    let quotaBytes = PLAN_QUOTAS.free;
    try {
      const tags = await client.getBucketTagging(bucketName);
      // Tags is Tag[] array, find the plan tag
      const planTag = tags.find((t) => t.Key === 'plan');
      const plan = (planTag?.Value as keyof typeof PLAN_QUOTAS) || 'free';
      quotaBytes = PLAN_QUOTAS[plan] || PLAN_QUOTAS.free;
    } catch {
      // Ignore tagging errors, use default quota
    }

    const usagePercent = quotaBytes > 0 ? (totalSize / quotaBytes) * 100 : 0;

    return {
      totalObjects: objects.length,
      totalSize,
      usedBytes: totalSize,
      quotaBytes,
      usagePercent,
      lastModified:
        objects.length > 0
          ? new Date(
              Math.max(
                ...objects.map((o) => new Date(o.lastModified || 0).getTime())
              )
            )
          : null,
    };
  } catch (error) {
    logger.error('Failed to get storage stats', { bucketName, error });
    throw new Error(
      `Failed to get storage stats: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`
    );
  }
}

async function getPublicReadPolicy(bucketName: string): Promise<unknown> {
  return {
    Version: '2012-10-17',
    Statement: [
      {
        Effect: 'Allow',
        Principal: '*',
        Action: ['s3:GetObject'],
        Resource: [`arn:aws:s3:::${bucketName}/public/*`],
      },
    ],
  };
}
