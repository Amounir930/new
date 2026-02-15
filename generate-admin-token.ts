
import { createHmac } from 'crypto';

const SECRET = 'jwt_2b51903259def4aae65764a1fe2cbfb33134faa8a797c8fd4849007c9ff4b';

function base64UrlEncode(str: string): string {
    return Buffer.from(str)
        .toString('base64')
        .replace(/=/g, '')
        .replace(/\+/g, '-')
        .replace(/\//g, '_');
}

function generateToken() {
    const header = {
        alg: 'HS256',
        typ: 'JWT',
    };

    const now = Math.floor(Date.now() / 1000);
    const oneYear = 365 * 24 * 60 * 60;

    const payload = {
        sub: 'super-admin-id',
        email: 'admin@60sec.shop',
        role: 'super_admin',
        tenantId: 'system',
        iat: now,
        exp: now + oneYear,
    };

    const encodedHeader = base64UrlEncode(JSON.stringify(header));
    const encodedPayload = base64UrlEncode(JSON.stringify(payload));

    const signatureInput = `${encodedHeader}.${encodedPayload}`;
    const signature = createHmac('sha256', SECRET)
        .update(signatureInput)
        .digest('base64')
        .replace(/=/g, '')
        .replace(/\+/g, '-')
        .replace(/\//g, '_');

    const token = `${signatureInput}.${signature}`;

    console.log('\n==================================================');
    console.log('🔑 SUPER ADMIN TOKEN (Manual Generation)');
    console.log('==================================================');
    console.log(token);
    console.log('==================================================\n');
}

generateToken();
