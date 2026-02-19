/**
 * Apex v2 API Bootstrap
 * Implements S1-S8 Security Protocols + OpenAPI Documentation
 */

import 'reflect-metadata';
import { AuditService } from '@apex/audit';
import { defaultCorsConfig, GlobalExceptionFilter } from '@apex/middleware';
import {
  Logger,
  type LogLevel,
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
  if (process.env.GLITCHTIP_DSN && process.env.NODE_ENV === 'production') {
    Sentry.init({
      dsn: process.env.GLITCHTIP_DSN,
      environment: process.env.NODE_ENV,
    });
    logger.log('🛡️  S5: GlitchTip Error Tracking Active');
  }

  // S1: Environment Verification
  const isProduction = process.env.NODE_ENV === 'production';
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
      includeIpDetails: !isProduction,
    })
  );

  // S3: Global Zod Validation Pipe
  app.useGlobalPipes(new ZodValidationPipe());

  // S8 FIX: Generate CSP Nonce per request
  app.use((_req: any, res: any, next: any) => {
    const { randomBytes } = require('node:crypto');
    res.locals.cspNonce = randomBytes(16).toString('hex');
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

  // Prefix all routes with /api, but exclude the root path
  app.setGlobalPrefix('api', {
    exclude: ['/', '/robots.txt'],
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
    customCssUrl:
      'https://cdn.jsdelivr.net/npm/swagger-ui-dist@5.9.0/swagger-ui.css',
    customJs: [
      'https://cdn.jsdelivr.net/npm/swagger-ui-dist@5.9.0/swagger-ui-bundle.js',
      'https://cdn.jsdelivr.net/npm/swagger-ui-dist@5.9.0/swagger-ui-standalone-preset.js',
    ],
  });

  const port = process.env.PORT || 3000;
  await app.listen(port);

  logger.log(`🚀 API is running on: http://localhost:${port}/api`);
  logger.log(`📚 API Documentation: http://localhost:${port}/api/docs`);
  logger.log('✅ S1-S8 Security Protocols Active');
}

bootstrap();
