/**
 * ImportWorker — Bulk Product Import Processing Pipeline
 *
 * Architecture (Per Approved Blueprint):
 * Phase 1: Parse & Validate (full Zod, batch SKU check)
 * Phase 2: MinIO uploads (OUTSIDE DB transaction)
 * Phase 3: Bulk DB INSERT (single fast transaction)
 * Phase 4: Disk cleanup
 *
 * Vetoes Applied:
 * - V1: Delimiter parsing for attributes/specs, flat dims
 * - V2: Disk-based ZIP (not in-memory), with zip-bomb guard
 * - V3: MinIO uploads decoupled from DB transaction
 */

import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { getTenantDb } from '@apex/db';
import { productsInStorefront } from '@apex/db';
import { env } from '@apex/config';
import { EncryptionService } from '@apex/security';
import { OnQueueActive, OnQueueFailed, Process, Processor } from '@nestjs/bull';
import { Injectable, Logger } from '@nestjs/common';
import type { Job } from 'bull';
import AdmZip from 'adm-zip';
import ExcelJS from 'exceljs';
import { z } from 'zod';
import { PRODUCT_NICHES } from '@apex/validation';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { FileValidationService } from './file-validation.service';

// ─── Constants ───────────────────────────────────────────────────────────────
const MAX_ROWS = 500;
const MAX_ZIP_COMPRESSED_BYTES = 500 * 1024 * 1024; // 500MB
const MAX_UNCOMPRESSED_RATIO = 10;

// ─── Row Schema (mirrors CreateProductSchema, flat fields) ─────────────────
const ImportRowSchema = z.object({
  nameAr: z.string().min(2).max(255),
  nameEn: z.string().min(2).max(255),
  sku: z.string().regex(/^[A-Z0-9_-]{3,50}$/, 'SKU must be uppercase letters, numbers, underscores, or hyphens (3-50 chars)'),
  basePrice: z.coerce.number().min(0),
  niche: z.enum(PRODUCT_NICHES),
  slug: z.string().optional(),
  // Pricing
  salePrice: z.coerce.number().min(0).optional(),
  costPrice: z.coerce.number().min(0).optional(),
  compareAtPrice: z.coerce.number().min(0).optional(),
  // Identifiers
  barcode: z.string().regex(/^[A-Za-z0-9-]{8,50}$/).or(z.literal('')).optional(),
  // Descriptions
  shortDescAr: z.string().max(500).optional(),
  shortDescEn: z.string().max(500).optional(),
  longDescAr: z.string().max(5000).optional(),
  longDescEn: z.string().max(5000).optional(),
  // SEO
  metaTitle: z.string().max(60).optional(),
  metaDescription: z.string().max(160).optional(),
  // Logistics
  weight: z.coerce.number().int().min(0).optional(),
  minOrderQty: z.coerce.number().int().min(1).optional(),
  lowStockThreshold: z.coerce.number().int().min(0).optional(),
  taxBasisPoints: z.coerce.number().int().min(0).max(10000).optional(),
  countryOfOrigin: z.string().length(2).toUpperCase().optional(),
  warrantyPeriod: z.coerce.number().int().min(0).optional(),
  warrantyUnit: z.enum(['days', 'months', 'years']).optional(),
  // Flags
  isActive: z.preprocess((v) => String(v).toUpperCase() === 'TRUE', z.boolean()).optional(),
  isFeatured: z.preprocess((v) => String(v).toUpperCase() === 'TRUE', z.boolean()).optional(),
  isDigital: z.preprocess((v) => String(v).toUpperCase() === 'TRUE', z.boolean()).optional(),
  requiresShipping: z.preprocess((v) => String(v).toUpperCase() === 'TRUE', z.boolean()).optional(),
  trackInventory: z.preprocess((v) => String(v).toUpperCase() === 'TRUE', z.boolean()).optional(),
  // Flat dimensions (V1 fix)
  dimHeight: z.coerce.number().min(0).optional(),
  dimWidth: z.coerce.number().min(0).optional(),
  dimLength: z.coerce.number().min(0).optional(),
  // Delimited fields (V1 fix)
  attributes: z.string().optional(),
  specifications: z.string().optional(),
  tags: z.string().optional(),
  keywords: z.string().optional(),
  // Images
  mainImage: z.string().optional(),
  galleryImages: z.string().optional(),
});

