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
  type TenantCacheService,
} from '@apex/middleware';
import {
  CopyObjectCommand,
  DeleteObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
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
    const tenantId = req.user?.tenantId;
    const schemaName = req.tenantContext?.schemaName;

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
    const schemaName = req.tenantContext?.schemaName;
    const subdomain = req.tenantContext?.subdomain;

    const b = body as any;
    const productData: InferInsertModel<typeof productsInStorefront> = {
      ...b,
      name: { ar: b.nameAr, en: b.nameEn },
      shortDescription: { ar: b.shortDescriptionAr, en: b.shortDescriptionEn },
      longDescription: { ar: b.descriptionAr, en: b.descriptionEn },
      taxBasisPoints: Math.round((b.taxPercentage || 0) * 100),
      basePrice: String(b.basePrice),
      salePrice: b.salePrice ? String(b.salePrice) : null,
    };

    const { db, release } = await getTenantDb(tenantId, schemaName);
    try {
      // 1. Drizzle Insert เพื่อสร้าง productId
      const [product] = await db
        .insert(productsInStorefront)
        .values(productData)
        .returning();

      // 2. Asset Migration Engine: Move from temp/ to public/products/{productId}
      const migratedUrls = await this.migrateMedia(
        subdomain,
        product.id,
        b.mainImage,
        b.galleryImages || []
      );

      // 3. Update DB with final URLs
      await db
        .update(productsInStorefront)
        .set({
          mainImage: migratedUrls.mainImage,
          galleryImages: migratedUrls.galleryImages,
        })
        .where(eq(productsInStorefront.id, product.id));

      // 4. Cache Sync & ISR Revalidation
      await this.syncCache(subdomain);

      return {
        success: true,
        data: { ...product, ...migratedUrls },
      };
    } catch (error) {
      this.logger.error(`PRODUCT_CREATE_ERROR: ${(error as any).message}`);
      throw new InternalServerErrorException(
        'Failed to create product and migrate assets'
      );
    } finally {
      release();
    }
  }

  /**
   * 🛡️ Server-side "Copy & Delete" Migration Engine
   */
  private async migrateMedia(
    subdomain: string,
    productId: string,
    mainImageUrl: string,
    galleryImages: any[]
  ) {
    const s3Client = new S3Client({
      endpoint: env.MINIO_ENDPOINT || 'http://apex-minio:9000',
      region: env.MINIO_REGION || 'us-east-1',
      credentials: {
        accessKeyId: env.MINIO_ACCESS_KEY || '',
        secretAccessKey: env.MINIO_SECRET_KEY || '',
      },
      forcePathStyle: true,
    });

    const bucketName = `tenant-${subdomain.toLowerCase()}-assets`;

    const migrate = async (url: string) => {
      if (!url.includes('/temp/products/')) return url;

      try {
        const urlObj = new URL(url);
        const sourceKey = urlObj.pathname.split(`${bucketName}/`)[1];
        const fileName = sourceKey.split('/').pop();
        const targetKey = `public/products/${productId}/${fileName}`;

        // 🚛 Move operation
        await s3Client.send(
          new CopyObjectCommand({
            Bucket: bucketName,
            CopySource: `${bucketName}/${sourceKey}`,
            Key: targetKey,
          })
        );
        await s3Client.send(
          new DeleteObjectCommand({
            Bucket: bucketName,
            Key: sourceKey,
          })
        );

        return `${env.STORAGE_PUBLIC_URL}/${bucketName}/${targetKey}`;
      } catch (_err) {
        this.logger.warn(`MEDIA_MIGRATION_SKIP: ${url}`);
        return url;
      }
    };

    const newMainImage = await migrate(mainImageUrl);
    const newGallery = await Promise.all(
      galleryImages.map(async (img: any) => ({
        ...img,
        url: await migrate(img.url),
      }))
    );

    return { mainImage: newMainImage, galleryImages: newGallery };
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
      this.logger.warn(`CACHE_SYNC_ERROR: ${(err as any).message}`);
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
    const schemaName = req.tenantContext?.schemaName;
    const subdomain = req.tenantContext?.subdomain;

    const b = body as any;
    const { version, ...updateData } = b;

    const mappedData: Partial<InferInsertModel<typeof productsInStorefront>> = {
      ...updateData,
    };

    if (b.basePrice) mappedData.basePrice = String(b.basePrice);
    if (b.salePrice) mappedData.salePrice = String(b.salePrice);
    if (b.nameAr || b.nameEn) {
      mappedData.name = { ar: b.nameAr || '', en: b.nameEn || '' };
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
    const schemaName = req.tenantContext?.schemaName;
    const subdomain = req.tenantContext?.subdomain;

    const { db, release } = await getTenantDb(tenantId, schemaName);
    try {
      await db
        .update(productsInStorefront)
        .set({ isActive: false, deletedAt: new Date().toISOString() })
        .where(eq(productsInStorefront.id, id));

      await this.syncCache(subdomain);

      // 🚛 Delete physical folder
      // (Implementation for prefix deletion would go here)

      return { success: true };
    } finally {
      release();
    }
  }
}
