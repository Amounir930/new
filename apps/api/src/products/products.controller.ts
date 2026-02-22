import {
  Body,
  Controller,
  Inject,
  Post,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ZodValidationPipe } from 'nestjs-zod';
import { z } from 'zod';
// biome-ignore lint/style/useImportType: Dependency Injection requires value import (S1-S15 Compliance)
import { AuditLog, AuditService } from '@apex/audit';
import { JwtAuthGuard } from '@apex/auth';
import {
  GovernanceGuard,
  RequireFeature,
  CheckQuota,
  QuotaInterceptor,
} from '@apex/middleware';

const CreateProductSchema = z.object({
  name: z.string().min(1),
  price: z.number().min(0).optional(),
});

@Controller('products')
@UseGuards(JwtAuthGuard, GovernanceGuard)
@UseInterceptors(QuotaInterceptor)
export class ProductsController {
  constructor(
    @Inject('AUDIT_SERVICE')
    private readonly audit: AuditService
  ) { }

  @Post()
  @RequireFeature('ecommerce')
  @CheckQuota('products')
  @AuditLog({ action: 'PRODUCT_CREATED', entityType: 'product' })
  create(@Body(new ZodValidationPipe(CreateProductSchema)) _body: any) {
    return { success: true, message: 'Product created successfully' };
  }
}
