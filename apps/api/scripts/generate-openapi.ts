
// -----------------------------------------------------------------------------
// 🛡️ Security & Isolation Setup (MUST BE FIRST)
// -----------------------------------------------------------------------------
process.env.DATABASE_URL = process.env.DATABASE_URL || `postgres://mock_user:mock_pass@localhost:5432/mock_db`;
process.env.REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'mock-jwt-secret-for-generation-only-32char';
process.env.MINIO_ENDPOINT = process.env.MINIO_ENDPOINT || 'localhost';
process.env.MINIO_ACCESS_KEY = process.env.MINIO_ACCESS_KEY || 'mock-access-key';
process.env.MINIO_SECRET_KEY = process.env.MINIO_SECRET_KEY || 'mock-secret-key';
process.env.TENANT_ISOLATION_MODE = 'strict';
// @ts-expect-error NODE_ENV is read-only in some environments
process.env.NODE_ENV = 'test';

console.log('DEBUG: Env vars set:', {
  DB: process.env.DATABASE_URL,
  JWT: process.env.JWT_SECRET ? 'Exists' : 'Missing',
});

import { writeFileSync } from 'node:fs';
import { TenantRegistryService } from '@apex/db';
import { Logger } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Test } from '@nestjs/testing';
import { ProvisioningService } from '../src/provisioning/provisioning.service.js';

async function generate() {
  const logger = new Logger('OpenAPIGenerator');
  logger.log('🚀 Starting OpenAPI Specification Generation (Mocked Mode)...');

  try {
    // Dynamic import to ensure env vars are set before module load
    const { AppModule } = await import('../src/app.module.js');
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
      .overrideProvider(ProvisioningService) // Override the Class Provider
      .useValue(mockProvisioningService)
      .overrideProvider('PROVISIONING_SERVICE') // Override the String Token Provider
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
