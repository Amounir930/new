import { AuditLog } from '@apex/audit';
import { type AuthenticatedRequest, JwtAuthGuard } from '@apex/auth';
import { and, eq, getTenantDb, productsInStorefront } from '@apex/db';
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
    const productData = {
      ...body,
      name: { ar: body.nameAr, en: body.nameEn },
      description: { ar: body.descriptionAr, en: body.descriptionEn },
      tenantId,
    };

    const { db, release } = await getTenantDb(tenantId);
    try {
      const [product] = await db
        .insert(productsInStorefront)
        .values(productData as any)
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
    const mappedData: any = { ...updateData };
    if (body.nameAr || body.nameEn) {
      mappedData.name = { ar: body.nameAr, en: body.nameEn };
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
