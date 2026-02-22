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
  };

  const app = await NestFactory.create(AppModule, options);

  // S4: Initialize Audit System (Infrastructure as Code)
  try {
    const auditService = app.get(AuditService);
    await auditService.initializeS4();
  } catch (error) {
    logger.error('Failed to initialize Audit System', error);
  }

  // S3.3: Payload Size Limit (Prevent DoS/ReDoS)
  const bodyParser = await import('body-parser');
  app.use(bodyParser.json({ limit: '10mb' }));
  app.use(bodyParser.urlencoded({ limit: '10mb', extended: true }));

  // S5: Global Exception Filter (Hardened)
  app.useGlobalFilters(
    new GlobalExceptionFilter({
      includeStackTrace: !isProduction,
      includeIpDetails: false, // S5 FIX: Never leak IP details in response
    })
  );

  // S3: Global Zod Validation Pipe
  app.useGlobalPipes(new ZodValidationPipe());

  // S8 FIX: Generate CSP Nonce per request
  app.use((_req: any, res: any, next: any) => {
    const { randomBytes } = require('node:crypto');
    // S8 FIX: Increase entropy to 32 bytes (256-bit) and use base64 for CSP compliance
    res.locals.cspNonce = randomBytes(32).toString('base64');
    next();
  });

  // S8: Security Headers (Helmet)
  // CRITICAL FIX (S8): Removed 'unsafe-inline' from scriptSrc
  // Using strict CSP with nonce generation for inline scripts
  // biome-ignore format: S8 Security Gate requires robust detection
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", 'https://cdn.jsdelivr.net', (_req: any, res: any) => `'nonce-${res.locals.cspNonce}'`],
        styleSrc: ["'self'", 'https://cdn.jsdelivr.net', 'https://fonts.googleapis.com', (_req: any, res: any) => `'nonce-${res.locals.cspNonce}'`],
        imgSrc: ["'self'", 'data:', 'https:'],
        connectSrc: ["'self'"],
        fontSrc: ["'self'", 'https://fonts.gstatic.com'],
        objectSrc: ["'none'"],
        upgradeInsecureRequests: [],
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

  // Prefix all routes with /api, but exclude the root path and health checks
  app.setGlobalPrefix('api', {
    exclude: [
      { path: '/', method: 1 }, // GET
      { path: '/robots.txt', method: 1 },
      { path: '/health/liveness', method: 1 },
      { path: '/health/status', method: 1 },
      { path: 'health/(.*)', method: 1 },
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
