import { AuditLog } from '@apex/audit';
import { JwtAuthGuard, TenantJwtMatchGuard } from '@apex/auth';
import { getTenantDb, productsInStorefront } from '@apex/db';
import { Controller, Get, Req, Res, UseGuards } from '@nestjs/common';
import type { Request, Response } from 'express';
import { Parser } from 'json2csv';

@Controller('admin/products/export')
@UseGuards(JwtAuthGuard, TenantJwtMatchGuard)
export class BulkExportController {
  @Get()
  @AuditLog({ action: 'PRODUCT_BULK_EXPORT', entityType: 'product' })
  async exportProducts(
    @Req() req: Request & { user?: any },
    @Res() res: Response
  ) {
    const tenantId = req.user?.tenantId;
    if (!tenantId) {
      return res.status(401).send('Unauthorized');
    }

    const { db, release } = await getTenantDb(tenantId);
    let allProducts: any[];
    try {
      allProducts = await db.select().from(productsInStorefront);
    } finally {
      release();
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
      console.error(err);
      return res.status(500).send('Error generating export');
    }
  }
}
