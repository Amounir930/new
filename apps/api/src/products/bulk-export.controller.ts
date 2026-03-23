import { AuditLog } from '@apex/audit';
import type { AuthenticatedRequest } from '@apex/auth';
import { JwtAuthGuard, TenantJwtMatchGuard } from '@apex/auth';
import {
  type InferSelectModel,
  productsInStorefront,
} from '@apex/db';
import { requireExecutor } from '@apex/middleware';
import { Controller, Get, Logger, Req, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { Parser } from 'json2csv';

@Controller('merchant/products/export')
@UseGuards(JwtAuthGuard, TenantJwtMatchGuard)
export class BulkExportController {
  private readonly logger = new Logger(BulkExportController.name);

  @Get()
  @AuditLog({ action: 'PRODUCT_BULK_EXPORT', entityType: 'product' })
  async exportProducts(@Req() req: AuthenticatedRequest, @Res() res: Response) {
    const db = requireExecutor();
    let allProducts: InferSelectModel<typeof productsInStorefront>[];
    try {
      allProducts = await db.select().from(productsInStorefront);
    } catch (e) {
      this.logger.error('Database query FAILED:', e);
      return res.status(500).send('Database error');
    }

    const fields = [
      'id',
      'name',
      'slug',
      'price',
      'compareAtPrice',
      'isFeatured',
      'isActive',
    ];
    const opts = { fields };

    try {
      const parser = new Parser(opts);
      const csv = parser.parse(allProducts);

      res.header('Content-Type', 'text/csv');
      res.attachment(
        `products-export-${new Date().toISOString().split('T')[0]}.csv`
      );
      return res.send(csv);
    } catch (err) {
      this.logger.error('Export generation FAILED:', err);
      return res.status(500).send('Error generating export');
    }
  }
}
