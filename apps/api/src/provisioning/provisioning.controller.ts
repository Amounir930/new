/**
 * Provisioning Controller
 * Exposed API for Super Admins to create new store environments
 */

import { AuditLog, AuditService } from '@apex/audit';
import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Inject,
  Logger,
  Post,
} from '@nestjs/common';
import type { ProvisionRequestDto } from './dto/provision-request.dto.js';
import { ProvisioningService } from './provisioning.service.js';

@Controller('provision')
export class ProvisioningController {
  private readonly logger = new Logger(ProvisioningController.name);

  constructor(
    @Inject('PROVISIONING_SERVICE')
    private readonly provisioningService: ProvisioningService,
    @Inject('AUDIT_SERVICE')
    readonly _audit: AuditService
  ) { }

  /**
   * POST /api/provision
   * Core engine endpoint to create a 60-second store
   */
  @AuditLog({ action: 'TENANT_PROVISIONED', entityType: 'tenant' })
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async provisionStore(@Body() dto: ProvisionRequestDto) {
    this.logger.log(`Received provisioning request for: ${dto.subdomain}`);

    // 1. Pre-flight check (Optional: verify Super Admin API Key if not using Guard)

    // 2. Execute 60-second engine
    const result = await this.provisioningService.provision({
      subdomain: dto.subdomain,
      adminEmail: dto.adminEmail,
      storeName: dto.storeName,
      plan: dto.plan || 'free',
    });

    // 3. Return activation payload
    return {
      message: 'Store provisioned successfully',
      data: {
        subdomain: result.subdomain,
        activationUrl: `https://${result.subdomain}.60sec.shop/admin/setup`,
        durationMs: result.durationMs,
      },
    };
  }
}
