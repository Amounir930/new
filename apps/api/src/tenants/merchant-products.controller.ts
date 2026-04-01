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
  type InferInsertModel,
  isNull,
  productsInStorefront,
} from '@apex/db';
import {
  CheckQuota,
  QuotaInterceptor,
  RequireFeature,
  requireExecutor,
  TenantCacheService,
  TenantSessionInterceptor,
} from '@apex/middleware';
import { deletePrefix, migrateProductMedia } from '@apex/provisioning';
import { S3Client } from '@aws-sdk/client-s3';
import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  Param,
  Patch,
  Post,
  Put,
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
export class MerchantProductsController {
  private readonly logger = new Logger(MerchantProductsController.name);

  constructor(
    @Inject('TENANT_CACHE_SERVICE')
    readonly _tenantCache: TenantCacheService
  ) {}

  // ══════════════════════════════════════════════════════════
  // GET /merchant/products — list all active products
  // ══════════════════════════════════════════════════════════
  @Get()
  @RequireFeature('ecommerce')
  async findAll(@Req() req: AuthenticatedRequest) {
    const db = requireExecutor();
    return db
      .select()
      .from(productsInStorefront)
      .where(isNull(productsInStorefront.deletedAt));
  }

  // ══════════════════════════════════════════════════════════
  // GET /merchant/products/:id — fetch single product for edit
  // ══════════════════════════════════════════════════════════
  @Get(':id(uuid)')
  @RequireFeature('ecommerce')
  async findOne(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    const db = requireExecutor();
    const [product] = await db
      .select()
      .from(productsInStorefront)
      .where(
        and(
          eq(productsInStorefront.id, id),
          isNull(productsInStorefront.deletedAt)
        )
      )
      .limit(1);

    if (!product) throw new NotFoundException(`Product ${id} not found`);
    return product;
  }

  // ══════════════════════════════════════════════════════════
  // POST /merchant/products/draft — Draft Entity Pattern
  // Creates a minimal hidden row and returns the real product_id
  // so ALL subsequent media uploads land in public/products/{product_id}/
  // ══════════════════════════════════════════════════════════
  @Post('draft')
  @RequireFeature('ecommerce')
  @CheckQuota('products')
  async createDraft(@Req() req: AuthenticatedRequest) {
    const { subdomain } = this.getRequiredContext(req);
    const db = requireExecutor();

    // Minimal row — dummy values overwritten when merchant saves
    const tempSlug = `draft-${crypto.randomUUID()}`;
    const tempSku = `DRAFT-${crypto.randomUUID().substring(0, 8).toUpperCase()}`;

    const [draft] = await db
      .insert(productsInStorefront)
      .values({
        slug: tempSlug,
        sku: tempSku,
        niche: 'retail',
        name: { ar: '', en: '' },
        basePrice: '0',
        mainImage: '',
        isActive: false,
        isFeatured: false,
        isReturnable: true,
        requiresShipping: true,
        isDigital: false,
        trackInventory: true,
        minOrderQty: 1,
        lowStockThreshold: 5,
        taxBasisPoints: 0,
      } as InferInsertModel<typeof productsInStorefront>)
      .returning({ id: productsInStorefront.id });

    this.logger.log(`DRAFT_CREATED: ${draft.id} for tenant ${subdomain}`);
    return { id: draft.id };
  }

