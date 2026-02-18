
import { strict as assert } from 'assert';

// -----------------------------------------------------------------------------
// CONFIGURATION
// -----------------------------------------------------------------------------
const RUN_ID = '446'; // Fixed ID for Victory Run
const SUBDOMAIN = 'victory';
const CONFIG = {
    baseUrl: 'http://localhost:3000',
    adminEmail: 'admin@60sec.shop',
    adminPassword: 'Admin@60SecShop!2026',
    // Clean alphanumeric subdomain to avoid Postgres identifier issues
    subdomain: SUBDOMAIN,
};

console.log(`\n🔍 DIAGNOSTIC STARTED: ${CONFIG.subdomain}\n`);

// -----------------------------------------------------------------------------
// UTILS
// -----------------------------------------------------------------------------
async function fetchJson(method: string, path: string, token?: string, body?: any) {
    const headers: any = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const response = await fetch(`${CONFIG.baseUrl}${path}`, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
    });

    const data = await response.json().catch(() => ({}));
    return { status: response.status, data };
}

// -----------------------------------------------------------------------------
// MAIN
// -----------------------------------------------------------------------------
async function run() {
    // 1. Authenticate
    console.log('--- STEP 1: AUTH ---');
    const auth = await fetchJson('POST', '/api/v1/auth/login', undefined, {
        email: CONFIG.adminEmail,
        password: CONFIG.adminPassword,
    });

    if (auth.status !== 201 || !auth.data.accessToken) {
        console.error('❌ Auth Failed:', auth.data);
        process.exit(1);
    }
    const token = auth.data.accessToken;
    console.log('✅ Auth Success\n');

    // 2. Provision Tenant
    console.log(`--- STEP 2: PROVISION (${CONFIG.subdomain}) ---`);
    const provision = await fetchJson('POST', '/api/v1/provision', token, {
        subdomain: CONFIG.subdomain,
        storeName: 'Diagnostic Store',
        adminEmail: `owner-${CONFIG.subdomain}@test.com`,
        plan: 'pro',
    });

    console.log(`Status: ${provision.status}`);
    if (provision.status === 201) {
        console.log('✅ PROVISIONING SUCCESS!');
        console.log(JSON.stringify(provision.data, null, 2));
    } else {
        console.error('❌ PROVISIONING FAILED');
        console.error(JSON.stringify(provision.data, null, 2));
        process.exit(1);
    }
}

run().catch(console.error);
