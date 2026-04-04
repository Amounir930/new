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
import { Throttle } from '@nestjs/throttler';
import { ZodValidationPipe } from 'nestjs-zod';
import {
  InitProvisioningRequestDto,
  VerifyProvisioningRequestDto,
} from './dto/self-service-provision.dto';
import { ProvisioningService } from './provisioning.service';

@Controller({ path: 'auth/register-tenant', version: '1' })
export class PublicProvisioningController {
  private readonly logger = new Logger(PublicProvisioningController.name);

  constructor(
    @Inject('PROVISIONING_SERVICE')
    private readonly provisioningService: ProvisioningService,
    @Inject('AUDIT_SERVICE')
    readonly _audit: AuditService
  ) { }

  /**
   * POST /api/v1/auth/register-tenant
   * Step 1: Initialize self-service provisioning (Verify Turnstile, Send OTP)
   */
  @AuditLog({ action: 'SELF_SERVICE_PROVISION_INIT', entityType: 'tenant' })
  @Throttle({ default: { limit: 5, ttl: 3600000 } }) // 5 requests per hour max
  @Post()
  @HttpCode(HttpStatus.OK)
  async initProvisioning(
    @Body(ZodValidationPipe) dto: InitProvisioningRequestDto
  ) {
    this.logger.log(`Received public provisioning prep for: ${dto.username}`);
    return this.provisioningService.initProvisioningRequest(dto);
  }

  /**
   * POST /api/v1/auth/register-tenant/verify
   * Step 2: Verify OTP and trigger provisioning
   */
  @AuditLog({ action: 'SELF_SERVICE_PROVISION_VERIFY', entityType: 'tenant' })
  @Throttle({ default: { limit: 5, ttl: 3600000 } })
  @Post('verify')
  @HttpCode(HttpStatus.CREATED)
  async verifyAndProvision(
    @Body(ZodValidationPipe) dto: VerifyProvisioningRequestDto
  ) {
    this.logger.log(`Verifying OTP for provisioning request: ${dto.requestId}`);
    const result = await this.provisioningService.selfServiceProvision(
      dto.requestId,
      dto.otp
    );

    return {
      message: 'Store provisioned successfully',
      data: {
        subdomain: result.subdomain,
        storefrontUrl: `https://${result.subdomain}.60sec.shop/`,
        adminUrl: `https://${result.subdomain}.60sec.shop/`,
        durationMs: result.durationMs,
      },
    };
  }
}
