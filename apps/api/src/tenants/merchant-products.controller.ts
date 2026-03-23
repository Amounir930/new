import { AuditLog } from '@apex/audit';
import {
  type AuthenticatedRequest,
  JwtAuthGuard,
  TenantJwtMatchGuard,
} from '@apex/auth';
import { env } from '@apex/config';
import {
  and,
  eq,
  getTenantDb,
  type InferInsertModel,
  productsInStorefront,
} from '@apex/db';
import {
  CheckQuota,
  QuotaInterceptor,
  RequireFeature,
  TenantCacheService,
} from '@apex/middleware';
import { deletePrefix, migrateProductMedia } from '@apex/provisioning';
import { S3Client } from '@aws-sdk/client-s3';
import {
  Body,
  Controller,
  Delete,
  Get,
  InternalServerErrorException,
  Logger,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import type {
  CreateProductDto,
  UpdateProductDto,
} from '../products/dto/create-product.dto';

@Controller('merchant/products')
@UseGuards(JwtAuthGuard, TenantJwtMatchGuard)
@UseInterceptors(QuotaInterceptor)
export class MerchantProductsController {
  private readonly logger = new Logger(MerchantProductsController.name);

  constructor(readonly _tenantCache: TenantCacheService) {}

  @Get()
  @RequireFeature('ecommerce')
  async findAll(@Req() req: AuthenticatedRequest) {
    const tenantId = req.user.tenantId;
    const { schemaName } = this.getRequiredContext(req);

    const { db, release } = await getTenantDb(tenantId, schemaName);
    try {
      return await db
        .select()
        .from(productsInStorefront)
        .where(eq(productsInStorefront.isActive, true));
    } finally {
      release();
    }
  }

  @Post()
  @RequireFeature('ecommerce')
  @CheckQuota('products')
  @AuditLog({ action: 'PRODUCT_CREATED', entityType: 'product' })
  async create(
    @Req() req: AuthenticatedRequest,
    @Body() body: CreateProductDto
  ) {
    const tenantId = req.user.tenantId;
    const { schemaName, subdomain } = this.getRequiredContext(req);

    const productData: InferInsertModel<typeof productsInStorefront> = {
      ...body,
      name: { ar: body.nameAr, en: body.nameEn },
      shortDescription: {
        ar: body.shortDescriptionAr || null,
        en: body.shortDescriptionEn || null,
      },
      longDescription: {
        ar: body.descriptionAr || null,
        en: body.descriptionEn || null,
      },
      taxBasisPoints: Math.round((body.taxPercentage || 0) * 100),
      basePrice: String(body.basePrice),
      salePrice: body.salePrice ? String(body.salePrice) : null,
    };

    const { db, release } = await getTenantDb(tenantId, schemaName);
    try {
      // 🛡️ Mandate 3: Strict Distributed Transaction (All or Nothing)
      const result = await db.transaction(async (tx) => {
        // 1. Drizzle Insert เพื่อสร้าง productId
        const [product] = await tx
          .insert(productsInStorefront)
          .values(productData)
          .returning();

        // 2. Asset Migration Engine: Move from temp/ to public/products/{productId}
        // 🛑 If this throws, Drizzle triggers ROLLBACK automatically (Mandate 3.3)
        const migratedUrls = await migrateProductMedia(
          subdomain,
          product.id,
          body.mainImage,
          body.galleryImages || []
        );

        // 3. Update DB with final URLs within the SAME transaction
        const [finalProduct] = await tx
          .update(productsInStorefront)
          .set({
            mainImage: migratedUrls.mainImage,
            galleryImages: migratedUrls.galleryImages,
          })
          .where(eq(productsInStorefront.id, product.id))
          .returning();

        return { ...finalProduct, ...migratedUrls };
      });

      // 4. Cache Sync & ISR Revalidation (Post-Commit)
      await this.syncCache(subdomain);

      return {
        success: true,
        data: result,
      };
    } catch (error) {
      this.logger.error(
        `PRODUCT_CREATE_TRANSACTION_FAILURE: ${error instanceof Error ? error.message : String(error)}`
      );
      // Ensure we re-throw to trigger 500/Rollback visibility
      throw error instanceof InternalServerErrorException
        ? error
        : new InternalServerErrorException(
            'Failed to create product because asset migration failed. Database rolled back.'
          );
    } finally {
      release();
    }
  }

  private async syncCache(subdomain: string) {
    try {
      // 1. Purge Redis
      const { createClient } = require('redis');
      const client = createClient({ url: env.REDIS_URL });
      await client.connect();
      await client.del(`storefront:products:${subdomain}`);
      await client.del(`storefront:bootstrap:${subdomain}`);
      await client.disconnect();

      // 2. Trigger Next.js On-Demand ISR
      await fetch(`http://store:3002/api/revalidate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-internal-secret': env.INTERNAL_API_SECRET || '',
        },
        body: JSON.stringify({
          tags: [`tenant-${subdomain.toLowerCase()}`],
        }),
      });
    } catch (err) {
      this.logger.warn(
        `CACHE_SYNC_ERROR: ${err instanceof Error ? err.message : String(err)}`
      );
    }
  }

  @Patch(':id')
  @RequireFeature('ecommerce')
  @AuditLog({ action: 'PRODUCT_UPDATED', entityType: 'product' })
  async update(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() body: UpdateProductDto
  ) {
    const tenantId = req.user.tenantId;
    const { schemaName, subdomain } = this.getRequiredContext(req);

    const { version, basePrice, salePrice, ...updateData } = body;

    const mappedData: Partial<InferInsertModel<typeof productsInStorefront>> = {
      ...updateData,
    };

    if (body.basePrice) mappedData.basePrice = String(body.basePrice);
    if (body.salePrice) mappedData.salePrice = String(body.salePrice);
    if (body.nameAr || body.nameEn) {
      mappedData.name = { ar: body.nameAr || '', en: body.nameEn || '' };
    }

    const { db, release } = await getTenantDb(tenantId, schemaName);
    try {
      const [product] = await db
        .update(productsInStorefront)
        .set({ ...mappedData, version: version + 1 })
        .where(
          and(
            eq(productsInStorefront.id, id),
            eq(productsInStorefront.version, version)
          )
        )
        .returning();

      await this.syncCache(subdomain);

      return { success: true, data: product };
    } finally {
      release();
    }
  }

  @Delete(':id')
  @RequireFeature('ecommerce')
  @AuditLog({ action: 'PRODUCT_DELETED', entityType: 'product' })
  async remove(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    const tenantId = req.user.tenantId;
    const { schemaName, subdomain } = this.getRequiredContext(req);

    const { db, release } = await getTenantDb(tenantId, schemaName);
    try {
      await db
        .update(productsInStorefront)
        .set({ isActive: false, deletedAt: new Date().toISOString() })
        .where(eq(productsInStorefront.id, id));

      await this.syncCache(subdomain);

      // 🚛 Mandate 2: Physical Prefix Garbage Collection (List + Batch Delete)
      await deletePrefix(subdomain, `public/products/${id}`);

      return { success: true };
    } finally {
      release();
    }
  }

  private getRequiredContext(req: AuthenticatedRequest) {
    const context = req.tenantContext;
    if (!context || !context.schemaName || !context.subdomain) {
      throw new InternalServerErrorException('Tenant context is missing');
    }
    return context;
  }
}