  // ══════════════════════════════════════════════════════════
  // PUT /merchant/products/:id — Publish Draft (or update existing)
  // Validates full schema and sets is_active = true
  // ══════════════════════════════════════════════════════════
  @Put(':id(uuid)')
  @RequireFeature('ecommerce')
  @AuditLog({ action: 'PRODUCT_CREATED', entityType: 'product' })
  async publishDraft(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() body: CreateProductDto
  ) {
    const { subdomain } = this.getRequiredContext(req);
    const db = requireExecutor();

    // Fetch the draft to confirm it exists and belongs to this tenant
    const [existing] = await db
      .select()
      .from(productsInStorefront)
      .where(
        and(
          eq(productsInStorefront.id, id),
          isNull(productsInStorefront.deletedAt)
        )
      )
      .limit(1);

    if (!existing) throw new NotFoundException(`Draft ${id} not found`);

    // 🛡️ Guard: SKU uniqueness check (excluding the draft itself)
    if (body.sku && body.sku !== existing.sku) {
      const skuConflict = await db
        .select({ id: productsInStorefront.id })
        .from(productsInStorefront)
        .where(eq(productsInStorefront.sku, body.sku))
        .limit(1);
      if (skuConflict.length > 0)
        throw new BadRequestException(`SKU ${body.sku} already exists`);
    }

    const {
      nameAr,
      nameEn,
      shortDescriptionAr,
      shortDescriptionEn,
      descriptionAr,
      descriptionEn,
      taxPercentage,
      basePrice,
      salePrice,
      costPrice,
      compareAtPrice,
      ...rem
    } = body;

    try {
      const [saved] = await db
        .update(productsInStorefront)
        .set({
          ...rem,
          // S3 Defense: normalize empty strings to null
          countryOfOrigin: rem.countryOfOrigin || null,
          barcode: rem.barcode || null,
          videoUrl: rem.videoUrl || null,
          digitalFileUrl: rem.digitalFileUrl || null,
          name: { ar: nameAr, en: nameEn },
          shortDescription: {
            ar: shortDescriptionAr || null,
            en: shortDescriptionEn || null,
          },
          longDescription: {
            ar: descriptionAr || null,
            en: descriptionEn || null,
          },
          taxBasisPoints: Math.round((taxPercentage || 0) * 100),
          basePrice: String(basePrice),
          salePrice: salePrice ? String(salePrice) : null,
          costPrice: costPrice ? String(costPrice) : null,
          compareAtPrice: compareAtPrice ? String(compareAtPrice) : null,
          isActive: true, // ← Promotes draft → live product
          publishedAt: new Date().toISOString(),
          updatedAt: new Date(),
        })
        .where(eq(productsInStorefront.id, id))
        .returning();

      await this.syncCache(subdomain);
      return { success: true, data: saved };
    } catch (error) {
      const pgErr = error as Record<string, unknown>;
      if (pgErr?.['code'] === '23514') {
        throw new BadRequestException(
          'Invalid product data: Check barcode format'
        );
      }
      throw error;
    }
  }

  // ══════════════════════════════════════════════════════════
  // POST /merchant/products — Legacy create (kept for backwards compat)
  // ══════════════════════════════════════════════════════════
  @Post()
  @RequireFeature('ecommerce')
  @CheckQuota('products')
  @AuditLog({ action: 'PRODUCT_CREATED', entityType: 'product' })
  async create(
    @Req() req: AuthenticatedRequest,
    @Body() body: CreateProductDto
  ) {
    const { subdomain } = this.getRequiredContext(req);

    const {
      nameAr,
      nameEn,
      shortDescriptionAr,
      shortDescriptionEn,
      descriptionAr,
      descriptionEn,
      taxPercentage,
      basePrice,
      salePrice,
      costPrice,
      compareAtPrice,
      ...rem
    } = body;

    const productData: InferInsertModel<typeof productsInStorefront> = {
      ...rem,
      countryOfOrigin: rem.countryOfOrigin || null,
      barcode: rem.barcode || null,
      videoUrl: rem.videoUrl || null,
      digitalFileUrl: rem.digitalFileUrl || null,
      name: { ar: nameAr, en: nameEn },
      shortDescription: {
        ar: shortDescriptionAr || null,
        en: shortDescriptionEn || null,
      },
      longDescription: { ar: descriptionAr || null, en: descriptionEn || null },
      taxBasisPoints: Math.round((taxPercentage || 0) * 100),
      basePrice: String(basePrice),
      salePrice: salePrice ? String(salePrice) : null,
      costPrice: costPrice ? String(costPrice) : null,
      compareAtPrice: compareAtPrice ? String(compareAtPrice) : null,
    };

    const db = requireExecutor();

    try {
      if (!body.sku) throw new BadRequestException('SKU is mandatory');
      const existing = await db
        .select()
        .from(productsInStorefront)
        .where(eq(productsInStorefront.sku, body.sku))
        .limit(1);
      if (existing.length > 0)
        throw new BadRequestException(`SKU ${body.sku} already exists`);

      const [product] = await db
        .insert(productsInStorefront)
        .values(productData)
        .returning();

      await this.syncCache(subdomain);
      return { success: true, data: product };
    } catch (error) {
      const pgErr = error as Record<string, unknown>;

      if (pgErr?.['code'] === '23514') {
        throw new BadRequestException(
          'Invalid product data: Check barcode format'
        );
      }

      this.logger.error(
        `PRODUCT_CREATE_FAILURE: ${JSON.stringify({
          message: pgErr['message'],
          code: pgErr['code'],
          detail: pgErr['detail'],
          constraint: pgErr['constraint'],
          cause: (pgErr['cause'] as Record<string, unknown>)?.['message'],
        })}`
      );
      throw error instanceof BadRequestException
        ? error
        : new InternalServerErrorException('Failed to create product.');
    }
  }

