import { Controller, Get, Res } from '@nestjs/common';
import type { Response } from 'express';
import { db, products } from '@apex/db';
import { AuditLog } from '@apex/audit';
import { Parser } from 'json2csv';

import { JwtAuthGuard, TenantJwtMatchGuard } from '@apex/auth';
import { UseGuards } from '@nestjs/common';

@Controller('admin/products/export')
@UseGuards(JwtAuthGuard, TenantJwtMatchGuard)
export class BulkExportController {

    @Get()
    @AuditLog({ action: 'PRODUCT_BULK_EXPORT', entityType: 'product' })
    async exportProducts(@Res() res: Response) {
        const allProducts = await db.select().from(products);

        const fields = ['id', 'name', 'slug', 'price', 'compareAtPrice', 'isFeatured', 'isActive'];
        const opts = { fields };

        try {
            const parser = new Parser(opts);
            const csv = parser.parse(allProducts);

            res.header('Content-Type', 'text/csv');
            res.attachment(`products-export-${new Date().toISOString().split('T')[0]}.csv`);
            return res.send(csv);
        } catch (err) {
            console.error(err);
            return res.status(500).send('Error generating export');
        }
    }
}