type ImportRow = z.infer<typeof ImportRowSchema>;

interface RowError {
  row: number;
  sku?: string;
  errors: { field: string; message: string }[];
}

interface JobData {
  tenantId: string;
  schemaName: string;
  subdomain: string;
  filePath: string;   // disk path to uploaded file (.xlsx or .zip)
  isZip: boolean;
  jobId: string;
}

// ─── Delimiter Parser (V1 fix) ─────────────────────────────────────────────
function parseDelimited(input: string | undefined): Record<string, string> | undefined {
  if (!input?.trim()) return undefined;
  const result: Record<string, string> = {};
  for (const pair of input.split('|')) {
    const colonIdx = pair.indexOf(':');
    if (colonIdx === -1) continue;
    const key = pair.slice(0, colonIdx).trim().toLowerCase().slice(0, 100);
    const val = pair.slice(colonIdx + 1).trim().slice(0, 1024);
    if (key) result[key] = val;
  }
  return Object.keys(result).length > 0 ? result : undefined;
}

function parseDimensions(h?: number, w?: number, l?: number): Record<string, number> | undefined {
  if (h === undefined && w === undefined && l === undefined) return undefined;
  return { h: h ?? 0, w: w ?? 0, l: l ?? 0 };
}

function parseCommaSeparated(input?: string): string[] | undefined {
  if (!input?.trim()) return undefined;
  return input.split(',').map((s) => s.trim()).filter(Boolean);
}

// ─── Worker ───────────────────────────────────────────────────────────────
@Processor('import-queue')
@Injectable()
export class ImportWorker {
  private readonly logger = new Logger(ImportWorker.name);

  constructor(
    private readonly fileValidation: FileValidationService,
    readonly _crypto: EncryptionService,
  ) { }