  // ══════════════════════════════════════════════════════════
  // PATCH /merchant/products/:id — Full edit update
  // Accepts flat form fields, transforms to JSONB before DB write.
  // Uses optimistic concurrency locking via `version`.
  // ══════════════════════════════════════════════════════════
  @Patch(':id(uuid)')
  @RequireFeature('ecommerce')
  @AuditLog({ action: 'PRODUCT_UPDATED', entityType: 'product' })
  async update(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() body: UpdateProductDto
  ) {
    const { subdomain } = this.getRequiredContext(req);

    const {
      version,
      nameAr,
      nameEn,
      shortDescriptionAr,
      shortDescriptionEn,
      descriptionAr,
      descriptionEn,
      taxPercentage,
      basePrice,
      salePrice,
      costPrice,
      compareAtPrice,
      dimHeight,
      dimWidth,
      dimLength, // ← extract flat dims; NEVER pass to Drizzle directly
      ...updateData
    } = body;

    const mappedData: Partial<InferInsertModel<typeof productsInStorefront>> = {
      ...updateData,
      // S3 Defense: normalize empty strings → null
      barcode: (updateData.barcode || null) as string | null,
      countryOfOrigin: (updateData.countryOfOrigin || null) as string | null,
      videoUrl: (updateData.videoUrl || null) as string | null,
      digitalFileUrl: (updateData.digitalFileUrl || null) as string | null,
      updatedAt: new Date().toISOString(),
    };

    if (basePrice !== undefined) mappedData.basePrice = String(basePrice);
    if (salePrice !== undefined)
      mappedData.salePrice = salePrice ? String(salePrice) : null;
    if (costPrice !== undefined)
      mappedData.costPrice = costPrice ? String(costPrice) : null;
    if (compareAtPrice !== undefined)
      mappedData.compareAtPrice = compareAtPrice
        ? String(compareAtPrice)
        : null;
    if (taxPercentage !== undefined)
      mappedData.taxBasisPoints = Math.round(taxPercentage * 100);

    // JSONB: name — always update both languages together
    if (nameAr !== undefined || nameEn !== undefined) {
      mappedData.name = { ar: nameAr ?? '', en: nameEn ?? '' };
    }
    if (shortDescriptionAr !== undefined || shortDescriptionEn !== undefined) {
      mappedData.shortDescription = {
        ar: shortDescriptionAr ?? null,
        en: shortDescriptionEn ?? null,
      };
    }
    if (descriptionAr !== undefined || descriptionEn !== undefined) {
      mappedData.longDescription = {
        ar: descriptionAr ?? null,
        en: descriptionEn ?? null,
      };
    }

    // JSONB: reassemble flat dim fields → dimensions column
    if (
      dimHeight !== undefined ||
      dimWidth !== undefined ||
      dimLength !== undefined
    ) {
      mappedData.dimensions = {
        h: dimHeight ?? 0,
        w: dimWidth ?? 0,
        l: dimLength ?? 0,
      };
    }

    const db = requireExecutor();

    try {
      const [product] = await db
        .update(productsInStorefront)
        .set({ ...mappedData, version: (version ?? 0) + 1 })
        .where(
          and(
            eq(productsInStorefront.id, id),
            isNull(productsInStorefront.deletedAt),
            ...(version !== undefined
              ? [eq(productsInStorefront.version, version)]
              : [])
          )
        )
        .returning();

      if (!product) {
        // Optimistic lock miss — product updated concurrently
        throw new BadRequestException(
          'Product was modified by another session. Please refresh and try again.'
        );
      }

      await this.syncCache(subdomain);
      return { success: true, data: product };
    } catch (error) {
      const pgErr = error as Record<string, unknown>;
      if (pgErr?.['code'] === '23514') {
        throw new BadRequestException(
          'Invalid product data: Check barcode format (8–50 alphanumeric characters)'
        );
      }
      throw error instanceof BadRequestException
        ? error
        : new InternalServerErrorException('Failed to update product.');
    }
  }

