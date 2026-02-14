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
import type { RedisRateLimitStore } from './redis-rate-limit-store.js';

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

  async use(req: Request, res: Response, next: NextFunction): Promise<void> {
    const ip = req.ip || 'unknown';

    // 1. S15 Level 1: Deceptive HTTP Headers (Obfuscation)
    // Overwrite real info with deceptive signals to confuse scanners
    res.setHeader('X-Powered-By', 'PHP/5.6.40'); // Mislead as an old PHP version
    res.setHeader('Server', 'Apache/2.2.22 (Debian)'); // Mislead as an old Apache
    res.setHeader('X-Active-Defense', 'Enabled');

    // 2. S15 Level 2: Honeypot Detection
    for (const pattern of this.honeypotPaths) {
      if (pattern.test(req.url)) {
        console.error(
          `S15 CRITICAL: Honeytoken hit! Path: "${req.url}" | IP: ${ip}`
        );

        // S15 Level 3: Automatic IP Blacklisting (Permaban for 24 hours)
        const key = `ratelimit:anonymous:ip:${ip}`;
        await this.store.block(key, 86400_000); // 24-hour ban

        throw new ForbiddenException('S15 Violation: Active defense triggered');
      }
    }

    next();
  }
}
