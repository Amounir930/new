// biome-ignore lint/style/useImportType: Dependency Injection requires value import (S1-S15 Compliance)
import { AuditService } from '@apex/audit';
import { AuthService, type AuthUser } from '@apex/auth';
// biome-ignore lint/style/useImportType: Dependency Injection requires value import
import { ConfigService } from '@apex/config';
import { adminDb, eq, tenantsInGovernance, usersInGovernance } from '@apex/db';
import { hashSensitiveData } from '@apex/security';
import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Inject,
  Logger,
  Post,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import * as bcrypt from 'bcrypt';
import type { Response } from 'express';
import { SovereignZodPipe } from '../common/pipes/zod-validation.pipe';
import { z } from 'zod';

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

type LoginDto = z.infer<typeof LoginSchema>;

@Controller({ path: 'auth', version: '1' })
export class AuthController {
  private readonly logger = new Logger(AuthController.name);
  constructor(
    @Inject(AuthService)
    private readonly authService: AuthService,
    private readonly config: ConfigService,
    @Inject('AUDIT_SERVICE')
    private readonly audit: AuditService
  ) {}

  @Post('login')
  @UseGuards(ThrottlerGuard) // Item 30: Prevent brute-force
  @HttpCode(HttpStatus.OK)
  async login(
    @Body(new SovereignZodPipe()) body: LoginDto,
    @Res({ passthrough: true }) response: Response
  ) {
    const { email, password } = body;

    // --- 1. Super Admin Check ---
    const adminEmail = this.config.get('SUPER_ADMIN_EMAIL');
    const adminPassword = this.config.get('SUPER_ADMIN_PASSWORD');

    this.logger.log(
      `Auth Attempt: ${email} (SuperAdmin configured: ${adminEmail})`
    );

    if (adminEmail && adminPassword && email === adminEmail) {
      this.logger.log(`Super Admin check triggered for ${email}`);
      const isPasswordValid = await bcrypt.compare(password, adminPassword);
      if (isPasswordValid) {
        return this.handleSuccessfulLogin(
          {
            id: 'super-admin-id',
            email: email,
            tenantId: 'system',
            role: 'super_admin',
          },
          response
        );
      }
      this.logger.warn(`Super Admin password invalid for ${email}`);
    }

    // --- 2. Merchant Auth Bridge (S7 Sovereign Mandate) ---
    const emailHash = hashSensitiveData(email);
    const [userRecord] = await adminDb
      .select()
      .from(usersInGovernance)
      .where(eq(usersInGovernance.emailHash, emailHash))
      .limit(1);

    if (userRecord?.passwordHash) {
      const isPasswordValid = await bcrypt.compare(
        password,
        userRecord.passwordHash
      );
      if (isPasswordValid) {
        // Find associated tenant (Sovereign Mapping)
        // For the recovery phase, we prioritize the primary owned tenant
        const [ownedTenant] = await adminDb
          .select({
            id: tenantsInGovernance.id,
            subdomain: tenantsInGovernance.subdomain,
          })
          .from(tenantsInGovernance)
          .where(eq(tenantsInGovernance.ownerEmailHash, emailHash))
          .limit(1);

        if (!ownedTenant) {
          throw new UnauthorizedException(
            'Account found but no active tenant association detected'
          );
        }

        return this.handleSuccessfulLogin(
          {
            id: userRecord.id,
            email: email,
            tenantId: ownedTenant.id,
            role: 'tenant_admin',
          },
          response
        );
      }
    }

    // S4: Audit failed login attempt
    await this.audit.log({
      action: 'LOGIN_FAILED',
      entityType: 'user',
      entityId: 'unauthenticated',
      metadata: { email, reason: 'Invalid credentials' },
    });

    throw new UnauthorizedException('Invalid credentials');
  }

  private async handleSuccessfulLogin(
    user: AuthUser,
    response: Response
  ): Promise<{ accessToken: string; managementKey?: string }> {
    // S4: Audit successful login
    await this.audit.log({
      action:
        user.role === 'super_admin'
          ? 'SUPER_ADMIN_LOGIN_SUCCESS'
          : 'MERCHANT_LOGIN_SUCCESS',
      entityType: 'user',
      entityId: user.id,
      actorType: user.role === 'super_admin' ? 'super_admin' : 'tenant_admin',
      metadata: { email: user.email, tenantId: user.tenantId },
    });

    const token = await this.authService.generateToken(user);

    // S8: Set Secure, HttpOnly cookie (Prevent XSS theft)
    const rootDomain = this.config.get('APP_ROOT_DOMAIN') || '60sec.shop';
    response.cookie('adm_tkn', token, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      domain: `.${rootDomain}`,
      path: '/',
      maxAge: 24 * 60 * 60 * 1000, // 1 day
    });

    return {
      accessToken: token,
      ...(user.role === 'super_admin'
        ? { managementKey: this.config.get('SUPER_ADMIN_KEY') }
        : {}),
    };
  }
}
