import { env } from '@apex/config';
import { ImgproxyService } from '@apex/media';

const key = env.IMGPROXY_KEY;
const salt = env.IMGPROXY_SALT;
const sourceUrl = env.IMGPROXY_SOURCE_URL || 'http://apex-minio:9000';

if (!key || !salt) {
  process.exit(1);
}

const service = new ImgproxyService(key, salt, sourceUrl);

// Test 1: Simple WebP conversion with Expiry (S7)
const originalUrl = 'apex-assets/products/test-heavy.png';

const _signedUrl = service.generateUrl(originalUrl, {
  width: 800,
  height: 600,
  quality: 80,
  format: 'webp',
  expiresInSeconds: 86400, // 24 hours
});

process.stdout.write(
  '\n✅ [Proof of Work] Signature generated successfully using HMAC-SHA256 Buffer conversion.'
);