  // ══════════════════════════════════════════════════════════
  // DELETE /merchant/products/:id — Conditional Delete
  //
  // DRAFT   (is_active=false, never published):
  //   → HARD DELETE from DB + MinIO wipe
  //   Rationale: draft has no orders, can be fully erased
  //
  // PUBLISHED / INACTIVE (is_active=true OR published_at IS NOT NULL):
  //   → SOFT DELETE (deleted_at = NOW())
  //   → MinIO untouched (images needed for order history & invoices)
  // ══════════════════════════════════════════════════════════
  @Delete(':id(uuid)')
  @RequireFeature('ecommerce')
  @AuditLog({ action: 'PRODUCT_DELETED', entityType: 'product' })
  async remove(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    const { subdomain } = this.getRequiredContext(req);
    const db = requireExecutor();

    const [product] = await db
      .select()
      .from(productsInStorefront)
      .where(
        and(
          eq(productsInStorefront.id, id),
          isNull(productsInStorefront.deletedAt)
        )
      )
      .limit(1);

    if (!product) throw new NotFoundException(`Product ${id} not found`);

    const isDraft = !product.isActive && !product.publishedAt;

    if (isDraft) {
      // 🗑️ HARD DELETE: Draft was never published — safe to fully erase
      await db
        .delete(productsInStorefront)
        .where(eq(productsInStorefront.id, id));

      // Wipe MinIO folder (no URL parsing — product_id IS the folder name)
      await deletePrefix(subdomain, `public/products/${id}`);

      this.logger.log(`DRAFT_HARD_DELETED: ${id}`);
    } else {
      // 🗑️ SOFT DELETE: Published product — preserve for order history
      await db
        .update(productsInStorefront)
        .set({ isActive: false, deletedAt: new Date().toISOString() })
        .where(eq(productsInStorefront.id, id));

      // 🛡️ MinIO intentionally untouched — images needed for past invoices
      this.logger.log(
        `PRODUCT_SOFT_DELETED: ${id} (images preserved for order history)`
      );
    }

    await this.syncCache(subdomain);
    return { success: true, isDraft };
  }

  // ══════════════════════════════════════════════════════════
  // Private: Cache sync + ISR revalidation
  // ══════════════════════════════════════════════════════════
  private async syncCache(subdomain: string) {
    try {
      const { createClient } = require('redis');
      const client = createClient({ url: env.REDIS_URL });
      await client.connect();
      await client.del(`storefront:products:${subdomain}`);
      await client.del(`storefront:bootstrap:${subdomain}`);
      await client.disconnect();

      await fetch(`http://store:3002/api/revalidate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-internal-secret': env.INTERNAL_API_SECRET || '',
        },
        body: JSON.stringify({ tags: [`tenant-${subdomain.toLowerCase()}`] }),
      });
    } catch (err) {
      this.logger.warn(
        `CACHE_SYNC_ERROR: ${err instanceof Error ? err.message : String(err)}`
      );
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
