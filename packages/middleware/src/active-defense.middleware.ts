/**
 * S15: Active Defense Middleware
 * Constitution Reference: architecture.md (S15 Protocol)
 * Purpose: Deceptive signals, Honeypots, and Automated Blacklisting
 */

import {
  ForbiddenException,
  Injectable,
  type NestMiddleware,
} from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';
// biome-ignore lint/style/useImportType: Dependency Injection requires value import
import { RedisRateLimitStore } from './redis-rate-limit-store.js';

@Injectable()
export class ActiveDefenseMiddleware implements NestMiddleware {
  constructor(private readonly store: RedisRateLimitStore) {}

  private readonly honeypotPaths = [
    /wp-admin/i,
    /wp-login\.php/i,
    /admin\/config/i,
    /\.env$/i,
    /backup\.sql/i,
    /phpmyadmin/i,
    /shell\.php/i,
  ];

  private readonly HEALTH_PATHS = [
    '/health',
    '/health/liveness',
    '/health/readiness',
    '/health/status',
    '/api/health',
    '/api/v1/health',
  ];

  async use(req: Request, res: Response, next: NextFunction): Promise<void> {
    const path = req.originalUrl || req.url;
    const ip = req.ip || req.headers['x-forwarded-for'] || 'unknown';

    // 🛡️ S15.3: Safe Bypass for infrastructure health probes
    if (this.HEALTH_PATHS.some((hp) => path.startsWith(hp))) {
      return next();
    }

    // 1. S15 Level 1: Deceptive HTTP Headers (Obfuscation)
    res.setHeader('X-Powered-By', 'PHP/5.6.40');
    res.setHeader('Server', 'Apache/2.2.22 (Debian)');
    res.setHeader('X-Active-Defense', 'Enabled');

    // 2. S15 Level 2: Honeypot Detection
    for (const pattern of this.honeypotPaths) {
      if (pattern.test(path)) {
        process.stdout.write(
          `S15 CRITICAL: Honeytoken hit! Path: "${path}" | IP: ${ip}`
        );

        try {
          // S15 Level 3: Automatic IP Blacklisting (Permaban for 24 hours)
          const key = `ratelimit:anonymous:ip:${ip}`;
          await this.store.block(key, 86400_000); // 24-hour ban
        } catch (_storeError) {
          // S15: Fail-Closed Mechanism
          // If the store fails, we MUST still block the suspicious request
          process.stdout.write(
            'S15: Defensive store failure, falling back to Fail-Closed block'
          );
        }

        throw new ForbiddenException('S15 Violation: Active defense triggered');
      }
    }

    next();
  }
}
