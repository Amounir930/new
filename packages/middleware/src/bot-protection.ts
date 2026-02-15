/**
 * S11: Bot Protection Middleware
 * Constitution Reference: architecture.md (S11 Protocol)
 * Purpose: Block known bot User-Agents and detect malicious automated patterns
 */

import {
  ForbiddenException,
  Injectable,
  type NestMiddleware,
} from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';

@Injectable()
export class BotProtectionMiddleware implements NestMiddleware {
  // Common bot and scraper User-Agent patterns
  private readonly botUserAgents = [
    /python-requests/i,
    /node-fetch/i,
    /axios/i,
    /go-http-client/i,
    /curl/i,
    /wget/i,
    /postman/i,
    /headless/i,
    /selenium/i,
    /puppeteer/i,
    /scrap/i,
    /crawler/i,
    /spider/i,
    /sqlmap/i,
    /dirbuster/i,
    /nmap/i,
    /masscan/i,
  ];

  async use(req: Request, res: Response, next: NextFunction): Promise<void> {
    const userAgent = req.headers['user-agent'] || '';

    // S11 Level 1: Header-based protection
    // Block requests without User-Agent (typical for simple bots)
    if (!userAgent) {
      throw new ForbiddenException('S11 Violation: User-Agent header required');
    }

    // S11 Level 2: Behavioral/Pattern-based protection
    for (const botPattern of this.botUserAgents) {
      if (botPattern.test(userAgent)) {
        // Log bot attempt for forensic analysis (S4/S5)
        console.warn(
          `S11: Bot detected - User-Agent: "${userAgent}" | IP: ${req.ip}`
        );
        throw new ForbiddenException('S11 Violation: Automated access blocked');
      }
    }

    // S11 Level 3: Suspicious Path Triggers (Honeytokens Lite)
    // If a request hits common scan paths, block it immediately
    const suspiciousPaths = [
      /\.env$/i,
      /wp-admin/i,
      /config\.php/i,
      /\.git\//i,
      /backup/i,
      /sql/i,
    ];

    for (const pathPattern of suspiciousPaths) {
      if (pathPattern.test(req.url)) {
        console.warn(
          `S11: Suspicious path hit - Path: "${req.url}" | IP: ${req.ip}`
        );
        throw new ForbiddenException(
          'S11 Violation: Security violation detected'
        );
      }
    }

    next();
  }
}
