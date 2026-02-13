/**
 * Apex v2 API Bootstrap
 * Implements S1-S8 Security Protocols + OpenAPI Documentation
 */

import { defaultCorsConfig, GlobalExceptionFilter } from '@apex/middleware';
import { Logger, ValidationPipe, VersioningType } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { ZodValidationPipe } from 'nestjs-zod';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  // S1: Environment Verification happens automatically via @apex/config

  const app = await NestFactory.create(AppModule);

  // S3.3: Payload Size Limit (Prevent DoS/ReDoS)
  const bodyParser = await import('body-parser');
  app.use(bodyParser.json({ limit: '10mb' }));
  app.use(bodyParser.urlencoded({ limit: '10mb', extended: true }));

  // S5: Global Exception Filter
  app.useGlobalFilters(new GlobalExceptionFilter());

  // S3: Global Validation Pipe
  app.useGlobalPipes(
    new ZodValidationPipe(),
    new ValidationPipe({
      whitelist: true, // Strip properties not in DTO
      forbidNonWhitelisted: true, // Throw error if extra properties
      transform: true, // Auto-transform payloads
    })
  );

  // S8 FIX: Generate CSP Nonce per request
  app.use((req: any, res: any, next: any) => {
    const { randomBytes } = require('node:crypto');
    res.locals.cspNonce = randomBytes(16).toString('hex');
    next();
  });

  // S8: Security Headers (Helmet)
  // CRITICAL FIX (S8): Removed 'unsafe-inline' from scriptSrc
  // Using strict CSP with nonce generation for inline scripts
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: [
            "'self'",
            (req: any, res: any) => `'nonce-${res.locals.cspNonce}'`,
          ],
          styleSrc: [
            "'self'",
            (req: any, res: any) => `'nonce-${res.locals.cspNonce}'`,
          ],
          imgSrc: ["'self'", 'data:', 'https:'],
          connectSrc: ["'self'"],
          fontSrc: ["'self'"],
          objectSrc: ["'none'"],
          upgradeInsecureRequests: [],
        },
      },
      hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
      xContentTypeOptions: true,
      xFrameOptions: { action: 'deny' },
      referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    })
  );

  // S8: CORS Configuration
  app.enableCors(defaultCorsConfig);

  // API Versioning
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  // Prefix all routes with /api
  app.setGlobalPrefix('api');

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
  SwaggerModule.setup('api/docs', app, document, {
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
