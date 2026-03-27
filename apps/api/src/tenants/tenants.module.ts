import { AuditModule } from '@apex/audit';
import { TenantCacheModule } from '@apex/middleware';
import { forwardRef, Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { BulkExportController } from '../products/bulk-export.controller';
import { BulkImportController } from '../products/bulk-import.controller';
import { BulkImportTemplateService } from '../products/bulk-import-template.service';
import { ImportWorker } from '../products/import.worker';
import { FileValidationService } from '../products/file-validation.service';
import { ProvisioningModule } from '../provisioning/provisioning.module';
import { SecurityModule } from '../security/security.module';
import { MerchantConfigController } from './merchant-config.controller';
import { MerchantProductsController } from './merchant-products.controller';
import { MerchantUploadController } from './merchant-upload.controller';
import { ProductMediaController } from './product-media.controller';
import { TenantsController } from './tenants.controller';
import { TenantsPublicController } from './tenants-public.controller';
import { BullModule } from '@nestjs/bull';
import { ConfigModule, ConfigService } from '@apex/config';

@Module({
  imports: [
    AuditModule,
    forwardRef(() => AuthModule),
    forwardRef(() => ProvisioningModule),
    TenantCacheModule,
    SecurityModule,
    BullModule.registerQueueAsync({
      name: 'import-queue',
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        redis: config.get('REDIS_URL') as string || 'redis://localhost:6379',
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [
    TenantsController,
    TenantsPublicController,
    MerchantConfigController,
    BulkImportController,        // ← Specialized routes FIRST
    BulkExportController,        // ← RESTORED: Export endpoint
    MerchantUploadController,
    ProductMediaController,
    MerchantProductsController,  // ← Wildcard /:id LAST
  ],
  providers: [
    ImportWorker,
    FileValidationService,
    BulkImportTemplateService,
  ],
})
export class TenantsModule { }

