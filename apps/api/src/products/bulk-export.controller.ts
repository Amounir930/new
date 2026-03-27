import { AuditLog } from '@apex/audit';
import type { AuthenticatedRequest } from '@apex/auth';
import { JwtAuthGuard, TenantJwtMatchGuard } from '@apex/auth';
import { productsInStorefront } from '@apex/db';
import { requireExecutor } from '@apex/middleware';
import { Controller, Get, Logger, Req, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { Parser } from 'json2csv';
import { sanitizeCsvRecord } from './csv-sanitizer';

/** MVP hard cap — full cursor-based streaming deferred to Phase 4 */
const EXPORT_ROW_LIMIT = 10_000;

/** Scalar columns to export — JSONB blobs (attributes, gallery, etc.) excluded */
const EXPORT_FIELDS = [
  'id',
  'sku',
  'barcode',
  'slug',
  'niche',
  'basePrice',
  'salePrice',
  'costPrice',
  'compareAtPrice',
  'taxBasisPoints',
  'weight',
  'minOrderQty',
  'lowStockThreshold',
  'countryOfOrigin',
  'warrantyPeriod',
  'warrantyUnit',
  'isActive',
  'isFeatured',
  'isReturnable',
  'isDigital',
  'requiresShipping',
  'trackInventory',
  'mainImage',
  'metaTitle',
  'metaDescription',
  'keywords',
  'createdAt',
  'publishedAt',
] as const;

@Controller('merchant/products/export')
@UseGuards(JwtAuthGuard, TenantJwtMatchGuard)
export class BulkExportController {
  private readonly logger = new Logger(BulkExportController.name);

  @Get()
  @AuditLog({ action: 'PRODUCT_BULK_EXPORT', entityType: 'product' })
  async exportProducts(@Req() req: AuthenticatedRequest, @Res() res: Response) {
    const db = requireExecutor();

    // ── Fetch with hard MVP row limit (Veto 2 fix: no unbounded SELECT *) ──
    let rawProducts: Record<string, unknown>[];
    try {
      rawProducts = (await db
        .select()
        .from(productsInStorefront)
        .limit(EXPORT_ROW_LIMIT)) as Record<string, unknown>[];
    } catch (e) {
      this.logger.error('[BulkExport] Database query FAILED:', e);
      return res.status(500).send('Database error');
    }

    // ── S14 FIX 4B: Sanitize all rows before CSV serialization (Veto 1 fix) ──
    // Prevents CSV formula injection: =cmd|'/C calc'!A0
    const sanitizedProducts = rawProducts.map((row) => sanitizeCsvRecord(row));

    // ── Serialize to CSV ────────────────────────────────────────────────────
    try {
      const parser = new Parser({ fields: [...EXPORT_FIELDS] });
      const csv = parser.parse(sanitizedProducts);

      const filename = `products-export-${new Date().toISOString().split('T')[0]}.csv`;
      const rowCount = rawProducts.length;

      this.logger.log(
        `[BulkExport] tenant=${req.user?.tenantId} rows=${rowCount} file=${filename}`
      );

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

      // Signal to the client that the export was capped at the MVP limit
      if (rowCount === EXPORT_ROW_LIMIT) {
        res.setHeader('X-Export-Capped', 'true');
        res.setHeader('X-Export-Limit', String(EXPORT_ROW_LIMIT));
      }

      return res.send(csv);
    } catch (err) {
      this.logger.error('[BulkExport] CSV generation FAILED:', err);
      return res.status(500).send('Error generating export');
    }
  }
}
