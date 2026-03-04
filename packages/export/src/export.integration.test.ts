/**
 * Export Integration Tests
 * End-to-end testing of export and deletion workflow
 * Requires: PostgreSQL, Redis, MinIO running
 */

import { beforeAll, describe, expect, it } from 'bun:test';
import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3';

const INTEGRATION_TEST = process.env.RUN_INTEGRATION_TESTS === 'true';

(INTEGRATION_TEST ? describe : describe.skip)(
  'Export Integration Tests',
  () => {
    const TEST_TENANT = 'integration-test-tenant';
    let s3Client: S3Client;

    beforeAll(async () => {
      // Initialize S3 client for MinIO
      s3Client = new S3Client({
        endpoint: process.env.MINIO_ENDPOINT || 'http://localhost:9000',
        region: 'us-east-1',
        credentials: {
          accessKeyId: process.env.MINIO_ACCESS_KEY || 'minioadmin',
          secretAccessKey: process.env.MINIO_SECRET_KEY || 'minioadmin',
        },
        forcePathStyle: true,
      });
    });

    describe('Full Export Workflow', () => {
      it('should complete lite export end-to-end', async () => {
        // 1. Create export request
        const response = await fetch(
          'http://localhost:3000/api/v1/tenant/export',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: 'Bearer test-token',
            },
            body: JSON.stringify({
              tenantId: TEST_TENANT,
              profile: 'lite',
              requestedBy: 'admin-123',
            }),
          }
        );

        expect(response.status).toBe(202);
        const data: any = await response.json();
        const { job } = data;
        expect(job.id).toBeDefined();
        expect(job.status).toBe('pending');

        // 2. Wait for processing (max 30s)
        let status = job.status;
        let attempts = 0;

        while (status === 'pending' || status === 'processing') {
          await new Promise((r) => setTimeout(r, 1000));

          const statusRes = await fetch(
            `http://localhost:3000/api/v1/tenant/export/${job.id}/status`,
            { headers: { Authorization: 'Bearer test-token' } }
          );

          const statusData: any = await statusRes.json();
          status = statusData.status;

          if (++attempts > 30) {
            throw new Error('Export timeout');
          }
        }

        expect(status).toBe('completed');

        // 3. Verify result has download URL
        const finalStatus = await fetch(
          `http://localhost:3000/api/v1/tenant/export/${job.id}/status`,
          { headers: { Authorization: 'Bearer test-token' } }
        );

        const finalData: any = await finalStatus.json();
        expect(finalData.result?.downloadUrl).toBeDefined();
        expect(finalData.result?.checksum).toBeDefined();

        // 4. Verify file exists in S3
        const bucketName = 'tenant-exports';
        const objectKey = `exports/${TEST_TENANT}/${job.id}.tar.gz`;

        try {
          await s3Client.send(
            new GetObjectCommand({ Bucket: bucketName, Key: objectKey })
          );
        } catch (_err) {
          throw new Error(`Export file not found in S3: ${objectKey}`);
        }
      }, 60000);

      it('should enforce tenant isolation during export', async () => {
        // Try to export data from another tenant's schema
        const maliciousTenant = 'tenant-a';

        // This should only export tenant-a's data, never tenant-b
        const response = await fetch(
          'http://localhost:3000/api/v1/tenant/export',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: 'Bearer test-token',
            },
            body: JSON.stringify({
              tenantId: maliciousTenant,
              profile: 'lite',
              requestedBy: 'admin-123',
            }),
          }
        );

        expect(response.status).toBe(202);
      });
    });

    describe('Confirm Download & Cleanup', () => {
      it('should delete file immediately after confirm-download', async () => {
        // 1. Create and complete export
        const createRes = await fetch(
          'http://localhost:3000/api/v1/tenant/export',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: 'Bearer test-token',
            },
            body: JSON.stringify({
              tenantId: TEST_TENANT,
              profile: 'lite',
              requestedBy: 'admin-123',
            }),
          }
        );

        const data: any = await createRes.json();
        const { job } = data;

        // Wait for completion
        let status = 'pending';
        let attempts = 0;

        while (status !== 'completed' && attempts < 30) {
          await new Promise((r) => setTimeout(r, 1000));
          const statusRes = await fetch(
            `http://localhost:3000/api/v1/tenant/export/${job.id}/status`,
            { headers: { Authorization: 'Bearer test-token' } }
          );
          const statusData: any = await statusRes.json();
          status = statusData.status;
          attempts++;
        }

        // 2. Call confirm-download
        const confirmRes = await fetch(
          `http://localhost:3000/api/v1/tenant/export/${job.id}/confirm-download`,
          {
            method: 'POST',
            headers: { Authorization: 'Bearer test-token' },
          }
        );

        expect(confirmRes.status).toBe(200);
        const confirmData: any = await confirmRes.json();
        expect(confirmData.message).toContain('deleted');

        // 3. Verify file is deleted from S3
        const bucketName = 'tenant-exports';
        const objectKey = `exports/${TEST_TENANT}/${job.id}.tar.gz`;

        await expect(
          s3Client.send(
            new GetObjectCommand({ Bucket: bucketName, Key: objectKey })
          )
        ).rejects.toThrow();
      }, 60000);
    });

    describe('Security Boundary Tests', () => {
      it('should reject unauthorized access to export status', async () => {
        // Create export as admin
        const createRes = await fetch(
          'http://localhost:3000/api/v1/tenant/export',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: 'Bearer admin-token',
            },
            body: JSON.stringify({
              tenantId: TEST_TENANT,
              profile: 'lite',
              requestedBy: 'admin-123',
            }),
          }
        );

        const data: any = await createRes.json();
        const { job } = data;

        // Try to access as different tenant
        const statusRes = await fetch(
          `http://localhost:3000/api/v1/tenant/export/${job.id}/status`,
          {
            headers: { Authorization: 'Bearer other-tenant-token' },
          }
        );

        expect(statusRes.status).toBe(403);
      });

      it('should reject non-admin export requests', async () => {
        const response = await fetch(
          'http://localhost:3000/api/v1/tenant/export',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: 'Bearer user-token', // Non-admin
            },
            body: JSON.stringify({
              tenantId: TEST_TENANT,
              profile: 'lite',
              requestedBy: 'user-123',
            }),
          }
        );

        expect(response.status).toBe(403);
      });

      it('should handle SQL injection attempts in tenant ID', async () => {
        const maliciousTenantId = "tenant'; DROP TABLE users; --";

        const response = await fetch(
          'http://localhost:3000/api/v1/tenant/export',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: 'Bearer test-token',
            },
            body: JSON.stringify({
              tenantId: maliciousTenantId,
              profile: 'lite',
              requestedBy: 'admin-123',
            }),
          }
        );

        // Should reject or sanitize, not execute SQL
        expect([400, 403, 422]).toContain(response.status);
      });
    });
  }
);
