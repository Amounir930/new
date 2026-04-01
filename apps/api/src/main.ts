/**
 * Apex v2 API Bootstrap
 * Implements S1-S8 Security Protocols + OpenAPI Documentation
 */

import { startTracing } from '@apex/monitoring';

startTracing('apex-api');

import 'reflect-metadata';
import { env } from '@apex/config';
import { defaultCorsConfig, GlobalExceptionFilter } from '@apex/middleware';
import {
  Logger,
  type LogLevel,
  type NestApplicationOptions,
  VersioningType,
} from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import * as Sentry from '@sentry/nestjs';
import cookieParser from 'cookie-parser';
import type { NextFunction, Request, Response } from 'express';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { SovereignZodPipe } from './common/pipes/zod-validation.pipe';

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  // S5: Initialize GlitchTip/Sentry at the earliest possible stage
  if (env.GLITCHTIP_DSN && env.NODE_ENV === 'production') {
    Sentry.init({
      dsn: env.GLITCHTIP_DSN,
      environment: env.NODE_ENV,
    });
    logger.log('🛡️  S5: GlitchTip Error Tracking Active');
  }

  // S1: Environment Verification
  const isProduction = env.NODE_ENV === 'production';
  const logLevels: LogLevel[] = isProduction
    ? ['error', 'warn', 'log']
    : ['error', 'warn', 'log', 'debug', 'verbose'];

  const options: NestApplicationOptions = {
    logger: logLevels,
    bodyParser: false, // S6 FIX 11A: Disable default bodyParser to allow custom limits
  };

  const app = await NestFactory.create<NestExpressApplication>(AppModule, options);

  // S15: Enable Trust Proxy for correct IP extraction (Cloudflare -> Traefik -> NestJS)
  app.set('trust proxy', 'loopback, linklocal, uniquelocal');

  // S8: CORS Configuration (Elevated Priority)
  app.enableCors(defaultCorsConfig);

  // S6 HOTFIX: Dynamic payload limit (single parser, no double-parse conflicts)
  const bodyParser = await import('body-parser');

  // S2 FIX 21B: Capture raw body for webhook signature verification
  const captureRawBody = (
    req: Request & { rawBody?: Buffer },
    _res: Response,
    buf: Buffer
  ) => {
    req.rawBody = buf;
  };

  // S2 FIX 23A: Wrapper Pattern for dynamic limits
  // body-parser.json() does NOT support functions for 'limit'.
  // We must create static parsers and route between them manually.
  const defaultParser = bodyParser.json({
    limit: '100kb',
    verify: captureRawBody,
  });
  const importParser = bodyParser.json({
    limit: '2mb',
    verify: captureRawBody,
  });

  app.use((req: Request, res: Response, next: NextFunction) => {
    if (req.originalUrl?.includes('/api/products/import')) {
      return importParser(req, res, next);
    }
    return defaultParser(req, res, next);
  });

  app.use(cookieParser());
  app.use(bodyParser.urlencoded({ limit: '100kb', extended: true }));

  // S5: Global Exception Filter (Hardened)
  app.useGlobalFilters(
    new GlobalExceptionFilter({
      includeStackTrace: !isProduction,
      includeIpDetails: false,
    })
  );

  // S3: Global Zod Validation Pipe (Sovereign Refactor)
  app.useGlobalPipes(new SovereignZodPipe());

  // S8 FIX 6A: CSP Nonce REMOVED from API.
  // This API returns JSON only — browsers don't execute scripts from JSON.
  // CSP with nonces belongs in the Next.js frontends, not here.

  // S8: Security Headers (Helmet) — Simplified for JSON API
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'none'"],
          connectSrc: [
            "'self'",
            'https://*.60sec.shop',
            'https://api.60sec.shop',
          ],
          frameAncestors: ["'none'"], // Item 41: Prevent clickjacking
          baseUri: ["'none'"],
          formAction: ["'none'"],
        },
      },
      hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true,
      }, // Item 41: Strict HSTS
      xContentTypeOptions: true,
      xFrameOptions: { action: 'deny' },
      referrerPolicy: { policy: 'same-origin' }, // Item 41: Stricter referrer policy
      dnsPrefetchControl: { allow: false },
    })
  );

  // 1. Global prefixing logic (Sovereign Reconciliation)
  // Standardizing '/api' prefix to align with Traefik PathPrefix(/api)
  app.setGlobalPrefix('/api', {
    exclude: [
      { path: '/', method: 1 },
      { path: '/robots.txt', method: 1 },
      // S15: Honeypots at ROOT (Traefik routes these separately or they bypass prefix)
      { path: '/.env', method: 1 },
      { path: '/wp-admin', method: 1 },
      { path: '/wp-login.php', method: 1 },
      { path: '/config.php', method: 1 },
    ],
  });

  // 2. API Versioning (Standardizes /v1/ routes AFTER prefix)
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  // ═══════════════════════════════════════════════════════════════
  // OpenAPI / Swagger Documentation (Permanently decommissioned due to AJV crashes)
  // ═══════════════════════════════════════════════════════════════

  const port = env.PORT || 3000;
  await app.listen(port);

  logger.log(`🚀 API is running on: http://localhost:${port}/api`);
  logger.log(`📚 API Documentation: http://localhost:${port}/api/docs`);
  logger.log('✅ S1-S8 Security Protocols Active');
}

bootstrap();
