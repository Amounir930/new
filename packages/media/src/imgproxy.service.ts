import * as crypto from 'node:crypto';

export interface ImgproxyOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'webp' | 'avif' | 'jpeg' | 'png';
  /** Expiration time in seconds from now. Provides S7 Security. */
  expiresInSeconds?: number;
}

/**
 * Service to generate secure, signed URLs for Imgproxy.
 * Complies with S7 security standard for resource protection and Island-Pattern.
 */
export class ImgproxyService {
  private readonly keyStore: Buffer;
  private readonly saltStore: Buffer;
  private readonly sourceUrl: string;

  /**
   * @param key Hex-encoded key from IMGPROXY_KEY
   * @param salt Hex-encoded salt from IMGPROXY_SALT
   * @param sourceUrl Base URL of the source image storage (e.g., Minio endpoint)
   */
  constructor(key: string, salt: string, sourceUrl: string = '') {
    // SECURITY FIX: hex validation and conversion to binary Buffer
    if (!/^[0-9a-fA-F]+$/.test(key)) {
      throw new Error('[S1] IMGPROXY_KEY must be a valid hex-encoded string');
    }
    if (!/^[0-9a-fA-F]+$/.test(salt)) {
      throw new Error('[S1] IMGPROXY_SALT must be a valid hex-encoded string');
    }

    this.keyStore = Buffer.from(key, 'hex');
    this.saltStore = Buffer.from(salt, 'hex');

    // Ensure source URL does not end with a slash if provided
    this.sourceUrl = sourceUrl.endsWith('/')
      ? sourceUrl.slice(0, -1)
      : sourceUrl;
  }

  /**
   * Encodes a string (URL) to url-safe Base64
   */
  private encodeUrlSafeBase64(value: string): string {
    return Buffer.from(value)
      .toString('base64')
      .replace(/=/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_');
  }

  /**
   * Signs the path with HMAC-SHA256
   */
  private sign(target: string): string {
    const hmac = crypto.createHmac('sha256', this.keyStore);
    hmac.update(this.saltStore);
    hmac.update(target);
    return hmac
      .digest('base64')
      .replace(/=/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_');
  }

  /**
   * Generates a signed Imgproxy path (e.g., /signature/size/url.ext)
   *
   * @param originalUrl The original image path (e.g., "products/image.png")
   * @param options Processing options (width, height, format, etc.)
   */
  public generateUrl(
    originalUrl: string,
    options: ImgproxyOptions = {}
  ): string {
    // Append the source URL if it's a relative path to Minio
    let fullUrl = originalUrl;
    if (this.sourceUrl && !originalUrl.startsWith('http')) {
      // e.g. "minio://bucket/image.png" -> "http://apex-minio:9000/bucket/image.png"
      // or "https://storage.60sec.shop/item..."
      fullUrl = originalUrl.startsWith('/')
        ? `${this.sourceUrl}${originalUrl}`
        : `${this.sourceUrl}/${originalUrl}`;
    }

    const encodedUrl = this.encodeUrlSafeBase64(fullUrl);

    // Construct processing options path
    const w = options.width || 0;
    const h = options.height || 0;
    const q = options.quality || 80;

    let path = `/rs:fill:${w}:${h}:0/q:${q}/plain/${fullUrl}`;

    // We prefer the encoded URL format to avoid path parsing issues
    path = `/rs:fill:${w}:${h}:0/q:${q}`;

    // Apply expiration if specified (S7 Link Expiry)
    if (options.expiresInSeconds && options.expiresInSeconds > 0) {
      const expUnix = Math.floor(Date.now() / 1000) + options.expiresInSeconds;
      path += `/exp:${expUnix}`;
    }

    // Append format and the encoded URL
    const format = options.format || 'webp';
    path += `/${encodedUrl}.${format}`;

    // Generate HMAC signature of the salt + path
    const signature = this.sign(path);

    // Final signed URL path (e.g., append this to the Imgproxy API root)
    return `/${signature}${path}`;
  }
}
