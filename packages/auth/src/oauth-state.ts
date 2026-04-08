/**
 * OAuth State Signing Utility
 *
 * Cryptographically signs OAuth state parameters using HMAC-SHA256
 * to prevent state parameter tampering (S2 Protocol Compliance)
 *
 * @module @apex/auth/oauth-state
 */

import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';

/**
 * Maximum age of a signed state token (5 minutes)
 */
const STATE_MAX_AGE_MS = 5 * 60 * 1000;

/**
 * Sign a state parameter with HMAC-SHA256
 *
 * @param payload - The state payload (e.g., tenant subdomain)
 * @param secret - HMAC secret key (should be from config)
 * @returns Signed state token (base64url encoded)
 */
export function signOAuthState(payload: string, secret: string): string {
  const timestamp = Date.now();
  const nonce = randomBytes(16).toString('hex');
  const rawPayload = JSON.stringify({ sub: payload, ts: timestamp, nonce });

  const signature = createHmac('sha256', secret)
    .update(rawPayload)
    .digest('base64url');

  // Combine payload and signature
  return `${Buffer.from(rawPayload).toString('base64url')}.${signature}`;
}

/**
 * Verify and decode a signed OAuth state token
 *
 * @param signedToken - The signed state token to verify
 * @param secret - HMAC secret key (should match signing key)
 * @returns The original state payload, or null if verification fails
 */
export function verifyOAuthState(
  signedToken: string,
  secret: string
): string | null {
  try {
    const [payloadB64, signatureB64] = signedToken.split('.');
    if (!payloadB64 || !signatureB64) return null;

    // Decode payload
    const rawPayload = Buffer.from(payloadB64, 'base64url').toString('utf-8');

    // Verify signature using timing-safe comparison
    const expectedSignature = createHmac('sha256', secret)
      .update(rawPayload)
      .digest('base64url');

    const expectedBuf = Buffer.from(expectedSignature);
    const providedBuf = Buffer.from(signatureB64);

    if (expectedBuf.length !== providedBuf.length) return null;
    if (!timingSafeEqual(expectedBuf, providedBuf)) return null;

    // Decode and validate payload
    const payload = JSON.parse(rawPayload) as {
      sub: string;
      ts: number;
      nonce: string;
    };

    // Check expiration
    const age = Date.now() - payload.ts;
    if (age > STATE_MAX_AGE_MS) {
      return null; // Token expired
    }

    // Validate sub is a reasonable subdomain (no path traversal or special chars)
    if (!/^[a-zA-Z0-9_-]+$/.test(payload.sub)) {
      return null; // Invalid subdomain format
    }

    return payload.sub;
  } catch {
    return null;
  }
}

/**
 * Generate a cryptographically secure random nonce
 */
export function generateNonce(): string {
  return randomBytes(32).toString('base64url');
}
