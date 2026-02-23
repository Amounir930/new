/**
 * Apex v2 API Bootstrap
 * Implements S1-S8 Security Protocols + OpenAPI Documentation
 */

import 'reflect-metadata';
import { env } from '@apex/config';
import { AuditService } from '@apex/audit';
import { GlobalExceptionFilter, defaultCorsConfig } from '@apex/middleware';
import {
  type LogLevel,
  Logger,
  type NestApplicationOptions,
  VersioningType,
} from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as Sentry from '@sentry/nestjs';
import helmet from 'helmet';
import { ZodValidationPipe } from 'nestjs-zod';
import { AppModule } from './app.module.js';

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

  const app = await NestFactory.create(AppModule, options);

  // S4: Initialize Audit System (Infrastructure as Code)
  try {
    const auditService = app.get(AuditService);
    await auditService.initializeS4();
  } catch (error) {
    logger.error('Failed to initialize Audit System', error);
  }

  // S6 HOTFIX: Dynamic payload limit (single parser, no double-parse conflicts)
  const bodyParser = await import('body-parser');

  // S2 FIX 21B: Capture raw body for webhook signature verification
  const captureRawBody = (req: any, _res: any, buf: Buffer) => {
    req.rawBody = buf;
  };

  // S2 FIX 23A: Wrapper Pattern for dynamic limits
  // body-parser.json() does NOT support functions for 'limit'. 
  // We must create static parsers and route between them manually.
  const defaultParser = bodyParser.json({ limit: '100kb', verify: captureRawBody });
  const importParser = bodyParser.json({ limit: '2mb', verify: captureRawBody });

  app.use((req: any, res: any, next: any) => {
    if (req.originalUrl?.includes('/api/products/import')) {
      return importParser(req, res, next);
    }
    return defaultParser(req, res, next);
  });

  app.use(bodyParser.urlencoded({ limit: '100kb', extended: true }));

  // S5: Global Exception Filter (Hardened)
  app.useGlobalFilters(
    new GlobalExceptionFilter({
      includeStackTrace: !isProduction,
      includeIpDetails: false, // S5 FIX: Never leak IP details in response
    })
  );

  // S3: Global Zod Validation Pipe
  app.useGlobalPipes(new ZodValidationPipe());

  // S8 FIX 6A: CSP Nonce REMOVED from API.
  // This API returns JSON only — browsers don't execute scripts from JSON.
  // CSP with nonces belongs in the Next.js frontends, not here.

  // S8: Security Headers (Helmet) — Simplified for JSON API
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'none'"],
        frameAncestors: ["'none'"],
      },
    },
    hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
    xContentTypeOptions: true,
    xFrameOptions: { action: 'deny' },
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  }));

  // S8: CORS Configuration
  app.enableCors(defaultCorsConfig);

  // API Versioning
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  // Prefix all routes with /api, but exclude root, health, and S15 honeypots
  app.setGlobalPrefix('api', {
    exclude: [
      { path: '/', method: 1 }, // GET
      { path: '/robots.txt', method: 1 },
      { path: '/health/liveness', method: 1 },
      { path: '/health/status', method: 1 },
      { path: 'health/(.*)', method: 1 },
      // S15 FIX 8A: Honeypots at ROOT so scanners find them
      { path: '/.env', method: 1 },
      { path: '/.env', method: 4 }, // POST
      { path: '/wp-admin', method: 1 },
      { path: '/wp-admin', method: 4 },
      { path: '/wp-login.php', method: 1 },
      { path: '/wp-login.php', method: 4 },
      { path: '/admin/login', method: 1 },
      { path: '/admin/login', method: 4 },
      { path: '/config.php', method: 1 },
      { path: '/config.php', method: 4 },
    ],
  });

  // ═══════════════════════════════════════════════════════════════
  // OpenAPI / Swagger Documentation
  // ═══════════════════════════════════════════════════════════════
  const config = new DocumentBuilder()
    .setTitle('KIMI API')
    .setDescription('60-Second Store Provisioning Engine API')
    .setVersion('2.0.0')
    .addBearerAuth()
    .addTag('Provisioning', 'Store provisioning endpoints')
    .addTag('Export', 'Tenant data export (S14)')
    .addTag('Health', 'Health check endpoints')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  // Swagger is mounted at /api/docs (prefix 'api' + path 'docs')
  SwaggerModule.setup('docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
    // S8 FIX: Localize Swagger assets to prevent external CDN dependence (Critical)
    customCssUrl: '/api/docs/swagger-ui.css',
    customJs: [
      '/api/docs/swagger-ui-bundle.js',
      '/api/docs/swagger-ui-standalone-preset.js',
    ],
  });

  const port = env.PORT || 3000;
  await app.listen(port);

  logger.log(`🚀 API is running on: http://localhost:${port}/api`);
  logger.log(`📚 API Documentation: http://localhost:${port}/api/docs`);
  logger.log('✅ S1-S8 Security Protocols Active');
}

bootstrap();
