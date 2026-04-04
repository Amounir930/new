import { AuditModule } from '@apex/audit';
import { ConfigModule, ConfigService } from '@apex/config/service';
import { TenantCacheModule } from '@apex/middleware';
import { BullModule } from '@nestjs/bull';
import { forwardRef, Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { BulkExportController } from '../products/bulk-export.controller';
import { BulkImportController } from '../products/bulk-import.controller';
import { BulkImportTemplateService } from '../products/bulk-import-template.service';
import { FileValidationService } from '../products/file-validation.service';
import { ImportWorker } from '../products/import.worker';
import { ProvisioningModule } from '../provisioning/provisioning.module';
import { SecurityModule } from '../security/security.module';
import { MerchantConfigController } from './merchant-config.controller';
import { MerchantCustomersController } from './merchant-customers.controller';
import { MerchantProductsController } from './merchant-products.controller';
import { MerchantUploadController } from './merchant-upload.controller';
import { ProductMediaController } from './product-media.controller';
import { TenantsController } from './tenants.controller';
import { TenantsPublicController } from './tenants-public.controller';

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
        redis: (config.get('REDIS_URL') as string) || 'redis://localhost:6379',
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [
    TenantsController,
    TenantsPublicController,
    MerchantConfigController,
    BulkImportController, // ← Specialized routes FIRST
    BulkExportController, // ← RESTORED: Export endpoint
    MerchantUploadController,
    ProductMediaController,
    MerchantProductsController, // ← Wildcard /:id LAST
    MerchantCustomersController,
  ],
  providers: [ImportWorker, FileValidationService, BulkImportTemplateService],
})
export class TenantsModule { }
