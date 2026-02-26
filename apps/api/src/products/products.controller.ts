import { AuditLog } from '@apex/audit';
import { type AuthenticatedRequest, JwtAuthGuard } from '@apex/auth';
// biome-ignore lint/style/useImportType: DI
import { ProductsService } from '@apex/db';
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
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  @RequireFeature('ecommerce')
  async findAll(@Req() req: AuthenticatedRequest) {
    return this.productsService.findAll(req.user.tenantId!);
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

    const product = await this.productsService.create(
      tenantId,
      productData as any
    );
    return {
      success: true,
      data: product,
    };
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

    const product = await this.productsService.update(
      tenantId,
      id,
      version,
      mappedData
    );
    return {
      success: true,
      data: product,
    };
  }

  @Delete(':id')
  @RequireFeature('ecommerce')
  @AuditLog({ action: 'PRODUCT_DELETED', entityType: 'product' })
  async remove(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    await this.productsService.delete(req.user.tenantId!, id);
    return {
      success: true,
      message: 'Product deleted successfully',
    };
  }
}
