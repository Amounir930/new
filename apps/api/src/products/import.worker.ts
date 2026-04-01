import { randomUUID } from 'node:crypto';
import fs, { createWriteStream } from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import type { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { type InferInsertModel, inArray } from 'drizzle-orm';
import { env } from '@apex/config';
import {
  getTenantDb,
  productImagesInStorefront,
  productsInStorefront,
} from '@apex/db';

type InsertProduct = InferInsertModel<typeof productsInStorefront>;
type InsertMedia = InferInsertModel<typeof productImagesInStorefront>;
import { EncryptionService } from '@apex/security';
import { PRODUCT_NICHES } from '@apex/validation';
import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { OnQueueActive, OnQueueFailed, Process, Processor } from '@nestjs/bull';
import { Injectable, Logger } from '@nestjs/common';
import AdmZip from 'adm-zip';
import type { Job } from 'bull';
import ExcelJS from 'exceljs';
import { z } from 'zod';
import { FileValidationService } from './file-validation.service';
import { StorageService } from '../storage/storage.service';

// ─── Constants ───────────────────────────────────────────────────────────────
const MAX_ROWS = 500;
const MAX_ZIP_COMPRESSED_BYTES = 500 * 1024 * 1024; // 500MB
const MAX_UNCOMPRESSED_RATIO = 10;

// ─── Schema Helpers ────────────────────────────────────────────────────────
/**
 * 🛡️ S11 Defense: Sanitizes empty/whitespace strings into undefined before Zod coercion.
 * Prevents NaN crashes while preserving Zod method chaining (min, int, etc.).
 */
const withEmptyToUndefined = <T extends z.ZodTypeAny>(schema: T) =>
  z.preprocess((val) => {
    if (typeof val === 'string' && val.trim() === '') return undefined;
    return val;
  }, schema);

// ─── Row Schema (mirrors CreateProductSchema, flat fields) ─────────────────
const ImportRowSchema = z.object({
  nameAr: z.string().min(2).max(255),
  nameEn: z.string().min(2).max(255),
  sku: z
    .string()
    .regex(
      /^[A-Z0-9_-]{3,50}$/,
      'SKU must be uppercase letters, numbers, underscores, or hyphens (3-50 chars)'
    ),
  basePrice: withEmptyToUndefined(z.coerce.number().min(0)),
  niche: z.enum(PRODUCT_NICHES),
  slug: z.string().optional(),
  // Pricing
  salePrice: withEmptyToUndefined(z.coerce.number().min(0)).optional(),
  costPrice: withEmptyToUndefined(z.coerce.number().min(0)).optional(),
  compareAtPrice: withEmptyToUndefined(z.coerce.number().min(0)).optional(),
  // Identifiers
  barcode: z
    .string()
    .regex(/^[A-Za-z0-9-]{8,50}$/)
    .or(z.literal(''))
    .optional(),
  // Descriptions
  shortDescAr: z.string().max(500).optional(),
  shortDescEn: z.string().max(500).optional(),
  longDescAr: z.string().max(5000).optional(),
  longDescEn: z.string().max(5000).optional(),
  // SEO
  metaTitle: z.string().max(60).optional(),
  metaDescription: z.string().max(160).optional(),
  // Logistics
  weight: withEmptyToUndefined(z.coerce.number().int().min(0)).optional(),
  minOrderQty: withEmptyToUndefined(z.coerce.number().int().min(1)).optional(),
  lowStockThreshold: withEmptyToUndefined(
    z.coerce.number().int().min(0)
  ).optional(),
  taxBasisPoints: withEmptyToUndefined(
    z.coerce.number().int().min(0).max(10000)
  ).optional(),
  countryOfOrigin: z.string().length(2).toUpperCase().optional(),
  warrantyPeriod: withEmptyToUndefined(z.coerce.number().int().min(0)).optional(),
  warrantyUnit: z.enum(['days', 'months', 'years']).optional(),
  // Flags
  isActive: z
    .preprocess(
      (v) =>
        v === null || v === undefined || v === ''
          ? true
          : String(v).toUpperCase() === 'TRUE',
      z.boolean()
    )
    .default(true),
  isFeatured: z
    .preprocess((v) => String(v).toUpperCase() === 'TRUE', z.boolean())
    .optional(),
  isDigital: z
    .preprocess((v) => String(v).toUpperCase() === 'TRUE', z.boolean())
    .optional(),
  requiresShipping: z
    .preprocess((v) => String(v).toUpperCase() === 'TRUE', z.boolean())
    .optional(),
  trackInventory: z
    .preprocess((v) => String(v).toUpperCase() === 'TRUE', z.boolean())
    .optional(),
  // Flat dimensions (V1 fix)
  dimHeight: withEmptyToUndefined(z.coerce.number().min(0)).optional(),
  dimWidth: withEmptyToUndefined(z.coerce.number().min(0)).optional(),
  dimLength: withEmptyToUndefined(z.coerce.number().min(0)).optional(),
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
  s3Bucket: string;
  s3Key: string;
  isZip: boolean;
  jobId: string;
}

// ─── Delimiter Parser (V1 fix) ─────────────────────────────────────────────
function parseDelimited(
  input: string | undefined
): Record<string, string> | undefined {
  if (!input?.trim()) return undefined;
  const result: Record<string, string> = {};
  for (const pair of input.split('|')) {
    const colonIdx = pair.indexOf(':');
    if (colonIdx === -1) continue;
    const key = pair.slice(0, colonIdx).trim().toLowerCase().slice(0, 100);
    const val = pair
      .slice(colonIdx + 1)
      .trim()
      .slice(0, 1024);
    if (key) result[key] = val;
  }
  return Object.keys(result).length > 0 ? result : undefined;
}

function parseDimensions(
  h?: number,
  w?: number,
  l?: number
): Record<string, number> | undefined {
  if (h === undefined && w === undefined && l === undefined) return undefined;
  return { h: h ?? 0, w: w ?? 0, l: l ?? 0 };
}

function parseCommaSeparated(input?: string): string[] | undefined {
  if (!input?.trim()) return undefined;
  return input
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

// ─── Worker ───────────────────────────────────────────────────────────────
@Processor('import-queue')
@Injectable()
export class ImportWorker {
  private readonly logger = new Logger(ImportWorker.name);

  constructor(
    private readonly fileValidation: FileValidationService,
    private readonly storageService: StorageService,
    readonly _crypto: EncryptionService
  ) {}

  @Process('product-import')
  async handleImport(job: Job<JobData>) {
    const { tenantId, schemaName, subdomain, s3Bucket, s3Key, isZip, jobId } =
      job.data;
    const tmpDir = path.join('/tmp', `import_${jobId}`);
    const localFilePath = path.join('/tmp', `bulk_import_${jobId}`);
    const errors: RowError[] = [];
    let importedCount = 0;

    const s3 = this.storageService.getClient();

    try {
      // ─── Phase 0: Download from MinIO (Stateless Handshake) ──────────────
      this.logger.log(`[ImportWorker] Downloading buffered file: ${s3Key}`);
      
      // S15: Active Healing for the temp buffer bucket
      await this.storageService.ensureBucketExists(s3Bucket);

      const downloadResult = await s3.send(
        new GetObjectCommand({ Bucket: s3Bucket, Key: s3Key })
      );
      await pipeline(
        downloadResult.Body as Readable,
        createWriteStream(localFilePath)
      );

      // ─── Phase 1: Extract & Parse ──────────────────────────────────────
      await fsp.mkdir(tmpDir, { recursive: true });

      let xlsxPath: string;
      let imageDir: string | undefined;

      if (isZip) {
        const { excelPath, imagesPath } = await this.extractZip(
          localFilePath,
          tmpDir
        );
        xlsxPath = excelPath;
        imageDir = imagesPath;
      } else {
        xlsxPath = localFilePath;
      }

      const rawRows = await this.parseExcel(xlsxPath);

      if (rawRows.length > MAX_ROWS) {
        throw new Error(
          `Import exceeds max ${MAX_ROWS} rows (got ${rawRows.length})`
        );
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
        this.logger.warn(
          `[ImportWorker] Validation failed: ${errors.length} row errors`
        );
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
            errors: [
              { field: 'sku', message: `Duplicate SKU in sheet: ${sku}` },
            ],
          })),
          importedCount: 0,
        };
      }

      const { db, release } = await getTenantDb(tenantId, schemaName);
      try {
        const existingSkuRows = await db
          .select({ sku: productsInStorefront.sku })
          .from(productsInStorefront)
          .where(inArray(productsInStorefront.sku, skus));

        if (existingSkuRows.length > 0) {
          const existingSet = new Set(
            existingSkuRows.map((r: { sku: string }) => r.sku)
          );
          return {
            status: 'failed',
            errors: validRows
              .filter((r) => existingSet.has(r.data.sku))
              .map((r) => ({
                row: r.row,
                sku: r.data.sku,
                errors: [
                  { field: 'sku', message: `SKU already exists in database` },
                ],
              })),
            importedCount: 0,
          };
        }
      } finally {
        release();
      }

      await job.progress(40);

      // ─── Phase 3: MinIO Product Uploads ───────────────────────────────
      const bucketName = `tenant-${subdomain.toLowerCase().replace(/[^a-z0-9]/g, '')}-assets`;

      const resolvedRows: (ImportRow & {
        _productId: string;
        _mainImageUrl: string | undefined;
        _galleryUrls: { url: string; altText: string; order: number }[];
      })[] = [];
      const mediaInserts: any[] = [];

      for (let i = 0; i < validRows.length; i++) {
        const { data } = validRows[i];
        const productId = randomUUID();
        const baseKey = `public/products/${productId}`;

        const mainImageUrl = await this.uploadImage(
          s3,
          bucketName,
          baseKey,
          data.mainImage,
          imageDir
        );

        if (mainImageUrl) {
          mediaInserts.push({
            id: randomUUID(),
            productId,
            url: mainImageUrl,
            isPrimary: true,
            sortOrder: 0,
          });
        }

        const galleryUrls: { url: string; altText: string; order: number }[] =
          [];
        if (data.galleryImages?.trim()) {
          const filenames = data.galleryImages
            .split('|')
            .map((s) => s.trim())
            .filter(Boolean);
          let order = 0;
          for (const filename of filenames) {
            const url = await this.uploadImage(
              s3,
              bucketName,
              baseKey,
              filename,
              imageDir
            );
            if (url) {
              galleryUrls.push({ url, altText: '', order: order++ });
              mediaInserts.push({
                id: randomUUID(),
                productId,
                url,
                isPrimary: false,
                sortOrder: order,
              });
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
      if (resolvedRows.length === 0) {
        this.logger.log(
          `[ImportWorker] Job ${jobId} completed with 0 rows.`
        );
        await job.progress(100);
        return { status: 'done', importedCount: 0, errors: [] };
      }

      const { db: dbInsert, release: releaseInsert } = await getTenantDb(
        tenantId,
        schemaName
      );
      try {
        const productInserts: InsertProduct[] = resolvedRows.map((r) => ({
          id: r._productId,
          name: { ar: r.nameAr, en: r.nameEn },
          sku: r.sku,
          niche:
            r.niche === 'food' || r.niche === 'digital' ? 'retail' : r.niche,
          basePrice: String(r.basePrice),
          salePrice: r.salePrice != null ? String(r.salePrice) : null,
          costPrice: r.costPrice != null ? String(r.costPrice) : null,
          compareAtPrice:
            r.compareAtPrice != null ? String(r.compareAtPrice) : null,
          barcode: r.barcode || null,
          slug:
            r.slug ||
            r.nameEn
              .toLowerCase()
              .replace(/\s+/g, '-')
              .replace(/[^a-z0-9-]/g, ''),
          shortDescription:
            r.shortDescAr || r.shortDescEn
              ? { ar: r.shortDescAr ?? '', en: r.shortDescEn ?? '' }
              : null,
          longDescription:
            r.longDescAr || r.longDescEn
              ? { ar: r.longDescAr ?? '', en: r.longDescEn ?? '' }
              : null,
          metaTitle: r.metaTitle ?? null,
          metaDescription: r.metaDescription ?? null,
          weight: r.weight ? Math.floor(r.weight) : null,
          minOrderQty: r.minOrderQty ? Math.floor(r.minOrderQty) : 1,
          lowStockThreshold: r.lowStockThreshold ? Math.floor(r.lowStockThreshold) : 0,
          taxBasisPoints: r.taxBasisPoints ? Math.floor(r.taxBasisPoints) : 0,
          countryOfOrigin: r.countryOfOrigin ?? null,
          warrantyPeriod: r.warrantyPeriod ? Math.floor(r.warrantyPeriod) : null,
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
          keywords: (parseCommaSeparated(r.keywords) ?? []).join(' '),
          mainImage: r._mainImageUrl || '',
          galleryImages: r._galleryUrls || [],
          publishedAt: new Date().toISOString(),
        }));

        // S15: Execution of Atomic Dual-Write Transaction
        // Ensures both Product and Media Registry are committed together, preventing orphans
        await dbInsert.transaction(async (tx) => {
          await tx.insert(productsInStorefront).values(productInserts);
          if (mediaInserts.length > 0) {
            await tx
              .insert(productImagesInStorefront)
              .values(mediaInserts);
          }
        });

        importedCount = productInserts.length;
      } finally {
        releaseInsert();
      }

      await job.progress(100);
      return { status: 'done', importedCount, errors: [] };
    } catch (error) {
      this.logger.error(
        `[ImportWorker] Job ${jobId} failed`,
        (error as Error).stack
      );
      return {
        status: 'failed',
        errors,
        importedCount,
        cause: (error as Error).message,
      };
    } finally {
      // ─── Phase 5: Zero-Waste Cleanup (Mandatory) ───────────────────────
      // 1. Cleanup local worker directories
      await fsp
        .rm(tmpDir, { recursive: true, force: true })
        .catch(() => undefined);
      if (fs.existsSync(localFilePath)) {
        await fsp.rm(localFilePath).catch(() => undefined);
      }
      // 2. Cleanup MinIO buffer object (Critical for statelessness)
      await s3
        .send(new DeleteObjectCommand({ Bucket: s3Bucket, Key: s3Key }))
        .catch((e: any) =>
          this.logger.warn(`[ImportWorker] MinIO Cleanup Failed: ${e.message}`)
        );
    }
  }

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
      if (
        !excelEntry &&
        /\.(xlsx|csv)$/i.test(entry.entryName) &&
        !entry.entryName.includes('/')
      ) {
        excelEntry = entry;
      }
    }

    if (!excelEntry) {
      throw new Error('No Excel/CSV file found at root of ZIP archive');
    }

    const imagesPath = path.join(tmpDir, 'images');
    await fsp.mkdir(imagesPath, { recursive: true });

    for (const entry of entries) {
      if (entry.isDirectory) continue;
      const normalized = entry.entryName.replace(/\\/g, '/');
      if (normalized.startsWith('images/') && normalized !== 'images/') {
        const filename = path.basename(normalized);
        zip.extractEntryTo(entry, imagesPath, false, true, false, filename);
      }
    }

    const excelPath = path.join(tmpDir, excelEntry.entryName);
    zip.extractEntryTo(
      excelEntry,
      tmpDir,
      false,
      true,
      false,
      excelEntry.entryName.split('/').pop()
    );

    return {
      excelPath: path.join(tmpDir, excelEntry.entryName.split('/').pop() ?? ''),
      imagesPath,
    };
  }

  private async parseExcel(
    xlsxPath: string
  ): Promise<Record<string, unknown>[]> {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(xlsxPath);

    // ─── Phase 1: Dynamic Sheet Discovery (Signature Hunt) ───────────────
    // Required headers to identify the "Products" data sheet
    const REQUIRED_SIGNATURE = ['sku', 'nameAr', 'basePrice', 'niche'];
    let dataSheet: ExcelJS.Worksheet | undefined;
    let dataHeaders: string[] = [];

    this.logger.log(`[ImportWorker] Hunting for data sheet in workbook...`);

    for (const sheet of workbook.worksheets) {
      const headers: string[] = [];
      sheet.getRow(1).eachCell((cell, colNum) => {
        const raw = this.normalizeCellValue(cell.value);
        // Normalization Integrity (Protocol Requirement)
        const val = String(raw ?? '')
          .replace(/^★\s*/, '')
          .trim();
        headers[colNum - 1] = val;
      });

      // Verification: Check if this sheet matches the signature
      const isMatch = REQUIRED_SIGNATURE.every((req) => headers.includes(req));
      if (isMatch) {
        dataSheet = sheet;
        dataHeaders = headers;
        break;
      }
    }

    if (!dataSheet) {
      // Clean Throw: Descriptive for Merchant UI
      throw new Error(
        'INVALID_TEMPLATE: Could not find a worksheet matching the product upload signature. ' +
          'Ensure Row 1 contains the headers: SKU, nameAr, basePrice, niche.'
      );
    }

    this.logger.log(`[ImportWorker] Active Data Sheet: "${dataSheet.name}"`);

    const rows: Record<string, unknown>[] = [];
    dataSheet.eachRow((row, rowNum) => {
      if (rowNum === 1) return;
      const obj: Record<string, unknown> = {};
      row.eachCell({ includeEmpty: false }, (cell, colNum) => {
        const key = dataHeaders[colNum - 1];
        if (!key) return;
        obj[key] = this.normalizeCellValue(cell.value);
      });

      // 🛡️ S15 Defense: Aggressive Ghost-Row filtering (Problem B Fixed)
      // Check if the row has any non-whitespace content.
      const hasContent = Object.values(obj).some((v) => {
        if (v == null) return false;
        if (typeof v === 'string') return v.trim() !== '';
        return true; // Numbers/Booleans are valid content
      });

      if (hasContent) {
        rows.push(obj);
      }
    });

    return rows;
  }

  private normalizeCellValue(
    value: ExcelJS.CellValue
  ): string | number | boolean | null {
    if (value == null) return null;
    if (typeof value === 'string') return value;
    if (typeof value === 'number') return value;
    if (typeof value === 'boolean') return value;
    if (value instanceof Date) return value.toISOString();
    if (typeof value === 'object') {
      if ('hyperlink' in value && 'text' in value) {
        return String(
          (value as { hyperlink: string; text: string }).hyperlink ||
            (value as { hyperlink: string; text: string }).text
        );
      }
      if ('result' in value) {
        return this.normalizeCellValue(
          (value as { formula: string; result: ExcelJS.CellValue }).result
        );
      }
      if ('richText' in value) {
        return (value as { richText: { text: string }[] }).richText
          .map((rt) => rt.text)
          .join('');
      }
      if ('sharedFormula' in value && 'result' in value) {
        return this.normalizeCellValue(
          (value as { sharedFormula: string; result: ExcelJS.CellValue }).result
        );
      }
    }
    return String(value);
  }

  private async uploadImage(
    s3: S3Client,
    bucket: string,
    baseKey: string,
    source: string | undefined,
    imageDir: string | undefined
  ): Promise<string | undefined> {
    if (!source?.trim()) return undefined;
    if (source.startsWith('https://')) return source;
    if (!imageDir) return undefined;
    const diskPath = path.join(imageDir, path.basename(source));
    if (!fs.existsSync(diskPath)) return undefined;

    const buffer = await fsp.readFile(diskPath);
    let validated: { safeFilename: string; detectedMimeType: string };
    try {
      validated = this.fileValidation.validateAndSanitize(buffer, source);
    } catch {
      return undefined;
    }

    const key = `${baseKey}/${validated.safeFilename}`;

    // S15: Active Healing for the dynamic tenant asset bucket
    await this.storageService.ensureBucketExists(bucket);

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

  @OnQueueActive()
  onActive(job: Job) {
    this.logger.log(`[ImportWorker] Job ${job.id} started`);
  }

  @OnQueueFailed()
  onFailed(job: Job, error: Error) {
    this.logger.error(`[ImportWorker] Job ${job.id} failed: ${error.message}`);
  }
}
