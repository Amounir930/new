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
import { ActiveDefenseService } from './active-defense.service';

@Controller(['admin/login', 'wp-admin', 'config.php', 'wp-login.php', '.env']) // Array of fake endpoints
export class HoneyTokensController {
  private readonly logger = new Logger(HoneyTokensController.name);

  constructor(
    @Inject(AuditService)
    private readonly auditService: AuditService,
    @Inject('ACTIVE_DEFENSE_SERVICE')
    private readonly activeDefense: ActiveDefenseService
  ) {}

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
    // 1. Realistic Multi-Stage Jitter (S15: Dynamic Timing)
    const jitter =
      Math.floor(crypto.getRandomValues(new Uint32Array(1))[0] % 8000) + 1000;
    await new Promise((resolve) => setTimeout(resolve, jitter));

    // Trust Proxy handles IP extraction from headers automatically if configured in main.ts
    const clientIp = req.ip || 'unknown';
    const path = req.originalUrl || req.url;
    const userAgent = req.headers['user-agent'] || 'unknown';

    // 2. Dynamic Response Body (S15: Prevent Hash Fingerprinting)
    const errorIds = ['AUTH_FAILED', 'INVALID_SIGNATURE', 'SESSION_EXPIRED'];
    const selectedError = errorIds[Math.floor(Math.random() * errorIds.length)];

    const responseBody = {
      statusCode: 401,
      message: 'Invalid credentials',
      error: 'Unauthorized',
      code: selectedError,
      request_id: crypto.randomUUID(),
    };

    this.logger.error(
      `🚨 S15 HONEYPOT TRIGGERED! IP: ${clientIp} | Path: ${path} | UA: ${userAgent}`
    );

    // 3. Trigger S15 Active Defense Lifecycle (Automated Banning)
    await this.activeDefense.trackViolation(clientIp, `Honeypot triggered at ${path}`);

    // 4. Log High-Risk Security Event (S15 Activation)
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

    // 5. Return standard 401
    return res.status(401).json(responseBody);
  }
}
