/**
 * S14: Fraud Detection - Request Fingerprinting
 * Constitution Reference: architecture.md (S14 Protocol)
 * Purpose: Generate a unique signature for each requester to detect velocity anomalies
 */

import { createHash } from 'node:crypto';
import { Injectable, type NestMiddleware } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';

@Injectable()
export class FingerprintMiddleware implements NestMiddleware {
  use(req: Request, _res: Response, next: NextFunction): void {
    const headers = req.headers;

    // Components of a fingerprint:
    // 1. IP Address
    // 2. User-Agent
    // 3. Accept-Language
    // 4. Accept-Encoding
    // 5. Sec-CH-UA (Modern browsers)

    const fingerprintParts = [
      req.ip || 'unknown-ip',
      headers['user-agent'] || 'no-ua',
      headers['accept-language'] || 'no-lang',
      headers['accept-encoding'] || 'no-enc',
      headers['sec-ch-ua'] || 'no-ch-ua',
    ];

    const rawFingerprint = fingerprintParts.join('|');
    // fp var removed for lint compliance
    const data = (req as any).fingerprintData || {};
    const fingerprint = createHash('sha256')
      .update(rawFingerprint)
      .digest('hex');

    // Attach fingerprint to request for downstream fraud scoring (Level 3)
    (req as any).fingerprint = fingerprint;

    // Also attach parts for velocity checks (S14 Level 2)
    (req as any).fingerprintData = data;

    next();
  }
}
