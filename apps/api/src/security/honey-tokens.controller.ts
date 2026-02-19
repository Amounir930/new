import { Controller, Get, Post, Req, Res, Logger } from '@nestjs/common';
import { Request, Response as ExpressResponse } from 'express';
import { AuditService } from '@apex/audit';

@Controller(['admin/login', 'wp-admin', 'config.php', 'wp-login.php', '.env']) // Array of fake endpoints
export class HoneyTokensController {
    private readonly logger = new Logger(HoneyTokensController.name);

    constructor(private readonly auditService: AuditService) { }

    /**
     * S15: Honeypot for common scanners and unauthorized access attempts
     * Designed to deceive and identify attackers
     */
    @Get()
    @Post()
    async handleHoneypot(@Req() req: Request, @Res() res: ExpressResponse) {
        // 1. Realistic Delay (2-5 seconds) to mimic real processing as requested
        const delay = Math.floor(Math.random() * (5000 - 2000 + 1)) + 2000;
        await new Promise((resolve) => setTimeout(resolve, delay));

        // 2. Consistent Response (S15 Deception)
        // Return the same response as a real 401 Unauthorized
        const responseBody = {
            statusCode: 401,
            message: 'Invalid credentials',
            error: 'Unauthorized',
        };

        // 3. Log High-Risk Security Event (S15 Activation)
        const clientIp = req.ip || req.headers['x-forwarded-for'] || 'unknown';
        const userAgent = req.headers['user-agent'] || 'unknown';
        const path = req.originalUrl || req.url;

        this.logger.error(
            `🚨 S15 HONEYPOT TRIGGERED! IP: ${clientIp} | Path: ${path} | UA: ${userAgent}`
        );

        // In a real scenario, this would trigger an immediate block in Redis or Cloudflare
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
                // Sanitize body to avoid logging potential exploit payloads (Privacy/Security)
                receivedDataLength: req.body ? JSON.stringify(req.body).length : 0,
            },
        });

        // 4. Return standard 401
        return res.status(401).json(responseBody);
    }
}
