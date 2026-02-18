/**
 * Provisioning Controller
 * Exposed API for Super Admins to create new store environments
 */

// biome-ignore lint/style/useImportType: Dependency Injection requires value import
import { AuditLog, AuditService } from '@apex/audit';
import { JwtAuthGuard, SuperAdminGuard } from '@apex/auth';
import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Inject,
  Logger,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import type { ProvisionRequestDto } from './dto/provision-request.dto.js';
// biome-ignore lint/style/useImportType: Dependency Injection requires value import
import { ProvisioningService } from './provisioning.service.js';

@Controller('provision')
export class ProvisioningController {
  private readonly logger = new Logger(ProvisioningController.name);

  constructor(
    @Inject('PROVISIONING_SERVICE')
    private readonly provisioningService: ProvisioningService,
    @Inject('AUDIT_SERVICE')
    readonly _audit: AuditService
  ) {}

  /**
   * POST /api/provision
   * Core engine endpoint to create a 60-second store
   * Protected by JWT + SuperAdmin role, or a valid superAdminKey
   */
  @AuditLog({ action: 'TENANT_PROVISIONED', entityType: 'tenant' })
  @UseGuards(JwtAuthGuard, SuperAdminGuard)
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async provisionStore(@Req() _req: Request, @Body() dto: ProvisionRequestDto) {
    this.logger.log(`Received provisioning request for: ${dto.subdomain}`);

    // The JwtAuthGuard and SuperAdminGuard handle the common case (Admin UI call)
    // If we wanted to allow API Key bypass, we'd add logic here, but for Super-#21
    // the UI-based provisioning via Super Admin session is the priority.

    // 2. Execute 60-second engine
    const result = await this.provisioningService.provision({
      subdomain: dto.subdomain,
      adminEmail: dto.adminEmail,
      storeName: dto.storeName,
      plan: dto.plan,
      nicheType: dto.nicheType,
      uiConfig: dto.uiConfig,
      blueprint: dto.blueprint as unknown, // S3: Inject custom blueprint
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