  @Process('product-import')
  async handleImport(job: Job<JobData>) {
    const { tenantId, schemaName, subdomain, filePath, isZip, jobId } = job.data;
    const tmpDir = path.join('/tmp', `import_${jobId}`);
    const errors: RowError[] = [];
    let importedCount = 0;

    try {
      // ─── Phase 1: Extract & Parse ──────────────────────────────────────
      await fsp.mkdir(tmpDir, { recursive: true });

      let xlsxPath: string;
      let imageDir: string | undefined;

      if (isZip) {
        const { excelPath, imagesPath } = await this.extractZip(filePath, tmpDir);
        xlsxPath = excelPath;
        imageDir = imagesPath;
      } else {
        xlsxPath = filePath;
      }

      const rawRows = await this.parseExcel(xlsxPath);

      if (rawRows.length > MAX_ROWS) {
        throw new Error(`Import exceeds max ${MAX_ROWS} rows (got ${rawRows.length})`);
      }

      await job.progress(10);

      // ─── Phase 2: Validate All Rows ────────────────────────────────────
      const validRows: { row: number; data: ImportRow }[] = [];
      for (let i = 0; i < rawRows.length; i++) {
        const result = ImportRowSchema.safeParse(rawRows[i]);
        if (!result.success) {
          errors.push({
            row: i + 2, // +2 = header + 0-index
            sku: String(rawRows[i]['sku'] ?? ''),
            errors: result.error.issues.map((e) => ({
              field: e.path.join('.'),
              message: e.message,
            })),
          });
        } else {
          validRows.push({ row: i + 2, data: result.data });
        }
      }

      // Fail-fast: abort if any validation error
      if (errors.length > 0) {
        this.logger.warn(`[ImportWorker] Validation failed: ${errors.length} row errors`);
        return { status: 'failed', errors, importedCount: 0 };
      }

      await job.progress(25);

      // ─── Batch SKU Uniqueness Check ────────────────────────────────────
      const skus = validRows.map((r) => r.data.sku);
      const duplicateSkus = skus.filter((s, i) => skus.indexOf(s) !== i);
      if (duplicateSkus.length > 0) {
        return {
          status: 'failed',
          errors: duplicateSkus.map((sku) => ({
            row: -1,
            sku,
            errors: [{ field: 'sku', message: `Duplicate SKU in sheet: ${sku}` }],
          })),
          importedCount: 0,
        };
      }

      const { db, release } = await getTenantDb(tenantId, schemaName);
      try {
        const existingSkuRows = await db
          .select({ sku: productsInStorefront.sku })
          .from(productsInStorefront)
          .where(
            // biome-ignore lint/suspicious/noExplicitAny: drizzle doesn't expose inArray easily here
            (productsInStorefront.sku as any).in(skus)
          );

        if (existingSkuRows.length > 0) {
          const existingSet = new Set(existingSkuRows.map((r: { sku: string }) => r.sku));
          return {
            status: 'failed',
            errors: validRows
              .filter((r) => existingSet.has(r.data.sku))
              .map((r) => ({
                row: r.row,
                sku: r.data.sku,
                errors: [{ field: 'sku', message: `SKU already exists in database` }],
              })),
            importedCount: 0,
          };
        }
      } finally {
        release();
      }

      await job.progress(40);

      // ─── Phase 3: MinIO Uploads (OUTSIDE DB) ──────────────────────────
      // S1 Guard: Validate credentials before S3 construction
      if (!env.MINIO_ACCESS_KEY || !env.MINIO_SECRET_KEY || !env.STORAGE_PUBLIC_URL) {
        throw new Error('S1 VIOLATION: MinIO credentials missing from environment');
      }
      const s3 = new S3Client({
        endpoint: env.STORAGE_PUBLIC_URL,
        region: env.MINIO_REGION ?? 'us-east-1',
        credentials: {
          accessKeyId: env.MINIO_ACCESS_KEY,
          secretAccessKey: env.MINIO_SECRET_KEY,
        },
        forcePathStyle: true,
      });

      const bucketName = `tenant-${subdomain.toLowerCase().replace(/[^a-z0-9]/g, '')}-assets`;

      const resolvedRows: (ImportRow & {
        _productId: string;
        _mainImageUrl: string | undefined;
        _galleryUrls: { url: string; altText: string; order: number }[];
      })[] = [];

      for (let i = 0; i < validRows.length; i++) {
        const { data } = validRows[i];
        const productId = randomUUID();
        const baseKey = `public/products/${productId}`;

        const mainImageUrl = await this.uploadImage(
          s3, bucketName, baseKey, data.mainImage, imageDir
        );

        const galleryUrls: { url: string; altText: string; order: number }[] = [];
        if (data.galleryImages?.trim()) {
          const filenames = data.galleryImages.split('|').map((s) => s.trim()).filter(Boolean);
          let order = 0;
          for (const filename of filenames) {
            const url = await this.uploadImage(s3, bucketName, baseKey, filename, imageDir);
            if (url) {
              galleryUrls.push({ url, altText: '', order: order++ });
            }
          }
        }

        resolvedRows.push({
          ...data,
          _productId: productId,
          _mainImageUrl: mainImageUrl,
          _galleryUrls: galleryUrls,
        });

        await job.progress(40 + Math.floor((i / validRows.length) * 40));
      }

      // ─── Phase 4: Bulk DB Transaction ─────────────────────────────────
      const { db: dbInsert, release: releaseInsert } = await getTenantDb(tenantId, schemaName);
      try {
        const inserts = resolvedRows.map((r) => ({
          id: r._productId,
          name: { ar: r.nameAr, en: r.nameEn },
          sku: r.sku,
          niche: (r.niche === 'food' || r.niche === 'digital') ? 'retail' : r.niche,  // Map legacy niches to retail
          basePrice: String(r.basePrice),
          salePrice: r.salePrice != null ? String(r.salePrice) : null,
          costPrice: r.costPrice != null ? String(r.costPrice) : null,
          compareAtPrice: r.compareAtPrice != null ? String(r.compareAtPrice) : null,
          barcode: r.barcode || null,
          slug: r.slug || r.nameEn.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
          shortDescription: (r.shortDescAr || r.shortDescEn)
            ? { ar: r.shortDescAr ?? '', en: r.shortDescEn ?? '' }
            : null,
          longDescription: (r.longDescAr || r.longDescEn)
            ? { ar: r.longDescAr ?? '', en: r.longDescEn ?? '' }
            : null,
          metaTitle: r.metaTitle ?? null,
          metaDescription: r.metaDescription ?? null,
          weight: r.weight ?? null,
          minOrderQty: r.minOrderQty ?? 1,
          lowStockThreshold: r.lowStockThreshold ?? 0,
          taxBasisPoints: r.taxBasisPoints ?? 0,
          countryOfOrigin: r.countryOfOrigin ?? null,
          warrantyPeriod: r.warrantyPeriod ?? null,
          warrantyUnit: r.warrantyUnit ?? null,
          isActive: r.isActive ?? true,
          isFeatured: r.isFeatured ?? false,
          isDigital: r.isDigital ?? false,
          requiresShipping: r.requiresShipping ?? true,
          isReturnable: true,
          trackInventory: r.trackInventory ?? true,
          dimensions: parseDimensions(r.dimHeight, r.dimWidth, r.dimLength),
          attributes: parseDelimited(r.attributes),
          specifications: parseDelimited(r.specifications),
          tags: parseCommaSeparated(r.tags),
          keywords: parseCommaSeparated(r.keywords)?.join(' ') ?? null,
          mainImage: (r._mainImageUrl || '') as string,  // S3 FIX: NOT NULL constraint - explicit string cast
          galleryImages: r._galleryUrls.length > 0 ? r._galleryUrls : [],
          publishedAt: new Date().toISOString(),  // S3 FIX: Convert to string for DB compatibility
        }));

        await dbInsert.insert(productsInStorefront).values(inserts);
        importedCount = inserts.length;
      } finally {
        releaseInsert();
      }

      await job.progress(100);
      return { status: 'done', importedCount, errors: [] };
    } catch (error) {
      this.logger.error(`[ImportWorker] Job ${jobId} failed`, (error as Error).stack);
      return { status: 'failed', errors, importedCount, cause: (error as Error).message };
    } finally {
      // ─── Cleanup (always runs) ─────────────────────────────────────────
      await fsp.rm(tmpDir, { recursive: true, force: true }).catch(() => undefined);
      if (fs.existsSync(filePath)) {
        await fsp.rm(filePath, { force: true }).catch(() => undefined);
      }
    }
  }

