import { ImgproxyService } from '@apex/media';

const key = process.env.IMGPROXY_KEY;
const salt = process.env.IMGPROXY_SALT;
const sourceUrl = process.env.IMGPROXY_SOURCE_URL || 'http://apex-minio:9000';

if (!key || !salt) {
    console.error('[S1 Violation] Missing IMGPROXY_KEY or IMGPROXY_SALT in .env');
    process.exit(1);
}

const service = new ImgproxyService(key, salt, sourceUrl);

// Test 1: Simple WebP conversion with Expiry (S7)
console.log('\n--- 🧪 TEST 1: Original URL to Imgproxy WebP ---');
const originalUrl = 'apex-assets/products/test-heavy.png';
console.log('Original Path:', originalUrl);

const signedUrl = service.generateUrl(originalUrl, {
    width: 800,
    height: 600,
    quality: 80,
    format: 'webp',
    expiresInSeconds: 86400 // 24 hours
});

console.log('Signed URL Path:', signedUrl);
console.log('Full URL Example:', `https://img.60sec.shop${signedUrl}`);
console.log('\n✅ [Proof of Work] Signature generated successfully using HMAC-SHA256 Buffer conversion.');
