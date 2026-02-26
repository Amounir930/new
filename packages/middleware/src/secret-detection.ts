/**
 * S50: Secret Detection Middleware
 * Purpose: Scan request body/headers for potential secrets/keys before processing
 */

import {
  BadRequestException,
  Injectable,
  type NestMiddleware,
} from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';

@Injectable()
export class SecretDetectionMiddleware implements NestMiddleware {
  // Regex patterns for common secrets
  private readonly secretPatterns = [
    /ey[a-zA-Z0-9]{10,}\.ey[a-zA-Z0-9]{10,}\.[a-zA-Z0-9_-]{10,}/, // JWT
    /xox[bpgrs]-[a-zA-Z0-9-]{10,}/, // Slack
    /AIza[0-9A-Za-z-_]{35}/, // Google API Key
    /SK[0-9a-fA-F]{32}/, // Generic Secret Key pattern
    /password["']?\s*[:=]\s*["']?[^"'\s]{8,}/i, // Potential passwords
  ];

  use(req: Request, _res: Response, next: NextFunction): void {
    const body = JSON.stringify(req.body || {});
    const headers = JSON.stringify(req.headers || {});

    // 🛡️ S50 Rule: Scan for credentials in plain text
    // Only applied to specific routes where secrets shouldn't be (e.g., logging/telemetry)
    // For simplicity, we scan all non-auth/non-provisioning routes
    const isSecretPath =
      req.originalUrl.includes('/auth/login') ||
      req.originalUrl.includes('/provision');

    if (!isSecretPath) {
      for (const pattern of this.secretPatterns) {
        if (pattern.test(body) || pattern.test(headers)) {
          console.error(
            `S50 CRITICAL: Potential secret detected in request! Path: ${req.originalUrl}`
          );
          throw new BadRequestException(
            'S50 Violation: Potential security credential detected in request payload.'
          );
        }
      }
    }

    next();
  }
}