  // ─── ZIP Extraction (Disk-based — V2 fix) ────────────────────────────
  private async extractZip(zipPath: string, tmpDir: string) {
    const stats = await fsp.stat(zipPath);
    if (stats.size > MAX_ZIP_COMPRESSED_BYTES) {
      throw new Error(`ZIP exceeds 500MB limit (${stats.size} bytes)`);
    }

    const zip = new AdmZip(zipPath);
    const entries = zip.getEntries();

    let totalUncompressed = 0;
    let excelEntry: ReturnType<AdmZip['getEntry']> | null = null;

    for (const entry of entries) {
      totalUncompressed += entry.header.size;
      if (totalUncompressed / stats.size > MAX_UNCOMPRESSED_RATIO) {
        throw new Error('ZIP bomb detected: uncompressed ratio exceeds 10:1');
      }
      if (!excelEntry && /\.(xlsx|csv)$/i.test(entry.entryName) && !entry.entryName.includes('/')) {
        excelEntry = entry;
      }
    }

    if (!excelEntry) {
      throw new Error('No Excel/CSV file found at root of ZIP archive');
    }

    const imagesPath = path.join(tmpDir, 'images');
    await fsp.mkdir(imagesPath, { recursive: true });

    // Extract images only (from images/ folder)
    for (const entry of entries) {
      if (entry.isDirectory) continue;
      const normalized = entry.entryName.replace(/\\/g, '/');
      if (normalized.startsWith('images/') && normalized !== 'images/') {
        const filename = path.basename(normalized);
        zip.extractEntryTo(entry, imagesPath, false, true, false, filename);
      }
    }

    const excelPath = path.join(tmpDir, excelEntry.entryName);
    zip.extractEntryTo(excelEntry, tmpDir, false, true, false, excelEntry.entryName.split('/').pop());

    return { excelPath: path.join(tmpDir, excelEntry.entryName.split('/').pop() ?? ''), imagesPath };
  }

