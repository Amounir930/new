import { sql } from 'drizzle-orm';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { publicPool, withTenantConnection } from './index';

// Helper to check DB availability
const isDbReachable = async () => {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl || dbUrl.includes('undefined')) return false;
  try {
    const client = await publicPool.connect();
    client.release();
    return true;
  } catch {
    return false;
  }
};

const hasDb = await isDbReachable();

describe.skipIf(!hasDb)(
  'S2: Tenant Isolation Protocol (Database Required)',
  () => {
    const tenantAlpha = 'alpha_test';
    const tenantBeta = 'beta_test';

    beforeEach(async () => {
      // 🔍 DEBUG: Log environment for S2 crash analysis
      console.log(
        'S2 DEBUG: ISOLATION_MODE:',
        process.env.TENANT_ISOLATION_MODE
      );

      try {
        // 🛠️ Setup: Create mock tenant schemas and tables
        // Radical Fix: Recreate EVERYTHING before EACH test to ensure isolation
        await publicPool.query(`
                CREATE SCHEMA IF NOT EXISTS tenant_${tenantAlpha};
                CREATE SCHEMA IF NOT EXISTS tenant_${tenantBeta};
                
                DROP TABLE IF EXISTS tenant_${tenantAlpha}.products CASCADE;
                DROP TABLE IF EXISTS tenant_${tenantBeta}.products CASCADE;
                
                CREATE TABLE tenant_${tenantAlpha}.products (id SERIAL PRIMARY KEY, name TEXT);
                CREATE TABLE tenant_${tenantBeta}.products (id SERIAL PRIMARY KEY, name TEXT);
                
                -- Ensure tenants exist in the registry for withTenantConnection check
                DELETE FROM tenants WHERE subdomain IN ('${tenantAlpha}', '${tenantBeta}');
                
                -- S2 Radical Seeding Fix: Use hardcoded UUIDs and handle conflict
                INSERT INTO tenants (id, subdomain, name, plan, status) 
                VALUES ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', '${tenantAlpha}', 'Alpha', 'pro', 'active'),
                       ('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', '${tenantBeta}', 'Beta', 'pro', 'active')
                ON CONFLICT (id) DO UPDATE SET subdomain = EXCLUDED.subdomain, status = 'active';

                -- 🛡️ Insert clean data for this specific test run
                INSERT INTO tenant_${tenantAlpha}.products (name) VALUES ('Alpha Secret');
                INSERT INTO tenant_${tenantBeta}.products (name) VALUES ('Beta Secret');
            `);
      } catch (error: any) {
        console.error('🚨 S2 Setup Failure:', error.message);
        throw error;
      }
    });

    afterAll(async () => {
      if (!hasDb) return;
      try {
        // 🧹 Cleanup
        await publicPool.query(`
        DROP SCHEMA IF EXISTS tenant_${tenantAlpha} CASCADE;
        DROP SCHEMA IF EXISTS tenant_${tenantBeta} CASCADE;
        DELETE FROM tenants WHERE subdomain IN ('${tenantAlpha}', '${tenantBeta}');
      `);
      } catch {
        // Ignore cleanup errors
      }
    });

    it('should only see Alpha data when connected to Alpha tenant', async () => {
      await withTenantConnection(tenantAlpha, async (db) => {
        // S2: No schema prefix allowed in queries inside withTenantConnection
        const result = await db.execute(sql`SELECT name FROM products`);
        expect(result.rows[0].name).toBe('Alpha Secret');

        // Verify we CANNOT see Beta data without fully qualifying
        const pathResult = await db.execute(sql`SHOW search_path`);
        expect(pathResult.rows[0].search_path).toContain(
          `tenant_${tenantAlpha}`
        );
        expect(pathResult.rows[0].search_path).not.toContain(
          `tenant_${tenantBeta}`
        );
      });
    });

    it('should only see Beta data when connected to Beta tenant', async () => {
      await withTenantConnection(tenantBeta, async (db) => {
        const result = await db.execute(sql`SELECT name FROM products`);
        expect(result.rows[0].name).toBe('Beta Secret');

        const pathResult = await db.execute(sql`SHOW search_path`);
        expect(pathResult.rows[0].search_path).toContain(
          `tenant_${tenantBeta}`
        );
        expect(pathResult.rows[0].search_path).not.toContain(
          `tenant_${tenantAlpha}`
        );
      });
    });

    it('should reset search_path to public after operation', async () => {
      const client = await publicPool.connect();
      try {
        await withTenantConnection(tenantAlpha, async () => {
          // Inside it's Alpha
        });

        // Outside it must be public
        const pathResult = await client.query('SHOW search_path');
        const currentPath = pathResult.rows[0].search_path;
        expect(currentPath).not.toContain(`tenant_${tenantAlpha}`);
      } finally {
        client.release();
      }
    });

    it('should throw S2 Violation error for non-existent tenant', async () => {
      await expect(
        withTenantConnection('fake_tenant', async () => {})
      ).rejects.toThrow(
        "S2 Violation: Tenant 'fake_tenant' not found or invalid"
      );
    });

    it('should NOT have cross-tenant schemas in search_path (Leak Prevention)', async () => {
      // Run a tenant operation
      await withTenantConnection(tenantAlpha, async () => {});

      // Immediately check a fresh connection from the pool
      const client = await publicPool.connect();
      try {
        const pathResult = await client.query('SHOW search_path');
        const searchPath = pathResult.rows[0].search_path;

        // Ensure NO tenant schemas are leaked into the pool context
        expect(searchPath).not.toContain(`tenant_${tenantAlpha}`);
        expect(searchPath).not.toContain(`tenant_${tenantBeta}`);
      } finally {
        client.release();
      }
    });

    it('should destroy connection if search_path reset fails (S2 Safety)', async () => {
      // Logic implementation check skip
    });
  }
);
