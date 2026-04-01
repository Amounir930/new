import { Injectable, Logger } from '@nestjs/common';
import {
  CreateBucketCommand,
  HeadBucketCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { env } from '@apex/config';

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly s3Client: S3Client;
  private readonly provisionedBuckets = new Set<string>();

  constructor() {
    this.s3Client = new S3Client({
      endpoint: env.MINIO_ENDPOINT,
      region: env.MINIO_REGION || 'us-east-1',
      credentials: {
        accessKeyId: env.MINIO_ACCESS_KEY || '',
        secretAccessKey: env.MINIO_SECRET_KEY || '',
      },
      forcePathStyle: true,
    });

    if (!env.MINIO_ACCESS_KEY || !env.MINIO_SECRET_KEY) {
      this.logger.error('S1 VIOLATION: MinIO credentials missing in environment.');
    }
  }

  /**
   * Returns the managed S3/MinIO client
   */
  getClient(): S3Client {
    return this.s3Client;
  }

  /**
   * JIT Auto-Provisioning (S15 Active Defense for Infrastructure)
   * Ensures the bucket exists before performing operations.
   * Uses process-level memoization to eliminate HeadBucket latency overhead.
   */
  async ensureBucketExists(bucketName: string): Promise<void> {
    if (this.provisionedBuckets.has(bucketName)) {
      return;
    }

    try {
      // 1. Check if bucket exists
      await this.s3Client.send(new HeadBucketCommand({ Bucket: bucketName }));
      this.provisionedBuckets.add(bucketName);
    } catch (err: any) {
      // 2. If 404, we must provision (Active Healing)
      if (err.name === 'NotFound' || err.$metadata?.httpStatusCode === 404) {
        this.logger.warn(`Infrastructure Drift: Bucket "${bucketName}" not found. Provisioning now...`);
        
        try {
          await this.s3Client.send(new CreateBucketCommand({ Bucket: bucketName }));
          this.provisionedBuckets.add(bucketName);
          this.logger.log(`Active Healing: Bucket "${bucketName}" successfully provisioned.`);
        } catch (createErr: any) {
          // Handle race conditions: if another request created it simultaneously
          if (createErr.name === 'BucketAlreadyOwnedByYou' || createErr.name === 'BucketAlreadyExists') {
            this.provisionedBuckets.add(bucketName);
            return;
          }
          this.logger.error(`Critical Infrastructure Failure: Could not create bucket "${bucketName}": ${createErr.message}`);
          throw createErr;
        }
      } else {
        // Unexpected error (Permission/Network)
        this.logger.error(`Storage Error: Pre-flight check for "${bucketName}" failed: ${err.message}`);
        throw err;
      }
    }
  }
}
