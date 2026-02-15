/**
 * Storage Manager Tests
 * S3: Multi-tenant storage isolation
 * Rule 4.1: Test Coverage Mandate
 */

import { beforeEach, describe, expect, it, mock } from 'bun:test';
import {
  createStorageBucket,
  deleteStorageBucket,
  getStorageStats,
  resetMinioClient,
  setMinioClient,
} from './storage-manager.js';

// Mock MinIO client
const mockMinioClient = {
  bucketExists: mock(),
  makeBucket: mock(),
  setBucketVersioning: mock(),
  setBucketPolicy: mock(),
  setBucketTagging: mock(),
  putObject: mock(),
  removeBucket: mock(),
  listObjects: mock().mockReturnThis(),
  toArray: mock(),
  getBucketTagging: mock(),
  presignedPutObject: mock(),
  presignedGetObject: mock(),
  removeObject: mock(),
};

describe('StorageManager', () => {
  beforeEach(() => {
    mock.restore();
    resetMinioClient();
    setMinioClient(mockMinioClient as any);
  });

  describe('createStorageBucket', () => {
    const testCases = [
      {
        name: 'Success: Full Creation for Free Plan',
        subdomain: 'test-free',
        plan: 'free',
        exists: false,
        expectedBucket: 'tenant-testfree-assets',
      },
      {
        name: 'Success: Full Creation for Pro Plan',
        subdomain: 'test-pro',
        plan: 'pro',
        exists: false,
        expectedBucket: 'tenant-testpro-assets',
      },
    ];

    for (const { subdomain, plan, exists, expectedBucket, name } of testCases) {
      it(name, async () => {
        mockMinioClient.bucketExists.mockResolvedValue(exists);
        mockMinioClient.makeBucket.mockResolvedValue(undefined);
        mockMinioClient.setBucketVersioning.mockResolvedValue(undefined);
        mockMinioClient.setBucketPolicy.mockResolvedValue(undefined);
        mockMinioClient.setBucketTagging.mockResolvedValue(undefined);
        mockMinioClient.putObject.mockResolvedValue({} as any);

        const result = await createStorageBucket(subdomain, plan);

        expect(result.success).toBe(true);
        expect(result.bucketName).toBe(expectedBucket);
        expect(mockMinioClient.makeBucket).toHaveBeenCalledWith(
          expectedBucket,
          expect.any(String)
        );
        expect(mockMinioClient.setBucketTagging).toHaveBeenCalledWith(
          expectedBucket,
          expect.objectContaining({ plan })
        );
      });
    }

    it('should throw if bucket already exists', async () => {
      mockMinioClient.bucketExists.mockResolvedValue(true);

      await expect(createStorageBucket('duplicate')).rejects.toThrow(
        'Bucket already exists'
      );
    });
  });

  describe('deleteStorageBucket', () => {
    it('should delete empty bucket', async () => {
      mockMinioClient.bucketExists.mockResolvedValue(true);
      mockMinioClient.toArray.mockResolvedValue([]);
      mockMinioClient.removeBucket.mockResolvedValue(undefined);

      const result = await deleteStorageBucket('empty-tenant');

      expect(result).toBe(true);
      expect(mockMinioClient.removeBucket).toHaveBeenCalled();
    });

    it('should throw if bucket not empty and force is false', async () => {
      mockMinioClient.bucketExists.mockResolvedValue(true);
      mockMinioClient.toArray.mockResolvedValue([{ name: 'file.txt' }]);

      await expect(deleteStorageBucket('full-tenant')).rejects.toThrow(
        'Bucket not empty'
      );
    });

    it('should delete non-empty bucket if force is true', async () => {
      mockMinioClient.bucketExists.mockResolvedValue(true);
      mockMinioClient.removeBucket.mockResolvedValue(undefined);

      const result = await deleteStorageBucket('full-tenant', true);
      expect(result).toBe(true);
    });
  });

  describe('getStorageStats', () => {
    it('should calculate stats correctly', async () => {
      const mockObjects = [
        { name: 'o1', size: 100, lastModified: new Date('2024-01-01') },
        { name: 'o2', size: 400, lastModified: new Date('2024-01-02') },
      ];
      mockMinioClient.toArray.mockResolvedValue(mockObjects);
      mockMinioClient.getBucketTagging.mockResolvedValue([
        { Key: 'plan', Value: 'basic' },
      ]);

      const stats = await getStorageStats('tenant-1');

      expect(stats.totalObjects).toBe(2);
      expect(stats.totalSize).toBe(500);
      expect(stats.quotaBytes).toBe(10 * 1024 * 1024 * 1024); // 10GB for basic
      expect(stats.usagePercent).toBeCloseTo(0, 5);
      expect(stats.lastModified?.toISOString()).toBe(
        new Date('2024-01-02').toISOString()
      );
    });
  });
});
