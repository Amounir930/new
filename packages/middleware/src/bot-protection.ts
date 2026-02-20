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
    const path = req.originalUrl || req.url;
    const clientIp = req.ip || '';

    if (this.shouldBypass(req, path, clientIp)) {
      return next();
    }

    const userAgent = req.headers['user-agent'] || '';
    if (!userAgent) {
      throw new ForbiddenException('S11 Violation: User-Agent header required');
    }

    if (this.isBotUserAgent(userAgent, clientIp, _res)) {
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

    return isHealthCheck || isInternal;
  }

  private isBotUserAgent(
    userAgent: string,
    clientIp: string,
    res: Response
  ): boolean {
    for (const botPattern of this.botUserAgents) {
      if (botPattern.test(userAgent)) {
        console.debug(
          `S11: Bot blocked (Silent) - UA: "${userAgent}" | IP: ${clientIp}`
        );
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
      const isProd = process.env.NODE_ENV === 'production';

      if (isProd || captchaToken) {
        const isValid = await this.captchaService.verify(
          captchaToken,
          clientIp
        );
        if (!isValid) {
          console.warn(
            `S11: hCaptcha failed for sensitive route: ${path} | IP: ${clientIp}`
          );
          throw new ForbiddenException(
            'S11 Violation: hCaptcha validation required for this action'
          );
        }
        console.log(`✅ S11: hCaptcha verified for ${path}`);
      }
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
        console.warn(
          `S11: Suspicious path hit - Path: "${req.url}" | IP: ${req.ip}`
        );
        throw new ForbiddenException(
          'S11 Violation: Security violation detected'
        );
      }
    }
  }
}
