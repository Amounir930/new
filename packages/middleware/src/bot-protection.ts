/**
 * S11: Bot Protection Middleware
 * Constitution Reference: architecture.md (S11 Protocol)
 * Purpose: Block known bot User-Agents and detect malicious automated patterns
 */

import { env } from '@apex/config/server';
import {
  ForbiddenException,
  Injectable,
  Logger,
  type NestMiddleware,
} from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';
// biome-ignore lint/style/useImportType: Dependency Injection requires value import (S1-S15 Compliance)
import { HCaptchaService } from './hcaptcha.service';

@Injectable()
export class BotProtectionMiddleware implements NestMiddleware {
  constructor(private readonly captchaService: HCaptchaService) {}

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
    const path = req.originalUrl || req.url;
    const clientIp = req.ip || '';

    if (this.shouldBypass(req, path, clientIp)) {
      return next();
    }

    const userAgent = req.headers['user-agent'] || '';
    if (!userAgent) {
      throw new ForbiddenException('S11 Violation: User-Agent header required');
    }

    if (this.isBotUserAgent(req, userAgent, clientIp, _res)) {
      return;
    }

    await this.handleCaptchaChallenge(req, path, clientIp);
    this.checkSuspiciousPaths(req);

    next();
  }

  private shouldBypass(_req: Request, path: string, clientIp: string): boolean {
    const isHealthCheck = /(health|liveness|readiness)/i.test(path);
    const isInternal =
      clientIp.startsWith('172.') ||
      clientIp.startsWith('::ffff:172.') ||
      clientIp === '127.0.0.1' ||
      clientIp === '::1';

    // 🛡️ S11 FIX: Trusted IP whitelist bypass
    // Allows specific IPs (comma-separated in ALLOWED_IPS env var) to skip bot protection
    const allowedIPs =
      env.ALLOWED_IPS?.split(',')
        .map((ip: string) => ip.trim())
        .filter(Boolean) || [];
    const isTrustedIP =
      allowedIPs.includes(clientIp) ||
      allowedIPs.includes(clientIp.replace('::ffff:', ''));

    // Bypass auth endpoints — they have their own hCaptcha challenge
    // via handleCaptchaChallenge(). Bot UA check here blocks legitimate
    // browser logins when Traefik/Cloudflare obscure the real client IP.
    const isAuthEndpoint =
      /\/api\/v1\/auth\/login/i.test(path) ||
      /\/api\/v1\/auth\/register/i.test(path);

    // Bypass internal service-to-service calls from admin panels
    // These come through Traefik and may not carry a browser User-Agent
    const isAdminService =
      /\/api\/v1\/merchant\/config/i.test(path) ||
      /\/api\/v1\/merchant\/products/i.test(path) ||
      /\/api\/v1\/merchant\/customers/i.test(path);

    return (
      isHealthCheck ||
      isInternal ||
      isTrustedIP ||
      isAuthEndpoint ||
      isAdminService
    );
  }

  private isBotUserAgent(
    req: Request,
    userAgent: string,
    clientIp: string,
    res: Response
  ): boolean {
    for (const botPattern of this.botUserAgents) {
      if (botPattern.test(userAgent)) {
        Logger.warn(
          `S11: Bot blocked - UA: "${userAgent}" | IP: ${clientIp}`,
          'BotProtection'
        );
        throw new ForbiddenException('S11 Violation: Automated access blocked');
      }
    }

    // Item 34: Detect headless/automated headers
    const automatedHeaders = [
      'sec-ch-ua-mobile',
      'x-puppeteer-id',
      'playwright-id',
    ];
    for (const h of automatedHeaders) {
      if (req.headers[h]) {
        res.destroy();
        return true;
      }
    }

    return false;
  }

  private async handleCaptchaChallenge(
    req: Request,
    path: string,
    clientIp: string
  ): Promise<void> {
    const isAuthLogin = /\/api\/v1\/auth\/login/i.test(path);
    if (isAuthLogin || path.includes('/api/v1/provision')) {
      const captchaToken = req.headers['x-hcaptcha-token'] as string;
      const isProd = env.NODE_ENV === 'production';

      const hasHcaptchaSecret = !!env.HCAPTCHA_SECRET_KEY;
      if (!hasHcaptchaSecret) {
        Logger.warn(
          `S11: HCAPTCHA_SECRET_KEY not configured - bypassing hCaptcha for ${path}`,
          'BotProtection'
        );
        return;
      }

      // S11 STABILITY FIX: If no token provided, reject IMMEDIATELY instead of hanging on fetch
      if (!captchaToken) {
        if (isProd) {
          Logger.warn(
            `S11: Denying production login attempt without hCaptcha token | IP: ${clientIp}`,
            'BotProtection'
          );
          throw new ForbiddenException(
            'S11 Violation: hCaptcha validation required for login'
          );
        }
        return; // Allow in development
      }

      const isValid = await this.captchaService.verify(captchaToken, clientIp);

      if (!isValid) {
        Logger.warn(
          `S11: hCaptcha failed for sensitive route: ${path} | IP: ${clientIp}`,
          'BotProtection'
        );
        throw new ForbiddenException(
          'S11 Violation: hCaptcha validation failed'
        );
      }
      Logger.log(`S11: hCaptcha verified for ${path}`, 'BotProtection');
    }
  }

  private checkSuspiciousPaths(req: Request): void {
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
        Logger.warn(
          `S11: Suspicious path hit - Path: "${req.url}" | IP: ${req.ip}`,
          'BotProtection'
        );
        throw new ForbiddenException(
          'S11 Violation: Security violation detected'
        );
      }
    }
  }
}
