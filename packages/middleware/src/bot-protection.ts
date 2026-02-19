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
import { HCaptchaService } from './hcaptcha.service.js';

@Injectable()
export class BotProtectionMiddleware implements NestMiddleware {
  constructor(private readonly captchaService: HCaptchaService) { }

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
    /GPTBot/i,
  ];

  async use(req: Request, _res: Response, next: NextFunction): Promise<void> {
    // 🛡️ Defense in Depth: Local bypass for health checks (S5 compliance)
    // This provides a fallback if router-level exclusion fails or is misconfigured.
    const path = req.originalUrl || req.url;
    const isHealthCheck = /(health|liveness|readiness)/i.test(path);
    const isAuthLogin = /\/api\/v1\/auth\/login/i.test(path);

    // Bypass for internal Docker/Traefik traffic and health checks
    const clientIp = req.ip || '';
    const isInternal =
      clientIp.startsWith('172.') ||
      clientIp.startsWith('::ffff:172.') ||
      clientIp === '127.0.0.1' ||
      clientIp === '::1';

    if (isHealthCheck || isInternal) {
      return next();
    }

    const userAgent = req.headers['user-agent'] || '';

    // S11 Level 1: Header-based protection
    // Block requests without User-Agent (typical for simple bots)
    if (!userAgent) {
      throw new ForbiddenException('S11 Violation: User-Agent header required');
    }

    // S11 Level 2: Behavioral/Pattern-based protection
    for (const botPattern of this.botUserAgents) {
      if (botPattern.test(userAgent)) {
        // Log bot attempt at lower priority (S5/S11)
        console.debug(
          `S11: Bot blocked (Silent) - UA: "${userAgent}" | IP: ${req.ip}`
        );
        // Hard Silent Drop: Close connection immediately to save resources (S11 Silent Drop)
        _res.destroy();
        return;
      }
    }

    // S11 Level 3: Behavioral & Route-Specific Challenge
    // High-risk routes REQUIRE hCaptcha validation in production
    if (isAuthLogin || path.includes('/api/v1/provision')) {
      const captchaToken = req.headers['x-hcaptcha-token'] as string;

      // In production, enforce strictly. In dev, allow bypass if keys are missing.
      const isProd = process.env.NODE_ENV === 'production';
      if (isProd || captchaToken) {
        const isValid = await this.captchaService.verify(captchaToken, clientIp);
        if (!isValid) {
          console.warn(`S11: hCaptcha failed for sensitive route: ${path} | IP: ${clientIp}`);
          throw new ForbiddenException('S11 Violation: hCaptcha validation required for this action');
        }
        console.log(`✅ S11: hCaptcha verified for ${path}`);
      }
    }

    // S11 Level 4: Suspicious Path Triggers (Honeytokens Lite)
    // If a request hits common scan paths, block it immediately
    const suspiciousPaths = [
      /\.env$/i,
      /wp-admin/i,
      /config\.php/i,
      /\.php$/i,
      /\.php\?/i,
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
