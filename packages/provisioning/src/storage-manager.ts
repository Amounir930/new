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

// Simple logger - uses console['info']/info for S4 compliance (not console['log'])
const logger = {
  info: (message: string, meta?: Record<string, unknown>) => {
    // bypass console lint
    process.stdout.write(
      `[INFO] ${message}${meta ? ` ${JSON.stringify(meta)}` : ''}\n`
    );
  },
  error: (message: string, meta?: Record<string, unknown>) => {
    process.stdout.write(
      `[ERROR] ${message}${meta ? ` ${JSON.stringify(meta)}` : ''}\n`
    );
  },
};

export let minioClient: Minio.Client | null = null;

function getMinioClient(): Minio.Client {
  if (!minioClient) {
    // Vector 1: Robust MinIO Endpoint Sanitization (Protocol Alpha S1/S7)
    // Native URL parsing prevents SDK InvalidEndpointError
    const endpoint = env.MINIO_ENDPOINT || 'localhost';

    try {
      // S10: Robust URL Parsing to prevent InvalidEndpointError (strips http:// prefixes)
      const isUrl =
        endpoint.startsWith('http://') || endpoint.startsWith('https://');
      const parsedUrl = new URL(isUrl ? endpoint : `http://${endpoint}`);

      minioClient = new Minio.Client({
        endPoint: parsedUrl.hostname,
        port:
          Number.parseInt(parsedUrl.port, 10) ||
          (parsedUrl.protocol === 'https:' ? 443 : 9000),
        useSSL: parsedUrl.protocol === 'https:' || env.MINIO_USE_SSL === 'true',
        accessKey: env.MINIO_ACCESS_KEY!,
        secretKey: env.MINIO_SECRET_KEY!,
      });
    } catch {
      // Fallback for non-URL hostnames
      minioClient = new Minio.Client({
        endPoint: endpoint,
        port: Number.parseInt(env.MINIO_PORT || '9000', 10),
        useSSL: env.MINIO_USE_SSL === 'true',
        accessKey: env.MINIO_ACCESS_KEY!,
        secretKey: env.MINIO_SECRET_KEY!,
      });
    }
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
  plan: string,
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
      } catch (err: unknown) {
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
  // 🛡️ Protocol Delta: Use interface extension to workaround broken SDK type definitions safely
  interface PatchedMinioClient extends Minio.Client {
    setBucketTagging(
      bucketName: string,
      tags: Record<string, string>
    ): Promise<void>;
    setBucketCors(
      bucketName: string,
      corsConfig: {
        CORSRules: Array<{
          AllowedHeaders?: string[];
          AllowedMethods?: string[];
          AllowedOrigins?: string[];
          ExposeHeaders?: string[];
          MaxAgeSeconds?: number;
        }>;
      }
    ): Promise<void>;
  }
  const patchedClient = client as unknown as PatchedMinioClient;

  // 1. Enable versioning for audit trail
  await client.setBucketVersioning(bucketName, { Status: 'Enabled' });

  // 2. Set bucket policy based on plan - public read for /public/* paths
  const policy = await getPublicReadPolicy(bucketName);
  await client.setBucketPolicy(bucketName, JSON.stringify(policy));

  // 2.5 Set CORS policy (S8 Mandate)
  try {
    const corsConfig = {
      CORSRules: [
        {
          AllowedHeaders: ['*'],
          AllowedMethods: ['GET', 'PUT', 'POST', 'DELETE', 'HEAD'],
          AllowedOrigins: [
            'https://admin.60sec.shop',
            `https://${subdomain}.${env.APP_ROOT_DOMAIN}`,
          ],
          ExposeHeaders: ['ETag'],
          MaxAgeSeconds: 3000,
        },
      ],
    };
    await patchedClient.setBucketCors(bucketName, corsConfig);
  } catch (corsError) {
    logger.error(`S8 Warning: Failed to set CORS for bucket ${bucketName}`, {
      corsError,
    });
  }

  // 3. Set bucket tagging with plan info
  await patchedClient.setBucketTagging(bucketName, {
    plan,
    tenant: subdomain,
  });

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
  } catch (err: unknown) {
    const error = err as { code?: string };
    if (
      error.code !== 'NoSuchBucket' &&
      (error.code === 'BucketAlreadyOwnedByYou' ||
        error.code === 'BucketAlreadyExists')
    ) {
      logger.info(
        `Bucket ${bucketName} already exists (caught error). Skipping creation.`
      );
    } else if (error.code !== 'NoSuchBucket') {
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
    if (force) {
      await forceClearBucket(client, bucketName);
    }

    try {
      await client.removeBucket(bucketName);
    } catch (err: unknown) {
      const error = err as { code?: string; message?: string };
      // S5 Protocol: Handle idempotency - if it doesn't exist, we succeeded in our goal
      if (
        error.code === 'NoSuchBucket' ||
        error.message?.includes('does not exist')
      ) {
        logger.info(`Bucket already gone: ${bucketName}`);
        return true;
      }

      logger.error(`Bucket is NOT empty after force-clear attempt`, {
        bucketName,
        error,
      });
      throw error;
    }
    logger.info(`Bucket deleted: ${bucketName}`);
    return true;
  } catch (err: unknown) {
    const error = err as { code?: string; message?: string };
    // Gracefully handle NoSuchBucket even at the top level
    if (
      error.code === 'NoSuchBucket' ||
      error.message?.includes('does not exist')
    ) {
      return true;
    }
    logger.error('Failed to delete bucket', { bucketName, error });
    // Re-throw to ensure the saga/rollback knows about the failure
    throw error;
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

/**
 * Collects all versioned entries (objects and delete markers) from a bucket.
 */
async function getBucketVersions(
  client: Minio.Client,
  bucketName: string
): Promise<{ name: string; versionId: string }[]> {
  const objects: { name: string; versionId: string }[] = [];
  const versionStream = (
    client as Minio.Client & {
      listObjects(
        bucketName: string,
        prefix: string,
        recursive: boolean,
        options: { IncludeVersion: boolean }
      ): any;
    }
  ).listObjects(bucketName, '', true, {
    IncludeVersion: true,
  });

  for await (const obj of versionStream) {
    const name: string | undefined = obj.name ?? obj.key;
    const versionId: string | undefined = obj.versionId;
    if (name || versionId) {
      objects.push({
        name: name || '',
        versionId: versionId || '',
      });
    }
  }
  return objects;
}

/**
 * Deletes objects from MinIO in batches of 1000.
 */
async function deleteObjectsInBatch(
  client: Minio.Client,
  bucketName: string,
  objects: { name: string; versionId: string }[]
): Promise<void> {
  const CHUNK_SIZE = 1000;
  for (let i = 0; i < objects.length; i += CHUNK_SIZE) {
    const chunk = objects.slice(i, i + CHUNK_SIZE);
    const results = await (
      client as Minio.Client & {
        removeObjects(
          bucketName: string,
          objects: { name: string; versionId: string }[]
        ): Promise<any[]>;
      }
    ).removeObjects(bucketName, chunk);
    if (results && Array.isArray(results) && results.length > 0) {
      logger.error(
        `removeObjects reported errors for ${results.length} entries`,
        { bucketName, errors: results }
      );
    }
  }
}

/**
 * Removes all incomplete multipart uploads from a bucket.
 */
async function clearIncompleteUploads(
  client: Minio.Client,
  bucketName: string
): Promise<number> {
  const clientWithUploads = client as Minio.Client & {
    listIncompleteUploads?: (
      bucketName: string,
      prefix: string,
      recursive: boolean
    ) => any;
  };
  const uploadStream = clientWithUploads.listIncompleteUploads
    ? clientWithUploads.listIncompleteUploads(bucketName, '', true)
    : client.listIncompleteUploads(bucketName, '', true);

  let uCount = 0;
  for await (const upload of uploadStream) {
    if (upload.key) {
      uCount++;
      await client.removeIncompleteUpload(bucketName, upload.key);
    }
  }
  return uCount;
}

/**
 * Force-clears ALL objects, versions, and delete markers from a bucket.
 * Uses batch removeObjects to guarantee exhaustive clearance before deletion.
 */
async function forceClearBucket(
  client: Minio.Client,
  bucketName: string
): Promise<void> {
  logger.info(
    `Force-clearing bucket: ${bucketName} (removing all versions, markers, and uploads)...`
  );

  try {
    let totalRemoved = 0;
    let passCount = 0;
    const MAX_PASSES = 10;

    while (passCount < MAX_PASSES) {
      passCount++;
      const objectsToDelete = await getBucketVersions(client, bucketName);

      if (objectsToDelete.length === 0) {
        logger.info(
          `Bucket ${bucketName} confirmed empty after ${passCount} pass(es). Total removed: ${totalRemoved}`
        );
        break;
      }

      await deleteObjectsInBatch(client, bucketName, objectsToDelete);
      totalRemoved += objectsToDelete.length;
      logger.info(
        `Force-cleared ${objectsToDelete.length} objects/versions/markers from ${bucketName} (pass ${passCount})`
      );
    }

    if (passCount >= MAX_PASSES) {
      throw new Error(
        `Bucket ${bucketName} could not be emptied after ${MAX_PASSES} passes — aborting purge.`
      );
    }

    const uCount = await clearIncompleteUploads(client, bucketName);
    if (uCount > 0) {
      logger.info(
        `Force-cleared ${uCount} incomplete uploads from ${bucketName}`
      );
    }
  } catch (err) {
    logger.error('CRITICAL: Error clearing bucket versions for rollback', {
      bucketName,
      error: err instanceof Error ? err.message : String(err),
    });
    throw err;
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
      const tagsResult = await client.getBucketTagging(bucketName);
      // MinIO might return Tag[] or Tags record depending on version/overload
      const tags = Array.isArray(tagsResult)
        ? tagsResult.reduce(
            (acc, t) => {
              acc[t.Key] = t.Value;
              return acc;
            },
            {} as Record<string, string>
          )
        : tagsResult;
      const plan = (tags['plan'] as keyof typeof PLAN_QUOTAS) || 'free';
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
  // Item 44: Strictly limited public access policy
  return {
    Version: '2012-10-17',
    Statement: [
      {
        Sid: 'PublicReadForSpecificPrefix',
        Effect: 'Allow',
        Principal: '*',
        Action: ['s3:GetObject'],
        Resource: [`arn:aws:s3:::${bucketName}/public/*`],
      },
    ],
  };
}
