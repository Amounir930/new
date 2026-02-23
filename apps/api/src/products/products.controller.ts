import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
// biome-ignore lint/style/useImportType: Dependency Injection requires value import (S1-S15 Compliance)
import { AuditLog } from '@apex/audit';
import { JwtAuthGuard } from '@apex/auth';
import { ProductsService } from '@apex/db';
import {
  GovernanceGuard,
  RequireFeature,
  CheckQuota,
  QuotaInterceptor,
} from '@apex/middleware';
import { CreateProductDto, UpdateProductDto } from './dto/create-product.dto';

@Controller('products')
@UseGuards(JwtAuthGuard, GovernanceGuard)
@UseInterceptors(QuotaInterceptor)
export class ProductsController {
  constructor(private readonly products: ProductsService) { }

  @Get()
  @RequireFeature('ecommerce')
  findAll() {
    return this.products.findAll();
  }

  @Post()
  @RequireFeature('ecommerce')
  @CheckQuota('products')
  @AuditLog({ action: 'PRODUCT_CREATED', entityType: 'product' })
  async create(@Body() body: CreateProductDto) {
    const product = await this.products.create(body as any);
    return {
      success: true,
      message: 'Product created successfully',
      data: product
    };
  }

  @Patch(':id')
  @RequireFeature('ecommerce')
  @AuditLog({ action: 'PRODUCT_UPDATED', entityType: 'product' })
  async update(@Param('id') id: string, @Body() body: UpdateProductDto) {
    const product = await this.products.update(id, body as any);
    return {
      success: true,
      message: 'Product updated successfully',
      data: product
    };
  }

  @Delete(':id')
  @RequireFeature('ecommerce')
  @AuditLog({ action: 'PRODUCT_DELETED', entityType: 'product' })
  async remove(@Param('id') id: string) {
    await this.products.delete(id);
    return {
      success: true,
      message: 'Product deleted successfully'
    };
  }
}
