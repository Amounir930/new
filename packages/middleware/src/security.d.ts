/**
 * S8: Web Security Headers & Configuration
 * Constitution Reference: architecture.md (S8 Protocol)
 * Purpose: CSP, HSTS, CORS, CSRF protection
 */
import { type NestMiddleware } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';
/**
 * Security headers configuration
 */
export declare const securityHeaders: {
    'Strict-Transport-Security': string;
    'Content-Security-Policy': string;
    'X-Frame-Options': string;
    'X-Content-Type-Options': string;
    'X-XSS-Protection': string;
    'Referrer-Policy': string;
    'X-DNS-Prefetch-Control': string;
    'Permissions-Policy': string;
};
export declare class SecurityHeadersMiddleware implements NestMiddleware {
    use(_req: Request, res: Response, next: NextFunction): void;
}
/**
 * CORS configuration per tenant
 * S8 FIX: origin can be a function for dynamic whitelist
 */
export interface CorsConfig {
    origin: string | string[] | boolean | ((origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => void);
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
export declare const defaultCorsConfig: CorsConfig;
/**
 * Dynamic CORS based on tenant domain
 */
export declare function getTenantCorsConfig(tenantDomain: string): CorsConfig;
/**
 * CSRF Protection
 * Double-submit cookie pattern
 */
export declare class CsrfProtection {
    private readonly tokenName;
    private readonly headerName;
    generateToken(): string;
    setCookie(res: Response, token: string): void;
    validate(req: Request): boolean;
}
/**
 * NestJS CSRF Guard
 */
import type { CanActivate, ExecutionContext } from '@nestjs/common';
export declare class CsrfGuard implements CanActivate {
    private csrf;
    canActivate(context: ExecutionContext): boolean;
}
/**
 * Helmet-like security configuration for NestJS
 */
export declare const helmetConfig: {
    contentSecurityPolicy: {
        directives: {
            defaultSrc: string[];
            scriptSrc: string[];
            styleSrc: string[];
            imgSrc: string[];
            connectSrc: string[];
            fontSrc: string[];
            objectSrc: string[];
            mediaSrc: string[];
            frameSrc: string[];
        };
    };
    crossOriginEmbedderPolicy: boolean;
    crossOriginOpenerPolicy: {
        policy: string;
    };
    crossOriginResourcePolicy: {
        policy: string;
    };
    dnsPrefetchControl: {
        allow: boolean;
    };
    frameguard: {
        action: string;
    };
    hidePoweredBy: boolean;
    hsts: {
        maxAge: number;
        includeSubDomains: boolean;
        preload: boolean;
    };
    ieNoOpen: boolean;
    noSniff: boolean;
    originAgentCluster: boolean;
    permittedCrossDomainPolicies: {
        permittedPolicies: string;
    };
    referrerPolicy: {
        policy: string;
    };
    xssFilter: boolean;
};
//# sourceMappingURL=security.d.ts.map