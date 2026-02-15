/**
 * S8: Web Security Headers & Configuration
 * Constitution Reference: architecture.md (S8 Protocol)
 * Purpose: CSP, HSTS, CORS, CSRF protection
 */

import { Injectable, type NestMiddleware } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';

/**
 * Security headers configuration
 */
export const securityHeaders = {
  // Strict Transport Security (HSTS)
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',

  // Content Security Policy
  // S8 FIX: Removed 'unsafe-inline' 'unsafe-eval' - use nonces via CspNonceMiddleware
  // Note: 'unsafe-eval' is ONLY allowed in development for Next.js HMR
  'Content-Security-Policy': [
    "default-src 'self'",
    process.env.NODE_ENV === 'development'
      ? "script-src 'self' 'unsafe-eval'" // Dev only: HMR requires eval
      : "script-src 'self'", // Production: strict, nonces added by middleware
    "style-src 'self' 'unsafe-inline'", // CSS inline is lower risk
    "img-src 'self' data: https:",
    "font-src 'self'",
    "connect-src 'self' https://api.apex.com wss://localhost:*", // wss for HMR
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join('; '),

  // Prevent clickjacking
  'X-Frame-Options': 'DENY',

  // MIME sniffing protection
  'X-Content-Type-Options': 'nosniff',

  // XSS protection (legacy but still useful)
  'X-XSS-Protection': '1; mode=block',

  // Referrer policy
  'Referrer-Policy': 'strict-origin-when-cross-origin',

  // DNS Prefetch Control
  'X-DNS-Prefetch-Control': 'off',

  // Permissions policy (formerly Feature-Policy)
  'Permissions-Policy': [
    'accelerometer=()',
    'camera=()',
    'geolocation=()',
    'gyroscope=()',
    'magnetometer=()',
    'microphone=()',
    'payment=()',
    'usb=()',
  ].join(', '),
};

@Injectable()
export class SecurityHeadersMiddleware implements NestMiddleware {
  use(_req: Request, res: Response, next: NextFunction): void {
    // Apply security headers
    for (const [header, value] of Object.entries(securityHeaders)) {
      res.setHeader(header, value);
    }

    // Remove headers that leak info
    res.removeHeader('X-Powered-By');
    res.removeHeader('Server');

    next();
  }
}

/**
 * CORS configuration per tenant
 * S8 FIX: origin can be a function for dynamic whitelist
 */
export interface CorsConfig {
  origin:
  | string
  | string[]
  | boolean
  | ((
    origin: string | undefined,
    callback: (err: Error | null, allow?: boolean) => void
  ) => void);
  methods: string[];
  allowedHeaders: string[];
  exposedHeaders: string[];
  credentials: boolean;
  maxAge: number;
}

/**
 * Dynamic whitelist approach for CORS
 * In production, configure with actual domains via ALLOWED_ORIGINS
 */
export const defaultCorsConfig: CorsConfig = {
  // Use whitelist pattern - by default only same-origin
  // In production, configure with actual domains via ALLOWED_ORIGINS
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);

    // Standard development origins (only these are allowed in dev)
    const devOrigins = [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:5173',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:3001',
      'http://127.0.0.1:5173',
    ];

    // Production origins (explicitly whitelisted)
    const productionOrigins = [
      'https://super-admin.60sec.shop',
      'https://admin.60sec.shop',
    ];

    // Load additional origins from env
    const allowedOrigins =
      process.env.ALLOWED_ORIGINS?.split(',').filter(Boolean) || [];
    const whitelist = [...devOrigins, ...productionOrigins, ...allowedOrigins];

    // CRITICAL FIX (S8): Even in development, only allow whitelisted origins
    // This prevents accidental open CORS if NODE_ENV is misconfigured
    if (whitelist.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`S8: CORS blocked request from origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Request-ID',
    'X-Tenant-ID',
  ],
  exposedHeaders: [
    'X-RateLimit-Limit',
    'X-RateLimit-Remaining',
    'X-RateLimit-Reset',
  ],
  credentials: true,
  maxAge: 86400, // 24 hours
};

/**
 * Dynamic CORS based on tenant domain
 */
export function getTenantCorsConfig(tenantDomain: string): CorsConfig {
  return {
    ...defaultCorsConfig,
    origin: [
      tenantDomain,
      `admin.${tenantDomain}`,
      // Add localhost for development
      ...(process.env.NODE_ENV === 'development'
        ? ['http://localhost:3000', 'http://localhost:3001']
        : []),
    ],
  };
}

/**
 * CSRF Protection
 * Double-submit cookie pattern
 */
export class CsrfProtection {
  private readonly tokenName = 'XSRF-TOKEN';
  private readonly headerName = 'X-XSRF-TOKEN';

  generateToken(): string {
    return randomBytes(32).toString('hex');
  }

  setCookie(res: Response, token: string): void {
    res.cookie(this.tokenName, token, {
      httpOnly: true, // S8 FIX: Sensitive tokens must be httpOnly (Surgical Gate Compliance)
      secure: true, // S8 FIX: Always secure in modern environments
      sameSite: 'strict',
      path: '/',
    });
  }

  validate(req: Request): boolean {
    const cookieToken = req.cookies?.[this.tokenName];
    const headerToken = req.headers[this.headerName.toLowerCase()];

    if (!cookieToken || !headerToken) {
      return false;
    }

    return cookieToken === headerToken;
  }
}

import { randomBytes } from 'node:crypto';
/**
 * NestJS CSRF Guard
 */
import type { CanActivate, ExecutionContext } from '@nestjs/common';

@Injectable()
export class CsrfGuard implements CanActivate {
  private csrf = new CsrfProtection();

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();

    // Skip for GET/HEAD/OPTIONS
    if (['GET', 'HEAD', 'OPTIONS'].includes(request.method)) {
      // Set new token for safe methods
      const token = this.csrf.generateToken();
      this.csrf.setCookie(response, token);
      return true;
    }

    // Validate for state-changing methods
    return this.csrf.validate(request);
  }
}

/**
 * Helmet-like security configuration for NestJS
 */
export const helmetConfig = {
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: true,
  crossOriginOpenerPolicy: { policy: 'same-origin' },
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  dnsPrefetchControl: { allow: false },
  frameguard: { action: 'deny' },
  hidePoweredBy: true,
  hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
  ieNoOpen: true,
  noSniff: true,
  originAgentCluster: true,
  permittedCrossDomainPolicies: { permittedPolicies: 'none' },
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  xssFilter: true,
};
