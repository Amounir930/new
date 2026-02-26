import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

export interface JwtPayload {
  sub: string;
  email: string;
  tenantId: string; // Item 21: Mandatory
  role?: string;
  jti: string; // Item 24: Mandatory replay protection
  dfp?: string; // Item 26: Device Fingerprint
}

export interface AuthUser {
  id: string;
  email: string;
  tenantId: string; // Item 21: Mandatory
  role?: string;
  sessionId?: string; // For rotation tracking
}

@Injectable()
export class AuthService {
  constructor(@Inject(JwtService) private readonly jwtService: JwtService) {}

  async generateToken(
    user: AuthUser,
    deviceFingerprint?: string
  ): Promise<string> {
    const crypto = await import('node:crypto');

    // Item 21: Ensure tenantId exists
    if (!user.tenantId) {
      throw new Error('S2 Violation: Cannot generate JWT without tenantId');
    }

    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      tenantId: user.tenantId,
      role: user.role,
      jti: user.sessionId || crypto.randomUUID(), // Item 24/25: Bind to sessionId if available
      dfp: deviceFingerprint, // Item 26: Fingerprinting
    };
    return this.jwtService.sign(payload);
  }

  /**
   * Item 25: Refresh Token Rotation
   */
  async rotateToken(
    user: AuthUser,
    _oldJti: string,
    deviceFingerprint?: string
  ): Promise<string> {
    // In a full implementation, oldJti should be blacklisted here
    return this.generateToken(
      { ...user, sessionId: undefined },
      deviceFingerprint
    );
  }

  async validateUser(payload: JwtPayload): Promise<AuthUser> {
    if (!payload.sub || !payload.tenantId) {
      throw new UnauthorizedException(
        'S2 Violation: Invalid token payload (missing sub or tenantId)'
      );
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
