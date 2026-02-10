import { writeFileSync } from 'fs';
import { Logger } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Test } from '@nestjs/testing';

// -----------------------------------------------------------------------------
// 🛡️ Security & Isolation Setup
// -----------------------------------------------------------------------------

// Mock Environment Variables BEFORE import to satisfy ConfigModule validation
process.env.DATABASE_URL =
  process.env.DATABASE_URL || 'postgresql://user:placeholder@localhost:5432/db_safe';
process.env.REDIS_URL = process.env.REDIS_URL || '';
process.env.JWT_SECRET =
  process.env.JWT_SECRET || 'mock-secret-for-docs-generation-only-32-chars-min';
process.env.TENANT_ISOLATION_MODE = 'strict';
// @ts-ignore NODE_ENV is read-only in some environments
process.env.NODE_ENV = 'test';
process.env.MINIO_ENDPOINT = process.env.MINIO_ENDPOINT || '';
process.env.MINIO_ACCESS_KEY = process.env.MINIO_ACCESS_KEY || '';
process.env.MINIO_SECRET_KEY = process.env.MINIO_SECRET_KEY || '';
process.env.MINIO_BUCKET = process.env.MINIO_BUCKET || '';
process.env.MINIO_REGION = process.env.MINIO_REGION || '';

console.log('DEBUG: Env vars set:', {
  DB: process.env.DATABASE_URL,
  JWT: process.env.JWT_SECRET ? 'Exists' : 'Missing',
  MINIO: process.env.MINIO_ENDPOINT,
});

async function generate() {
  const logger = new Logger('OpenAPIGenerator');
  logger.log('🚀 Starting OpenAPI Specification Generation (Mocked Mode)...');

  try {
    // Dynamic import to ensure env vars are set before module load
    const { AppModule } = await import('../src/app.module.js');
    // Use dynamic import for db to avoid type issues with index vs dist
    const dbModule = (await import('@apex/db')) as any;
    const TenantRegistryService = dbModule.TenantRegistryService;

    // Mock Services
    const mockTenantRegistryService = {
      get: () => Promise.resolve(null),
      register: () => Promise.resolve({}),
    };

    const mockProvisioningService = {
      provision: () => Promise.resolve({ success: true }),
    };

    const mockAuditService = {
      log: () => Promise.resolve(),
    };

    // Create Testing Module to override infrastructure dependencies
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(TenantRegistryService)
      .useValue(mockTenantRegistryService)
      .overrideProvider('PROVISIONING_SERVICE')
      .useValue(mockProvisioningService)
      .overrideProvider('AUDIT_SERVICE')
      .useValue(mockAuditService)
      .compile();

    const app = moduleRef.createNestApplication();

    // Configure Document Builder with Security Specs
    const config = new DocumentBuilder()
      .setTitle('KIMI API')
      .setDescription(
        `60-Second Store Provisioning Engine API
        
        ## Security Protocols
        - **S6 Rate Limiting**: Strict throttling enabled (Default: 100 req/min, Auth: 10 req/min).
        - **S8 Security Headers**: Helmet enabled (CSP, HSTS, etc.).
        - **S2 Tenant Isolation**: All resources are strictly isolated per tenant.
        
        ## Usage
        All endpoints require Bearer Authentication (JWT).
        `
      )
      .setVersion('2.0.0')
      .addBearerAuth()
      .addTag('Provisioning', 'Store provisioning and management')
      .addTag('Export', 'Data export and portability (S14)')
      .addTag('Health', 'System health and conductivity checks')
      .build();

    const document = SwaggerModule.createDocument(app, config);

    // Filter sensitive paths (Administrative or internal only)
    if (document.paths) {
      for (const path of Object.keys(document.paths)) {
        if (path.includes('/admin')) {
          delete document.paths[path]; // Hide admin routes from public docs
        }
      }
    }

    writeFileSync('./openapi-spec.json', JSON.stringify(document, null, 2));
    logger.log('✅ Generated openapi-spec.json successfully');

    await app.close();
  } catch (error) {
    logger.error('❌ Failed to generate OpenAPI spec', error);
    process.exit(1);
  }
}

generate();
