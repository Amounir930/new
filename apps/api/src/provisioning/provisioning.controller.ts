/**
 * Provisioning Controller
 * Exposed API for Super Admins to create new store environments
 */

// biome-ignore lint/style/useImportType: Dependency Injection requires value import
import { AuditLog, AuditService } from '@apex/audit';
import { JwtAuthGuard, SuperAdminGuard } from '@apex/auth';
// biome-ignore lint/style/useImportType: Dependency Injection requires value import
import { FraudGuard } from '@apex/middleware';
import { env } from '@apex/config';
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
// biome-ignore lint/style/useImportType: Dependency Injection requires value import (S1-S15 Compliance)
import { ProvisioningService } from './provisioning.service.js';
import { ZodValidationPipe } from 'nestjs-zod';
import { ProvisionRequestSchema } from './dto/provision-request.dto.js';

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
   * Protected by JWT + SuperAdmin role + Fraud Detection (S14)
   */
  @AuditLog({ action: 'TENANT_PROVISIONED', entityType: 'tenant' })
  @UseGuards(JwtAuthGuard, SuperAdminGuard, FraudGuard)
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async provisionStore(
    @Req() _req: Request,
    @Body(ZodValidationPipe) dto: ProvisionRequestDto
  ) {
    this.logger.log(`Received provisioning request for: ${dto.subdomain}`);

    // The JwtAuthGuard and SuperAdminGuard handle the common case (Admin UI call)
    // If we wanted to allow API Key bypass, we'd add logic here, but for Super-#21
    // the UI-based provisioning via Super Admin session is the priority.

    // 2. Execute 60-second engine
    const result = await this.provisioningService.provision({
      subdomain: dto.subdomain,
      adminEmail: dto.adminEmail,
      storeName: dto.storeName,
      plan: dto.plan ?? 'free',
      nicheType: dto.nicheType ?? undefined,
      uiConfig: dto.uiConfig,
      blueprint: dto.blueprint as unknown, // S3: Inject custom blueprint
      blueprintId: dto.blueprintId, // S21: Pass specific blueprint ID
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

  /**
   * POST /api/provision/otp
   * S14: Generate OTP for payment verification
   */
  @AuditLog({ action: 'PROVISIONING_OTP_REQUESTED', entityType: 'security' })
  @UseGuards(JwtAuthGuard, SuperAdminGuard)
  @Post('otp')
  async requestProvisioningOTP(@Req() req: Request) {
    const otpService = (req as any).otpService; // Will be injected or accessed via module
    const identifier = req.ip || 'anonymous';
    const code = await otpService.generateOTP(identifier);
    this.logger.log(`[S14] OTP requested for provisioning by ${identifier}`);
    return {
      message: 'OTP sent to registered administrator device',
      debug: env.NODE_ENV !== 'production' ? code : undefined,
    };
  }
}
