import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

export interface JwtPayload {
  sub: string;
  email: string;
  tenantId?: string;
  role?: string;
}

export interface AuthUser {
  id: string;
  email: string;
  tenantId?: string;
  role?: string;
}

@Injectable()
export class AuthService {
  constructor(@Inject(JwtService) private readonly jwtService: JwtService) { }

  async generateToken(user: AuthUser): Promise<string> {
    const crypto = await import('node:crypto');
    const payload: JwtPayload & { jti: string } = {
      sub: user.id,
      email: user.email,
      tenantId: user.tenantId,
      role: user.role,
      jti: crypto.randomUUID(), // Audit 777 Point #47: Session ID regeneration
    };
    return this.jwtService.sign(payload);
  }

  async validateUser(payload: JwtPayload): Promise<AuthUser> {
    if (!payload.sub) {
      throw new UnauthorizedException('Invalid token payload');
    }
    return {
      id: payload.sub,
      email: payload.email,
      tenantId: payload.tenantId,
      role: payload.role,
    };
  }

  async verifyToken(token: string): Promise<JwtPayload> {
    try {
      return this.jwtService.verify<JwtPayload>(token);
    } catch {
      throw new UnauthorizedException('Invalid token');
    }
  }
}
