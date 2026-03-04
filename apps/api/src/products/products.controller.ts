import { AuditLog } from '@apex/audit';
import { type AuthenticatedRequest, JwtAuthGuard } from '@apex/auth';
import {
  and,
  eq,
  getTenantDb,
  type InferInsertModel,
  productsInStorefront,
} from '@apex/db';
import {
  CheckQuota,
  GovernanceGuard,
  QuotaInterceptor,
  RequireFeature,
} from '@apex/middleware';
import {
  Body,
  Controller,
  Delete,
  Get,
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
} from './dto/create-product.dto';

@Controller('products')
@UseGuards(JwtAuthGuard, GovernanceGuard)
@UseInterceptors(QuotaInterceptor)
export class ProductsController {
  @Get()
  @RequireFeature('ecommerce')
  async findAll(@Req() req: AuthenticatedRequest) {
    const { db, release } = await getTenantDb(req.user.tenantId!);
    try {
      return await db.select().from(productsInStorefront);
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
    const tenantId = req.user.tenantId!;
    // Map DTO to localized schema
    const productData: InferInsertModel<typeof productsInStorefront> = {
      ...body,
      name: { ar: body.nameAr, en: body.nameEn },
      shortDescription: {
        ar: body.shortDescriptionAr,
        en: body.shortDescriptionEn,
      },
      longDescription: { ar: body.descriptionAr, en: body.descriptionEn },
      taxBasisPoints: Math.round((body.taxPercentage || 0) * 100),
      tenantId,
      basePrice: String(body.basePrice),
      salePrice: body.salePrice ? String(body.salePrice) : null,
    };

    const { db, release } = await getTenantDb(tenantId);
    try {
      const [product] = await db
        .insert(productsInStorefront)
        .values(productData)
        .returning();

      return {
        success: true,
        data: product,
      };
    } finally {
      release();
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
    const tenantId = req.user.tenantId!;
    const { version, ...updateData } = body;

    // Map localized fields if present
    const mappedData: Partial<InferInsertModel<typeof productsInStorefront>> = {
      ...updateData,
      basePrice: updateData.basePrice ? String(updateData.basePrice) : undefined,
      salePrice: updateData.salePrice ? String(updateData.salePrice) : undefined,
    };
    if (body.nameAr || body.nameEn) {
      mappedData.name = { ar: body.nameAr || '', en: body.nameEn || '' };
    }

    const { db, release } = await getTenantDb(tenantId);
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

      return {
        success: true,
        data: product,
      };
    } finally {
      release();
    }
  }

  @Delete(':id')
  @RequireFeature('ecommerce')
  @AuditLog({ action: 'PRODUCT_DELETED', entityType: 'product' })
  async remove(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    const { db, release } = await getTenantDb(req.user.tenantId!);
    try {
      await db
        .update(productsInStorefront)
        .set({ isActive: false })
        .where(eq(productsInStorefront.id, id));

      return {
        success: true,
        message: 'Product deleted successfully',
      };
    } finally {
      release();
    }
  }
}
