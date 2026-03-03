// biome-ignore lint/style/useImportType: Dependency Injection requires value import (S1-S15 Compliance)
import { AuditService } from '@apex/audit';
import { AuthService, type AuthUser } from '@apex/auth';
// biome-ignore lint/style/useImportType: Dependency Injection requires value import
import { ConfigService } from '@apex/config';
import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Inject,
  Post,
  Res,
  UnauthorizedException,
  UseGuards,
  VERSION_NEUTRAL,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ThrottlerGuard } from '@nestjs/throttler';
import { ZodValidationPipe } from 'nestjs-zod';
import { z } from 'zod';

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

type LoginDto = z.infer<typeof LoginSchema>;

@ApiTags('Auth')
@Controller({ path: 'auth', version: [VERSION_NEUTRAL, '1'] })
export class AuthController {
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
  @ApiOperation({ summary: 'Super Admin Login' })
  async login(
    @Body(new ZodValidationPipe(LoginSchema)) body: LoginDto,
    @Res({ passthrough: true }) response: any
  ) {
    const { email, password } = body;

    // S1: Validate against ConfigService
    const adminEmail = this.config.get('SUPER_ADMIN_EMAIL');
    const adminPassword = this.config.get('SUPER_ADMIN_PASSWORD');

    if (!adminEmail || !adminPassword) {
      throw new UnauthorizedException(
        'System misconfiguration: Admin credentials not set'
      );
    }

    // S7/Item 29: Compare hashed password using bcrypt (S1-S15 Compliance: 12 Rounds)
    const isPasswordValid = await require('bcrypt').compare(
      password,
      adminPassword
    );

    if (email === adminEmail && isPasswordValid) {
      // S4: Audit successful login
      await this.audit.log({
        action: 'SUPER_ADMIN_LOGIN_SUCCESS',
        entityType: 'user',
        entityId: 'system-admin',
        metadata: { email },
      });

      // Generate Token with super_admin role
      const user: AuthUser = {
        id: 'super-admin-id',
        email: email,
        tenantId: 'system',
        role: 'super_admin',
      };

      const token = await this.authService.generateToken(user);

      // S8: Set Secure, HttpOnly cookie for admin session (Prevent XSS theft)
      response.cookie('adm_tkn', token, {
        httpOnly: true,
        secure: true,
        sameSite: 'strict',
        path: '/',
        maxAge: 24 * 60 * 60 * 1000, // 1 day
      });

      return { accessToken: token };
    }

    // S4: Audit failed login attempt
    await this.audit.log({
      action: 'SUPER_ADMIN_LOGIN_FAILED',
      entityType: 'user',
      entityId: 'system-admin',
      metadata: { email, reason: 'Invalid credentials' },
    });

    // S5: Standardized error message without leaking internal match details
    throw new UnauthorizedException('Invalid credentials');
  }
}
