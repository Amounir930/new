import pg from 'pg';
const { Client } = pg;

async function main() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL || 'postgresql://apex:apex_secret@apex-postgres-dev:5432/apex_v2'
  });

  try {
    await client.connect();
    console.log('🚀 Connected to DB. Starting Standalone Seed...');

    // 1. Ensure public.tenants table exists (Standard Check)
    // 2. Insert system tenants
    const queries = [
      `INSERT INTO tenants (subdomain, name, plan, status, niche_type) 
       VALUES ('admin', 'System Admin', 'enterprise', 'active', 'retail')
       ON CONFLICT (subdomain) DO UPDATE SET status = 'active';`,
      
      `INSERT INTO tenants (subdomain, name, plan, status, niche_type) 
       VALUES ('storage-admin', 'Storage Admin', 'enterprise', 'active', 'retail')
       ON CONFLICT (subdomain) DO UPDATE SET status = 'active';`,

      `INSERT INTO tenants (subdomain, name, plan, status, niche_type) 
       VALUES ('super-admin', 'Super Admin', 'enterprise', 'active', 'retail')
       ON CONFLICT (subdomain) DO UPDATE SET status = 'active';`
    ];

    for (const q of queries) {
      await client.query(q);
      console.log('✅ Executed successfully.');
    }

    console.log('✨ Global System Metadata Restored.');
  } catch (err) {
    console.error('❌ SEED FAILED:', err.message);
  } finally {
    await client.end();
  }
}

main();
