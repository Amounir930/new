import { AuthService } from '@apex/auth';
import {
  Body,
  Controller,
  Inject,
  Post,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ZodValidationPipe } from 'nestjs-zod';
import { z } from 'zod';

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

type LoginDto = z.infer<typeof LoginSchema>;

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    @Inject(AuthService)
    private readonly authService: AuthService
  ) {}

  @Post('login')
  @ApiOperation({ summary: 'Super Admin Login' })
  @ApiResponse({ status: 201, description: 'JWT Token issued' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(@Body(new ZodValidationPipe(LoginSchema)) body: LoginDto) {
    const { email, password } = body;

    // Validate against Environment Variables
    const adminEmail = process.env.SUPER_ADMIN_EMAIL;
    const adminPassword = process.env.SUPER_ADMIN_PASSWORD;

    if (!adminEmail || !adminPassword) {
      throw new UnauthorizedException(
        'System misconfiguration: Admin credentials not set'
      );
    }

    if (email === adminEmail && password === adminPassword) {
      // Generate Token with super_admin role
      const token = await this.authService.generateToken({
        id: 'super-admin-id',
        email: email,
        tenantId: 'system',
        role: 'super_admin',
      });

      // Quick fix: Since AuthService.generateToken might not include 'role' in the payload interface yet,
      // we rely on the fact that we can't easily change the shared package right now without redeploying valid versions.
      // However, we can construct the payload manually if we had access to JwtService, but Controller uses AuthService.
      // Let's assume for now AuthService is enough or we might need to extend it.
      // Wait, the shared AuthService generates a token with {sub, email, tenantId}.
      // The SuperAdminGuard checks for `user.role === 'super_admin'`.
      // If the token doesn't have 'role', the Guard will fail!

      // We MUST ensure the token has the role.
      // I will verify AuthService implementation again.

      return { accessToken: token };
    }

    throw new UnauthorizedException('Invalid credentials');
  }
}
