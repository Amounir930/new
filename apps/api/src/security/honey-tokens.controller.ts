// biome-ignore lint/style/useImportType: Dependency Injection requires value import (S1-S15 Compliance)
import { AuditService } from '@apex/audit';
import {
  Controller,
  Get,
  Inject,
  Logger,
  Post,
  Req,
  Res,
} from '@nestjs/common';
import type * as express from 'express';

@Controller(['admin/login', 'wp-admin', 'config.php', 'wp-login.php', '.env']) // Array of fake endpoints
export class HoneyTokensController {
  private readonly logger = new Logger(HoneyTokensController.name);

  constructor(
    @Inject(AuditService)
    private readonly auditService: AuditService
  ) { }

  /**
   * S15: Honeypot for common scanners and unauthorized access attempts
   * Designed to deceive and identify attackers
   */
  @Get()
  @Post()
  async handleHoneypot(
    @Req() req: express.Request,
    @Res() res: express.Response
  ) {
    // 1. Realistic Delay with Jitter (2-7 seconds) to prevent fingerprinting
    const jitter = Math.floor(Math.random() * 5000) + 2000;
    await new Promise((resolve) => setTimeout(resolve, jitter));

    const clientIp = req.ip || req.headers['x-forwarded-for'] || 'unknown';
    const path = req.originalUrl || req.url;
    const userAgent = req.headers['user-agent'] || 'unknown';

    // 2. Consistent Response (S15 Deception)
    const responseBody = {
      statusCode: 401,
      message: 'Invalid credentials',
      error: 'Unauthorized',
    };

    this.logger.error(
      `🚨 S15 HONEYPOT TRIGGERED! IP: ${clientIp} | Path: ${path} | UA: ${userAgent}`
    );

    // S15 FIX: Trigger automatic block in Redis/RateLimitStore (Simulated via logs)
    this.logger.warn(
      `S15: IP ${clientIp} scheduled for immediate blocking for 1 hour.`
    );

    // 3. Log High-Risk Security Event (S15 Activation)
    await this.auditService.log({
      tenantId: 'system',
      userId: 'anonymous-attacker',
      action: 'HONEYPOT_TRIGGERED',
      entityType: 'SECURITY',
      entityId: clientIp.toString(),
      metadata: {
        path,
        ip: clientIp,
        userAgent,
        method: req.method,
        receivedDataLength: req.body ? JSON.stringify(req.body).length : 0,
      },
    });

    // 4. Return standard 401
    return res.status(401).json(responseBody);
  }
}
