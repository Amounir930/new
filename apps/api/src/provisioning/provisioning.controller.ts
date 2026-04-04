/**
 * Provisioning Controller
 * Exposed API for Super Admins to create new store environments
 */

import { AuditLog, AuditService } from '@apex/audit';
import {
  type AuthenticatedRequest,
  JwtAuthGuard,
  SuperAdminGuard,
} from '@apex/auth';
import { env } from '@apex/config/server';
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
import { ZodValidationPipe } from 'nestjs-zod';
import type { ProvisionRequestDto } from './dto/provision-request.dto';
// biome-ignore lint/style/useImportType: Dependency Injection requires value import
import { ProvisioningService } from './provisioning.service';

@Controller('provision')
@UseGuards(JwtAuthGuard, SuperAdminGuard)
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
   * Protected by JWT + Hardened SuperAdminGuard (Sovereign Shield)
   */
  @AuditLog({ action: 'TENANT_PROVISIONED', entityType: 'tenant' })
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async provisionStore(
    @Req() _req: any,
    @Body(ZodValidationPipe) dto: ProvisionRequestDto
  ) {
    this.logger.log(`Received provisioning request for: ${dto.subdomain}`);

    // 2. Execute 60-second engine
    const result = await this.provisioningService.provision({
      subdomain: dto.subdomain,
      adminEmail: dto.adminEmail,
      password: dto.password,
      storeName: dto.storeName,
      plan: dto.plan ?? 'free',
      nicheType: dto.nicheType ?? undefined,
      uiConfig: dto.uiConfig,
      superAdminKey: dto.superAdminKey, // S1/S7: Propagate Sovereign Key
      blueprint: dto.blueprint, // S3: Inject custom blueprint
      blueprintId: dto.blueprintId, // S21: Pass specific blueprint ID
    });

    // 3. Return activation payload
    return {
      message: 'Store provisioned successfully',
      data: {
        subdomain: result.subdomain,
        storefrontUrl: `https://${result.subdomain}.60sec.shop/`,
        adminUrl: `https://${result.subdomain}.60sec.shop/admin/setup`,
        durationMs: result.durationMs,
      },
    };
  }

  /**
   * POST /api/provision/otp
   * S14: Generate OTP for payment verification
   */
  @AuditLog({ action: 'PROVISIONING_OTP_REQUESTED', entityType: 'security' })
  @UseGuards(JwtAuthGuard, SuperAdminGuard)
  @Post('otp')
  async requestProvisioningOTP(
    @Req()
    req: AuthenticatedRequest & {
      otpService?: { generateOTP: (id: string) => Promise<string> };
    }
  ) {
    const otpService = req.otpService; // Will be injected or accessed via module
    const identifier = req.ip || 'anonymous';
    const code = await otpService?.generateOTP(identifier);
    this.logger.log(`[S14] OTP requested for provisioning by ${identifier}`);
    return {
      message: 'OTP sent to registered administrator device',
      debug: env.NODE_ENV !== 'production' ? code : undefined,
    };
  }
}
