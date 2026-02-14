// 🛡️ S1 Compliance: Enforce environment variables only.
// No hardcoded mock secrets allowed in source control.
if (
  process.env.NODE_ENV === 'production' &&
  (!process.env.DATABASE_URL || process.env.DATABASE_URL.includes('mock'))
) {
  throw new Error(
    'S1 CRITICAL: Production environment detected with missing or mock DATABASE_URL'
  );
}

// Ensure strict isolation mode
process.env.TENANT_ISOLATION_MODE = 'strict';
process.env.NODE_ENV = process.env.NODE_ENV || 'test';

console.log('DEBUG: Env vars set (Mock Mode):', {
  DB: process.env.DATABASE_URL,
  JWT: process.env.JWT_SECRET ? 'Exists' : 'Missing',
});

// -----------------------------------------------------------------------------
// DYNAMIC IMPORTS ONLY (Prevent Hoisting Issues)
// -----------------------------------------------------------------------------

async function generate() {
  // Dynamic imports ensure env vars are processed FIRST
  const { writeFileSync } = await import('node:fs');
  const { Logger } = await import('@nestjs/common');

  // Use explicit path dynamic import for local module to avoid eager evaluation
  // Note: We use relative path for local module
  const { AppModule } = await import('../src/app.module.js');

  const { EncryptionService } = await import('@apex/security');
  const { AuditService } = await import('@apex/audit');
  const { TenantRegistryService, CustomerService } = await import('@apex/db');
  const { DocumentBuilder, SwaggerModule } = await import('@nestjs/swagger');
  const { Reflector } = await import('@nestjs/core');
  const { Test } = await import('@nestjs/testing');
  const { AuditInterceptor } = await import('@apex/audit');
  const { ProvisioningService } = await import(
    '../src/provisioning/provisioning.service.js'
  );

  const logger = new Logger('OpenAPIGenerator');
  logger.log('🚀 Starting OpenAPI Specification Generation (Mocked Mode)...');

  try {
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
      .overrideProvider(ProvisioningService)
      .useValue(mockProvisioningService)
      .overrideProvider('PROVISIONING_SERVICE')
      .useValue(mockProvisioningService)
      .overrideProvider(CustomerService)
      .useValue({
        create: () => Promise.resolve({}),
        findByEmail: () => Promise.resolve(null),
        findById: () => Promise.resolve(null),
      })
      .overrideProvider(EncryptionService) // Mock EncryptionService
      .useValue({
        encrypt: () => ({ encrypted: 'mock', iv: 'mock', tag: 'mock', salt: 'mock' }),
        decrypt: () => 'mock-decrypted',
        hashSensitiveData: () => 'mock-hash',
      })
      .overrideProvider(AuditInterceptor)
      .useValue({})
      .overrideProvider(AuditService)
      .useValue(mockAuditService)
      .overrideProvider(Reflector)
      .useValue(new Reflector())
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