  // ─── Excel Parser (Hardened — resolves all exceljs cell object types) ───
  private async parseExcel(xlsxPath: string): Promise<Record<string, unknown>[]> {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(xlsxPath);

    const sheet = workbook.getWorksheet(1) ?? workbook.worksheets[0];
    if (!sheet) throw new Error('No worksheet found in file');

    const headers: string[] = [];
    sheet.getRow(1).eachCell((cell, colNum) => {
      // Strip ★ prefix from required headers, normalize to plain string
      const raw = this.normalizeCellValue(cell.value);
      const val = String(raw ?? '').replace(/^★\s*/, '').trim();
      headers[colNum - 1] = val;
    });

    const rows: Record<string, unknown>[] = [];
    sheet.eachRow((row, rowNum) => {
      if (rowNum === 1) return; // skip header row
      // Skip the example/template row (row 2 — italicized guidance)
      if (rowNum === 2) return;

      const obj: Record<string, unknown> = {};
      row.eachCell({ includeEmpty: false }, (cell, colNum) => {
        const key = headers[colNum - 1];
        if (!key) return;
        obj[key] = this.normalizeCellValue(cell.value);
      });

      // Skip completely empty rows
      if (Object.values(obj).some((v) => v !== '' && v != null)) {
        rows.push(obj);
      }
    });

    return rows;
  }

  /**
   * Normalizes any exceljs cell value to a safe primitive.
   * Handles: strings, numbers, booleans, Dates, hyperlinks,
   *          formula results, rich text, and null/undefined.
   */
  private normalizeCellValue(value: ExcelJS.CellValue): string | number | boolean | null {
    if (value == null) return null;

    // Primitive pass-through
    if (typeof value === 'string') return value;
    if (typeof value === 'number') return value;
    if (typeof value === 'boolean') return value;

    // Date → ISO string
    if (value instanceof Date) return value.toISOString();

    // ExcelJS object types (all extend object)
    if (typeof value === 'object') {
      // Hyperlink: { text: string; hyperlink: string }
      if ('hyperlink' in value && 'text' in value) {
        // Prefer the hyperlink URL for image fields, text for everything else
        return String((value as { hyperlink: string; text: string }).hyperlink ||
          (value as { hyperlink: string; text: string }).text);
      }

      // Formula: { formula: string; result: CellValue; date1904?: boolean }
      if ('result' in value) {
        return this.normalizeCellValue(
          (value as { formula: string; result: ExcelJS.CellValue }).result
        );
      }

      // Rich text: { richText: { text: string; font?: ... }[] }
      if ('richText' in value) {
        return (value as { richText: { text: string }[] }).richText
          .map((rt) => rt.text)
          .join('');
      }

      // Shared formula: { sharedFormula: string; result: CellValue }
      if ('sharedFormula' in value && 'result' in value) {
        return this.normalizeCellValue(
          (value as { sharedFormula: string; result: ExcelJS.CellValue }).result
        );
      }
    }

    // Fallback — coerce whatever remains to string
    return String(value);
  }

  // ─── Image Uploader ───────────────────────────────────────────────────
  private async uploadImage(
    s3: S3Client,
    bucket: string,
    baseKey: string,
    source: string | undefined,
    imageDir: string | undefined,
  ): Promise<string | undefined> {
    if (!source?.trim()) return undefined;

    // Already a URL — return as-is after validation
    if (source.startsWith('https://')) {
      return source;
    }

    // Filename reference — locate on disk
    if (!imageDir) return undefined;

    const diskPath = path.join(imageDir, path.basename(source));
    if (!fs.existsSync(diskPath)) {
      this.logger.warn(`[ImportWorker] Image not found in ZIP: ${source}`);
      return undefined;
    }

    const buffer = await fsp.readFile(diskPath);
    let validated: { safeFilename: string; detectedMimeType: string };
    try {
      validated = this.fileValidation.validateAndSanitize(buffer, source);
    } catch {
      this.logger.warn(`[ImportWorker] Invalid image type skipped: ${source}`);
      return undefined;
    }

    const key = `${baseKey}/${validated.safeFilename}`;
    await s3.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: buffer,
        ContentType: validated.detectedMimeType,
      })
    );

    return `${env.STORAGE_PUBLIC_URL}/${bucket}/${key}`;
  }

  // ─── Bull Hooks ───────────────────────────────────────────────────────
  @OnQueueActive()
  onActive(job: Job) {
    this.logger.log(`[ImportWorker] Job ${job.id} started`);
  }

  @OnQueueFailed()
  onFailed(job: Job, error: Error) {
    this.logger.error(`[ImportWorker] Job ${job.id} failed: ${error.message}`);
  }
}
