/**
 * BulkImportTemplateService
 * Generates a downloadable Excel template for bulk product import.
 * Required columns are marked with ★ prefix and styled with bold + yellow fill.
 */

import { Injectable } from '@nestjs/common';
import ExcelJS from 'exceljs';

interface ColumnDef {
  header: string;
  key: string;
  width: number;
  required: boolean;
  example: string;
}

const COLUMNS: ColumnDef[] = [
  // ★ Required
  { header: '★ nameAr', key: 'nameAr', width: 30, required: true, example: 'منتج تجريبي' },
  { header: '★ nameEn', key: 'nameEn', width: 30, required: true, example: 'Sample Product' },
  { header: '★ sku', key: 'sku', width: 20, required: true, example: 'SKU-12345678' },
  { header: '★ basePrice', key: 'basePrice', width: 14, required: true, example: '99.99' },
  { header: '★ niche', key: 'niche', width: 16, required: true, example: 'retail' },
  { header: 'slug', key: 'slug', width: 30, required: false, example: 'sample-product' },
  // Pricing
  { header: 'salePrice', key: 'salePrice', width: 14, required: false, example: '79.99' },
  { header: 'costPrice', key: 'costPrice', width: 14, required: false, example: '40.00' },
  { header: 'compareAtPrice', key: 'compareAtPrice', width: 16, required: false, example: '120.00' },
  // Identifiers
  { header: 'barcode', key: 'barcode', width: 20, required: false, example: 'ABC-12345678' },
  // Descriptions
  { header: 'shortDescAr', key: 'shortDescAr', width: 40, required: false, example: 'وصف قصير' },
  { header: 'shortDescEn', key: 'shortDescEn', width: 40, required: false, example: 'Short description' },
  { header: 'longDescAr', key: 'longDescAr', width: 40, required: false, example: 'وصف مفصل' },
  { header: 'longDescEn', key: 'longDescEn', width: 40, required: false, example: 'Long detailed description' },
  // SEO
  { header: 'metaTitle', key: 'metaTitle', width: 30, required: false, example: 'Product SEO Title' },
  { header: 'metaDescription', key: 'metaDescription', width: 40, required: false, example: 'SEO description max 160 chars' },
  // Logistics
  { header: 'weight', key: 'weight', width: 12, required: false, example: '500' },
  { header: 'minOrderQty', key: 'minOrderQty', width: 14, required: false, example: '1' },
  { header: 'lowStockThreshold', key: 'lowStockThreshold', width: 18, required: false, example: '5' },
  { header: 'taxBasisPoints', key: 'taxBasisPoints', width: 16, required: false, example: '1400' },
  { header: 'countryOfOrigin', key: 'countryOfOrigin', width: 16, required: false, example: 'EG' },
  { header: 'warrantyPeriod', key: 'warrantyPeriod', width: 14, required: false, example: '12' },
  { header: 'warrantyUnit', key: 'warrantyUnit', width: 14, required: false, example: 'months' },
  // Flags
  { header: 'isActive', key: 'isActive', width: 12, required: false, example: 'TRUE' },
  { header: 'isFeatured', key: 'isFeatured', width: 12, required: false, example: 'FALSE' },
  { header: 'isDigital', key: 'isDigital', width: 12, required: false, example: 'FALSE' },
  { header: 'requiresShipping', key: 'requiresShipping', width: 18, required: false, example: 'TRUE' },
  { header: 'trackInventory', key: 'trackInventory', width: 16, required: false, example: 'TRUE' },
  // Flat dimensions (Veto 1 fix)
  { header: 'dimHeight', key: 'dimHeight', width: 12, required: false, example: '10' },
  { header: 'dimWidth', key: 'dimWidth', width: 12, required: false, example: '5' },
  { header: 'dimLength', key: 'dimLength', width: 12, required: false, example: '3' },
  // Flattened attributes (Veto 1 fix)
  { header: 'attributes', key: 'attributes', width: 40, required: false, example: 'Color:Red | Size:XL | Material:Cotton' },
  { header: 'specifications', key: 'specifications', width: 40, required: false, example: 'CPU:M3 | RAM:16GB' },
  // Tags
  { header: 'tags', key: 'tags', width: 30, required: false, example: 'Electronics,Sale,New' },
  { header: 'keywords', key: 'keywords', width: 30, required: false, example: 'phone,mobile,smart' },
  // Images
  { header: 'mainImage', key: 'mainImage', width: 50, required: false, example: 'product-main.jpg OR https://example.com/img.jpg' },
  { header: 'galleryImages', key: 'galleryImages', width: 60, required: false, example: 'img1.jpg|img2.jpg|img3.jpg' },
];

@Injectable()
export class BulkImportTemplateService {
  async generateTemplate(): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Apex Platform';

    const sheet = workbook.addWorksheet('Products', {
      views: [{ state: 'frozen', ySplit: 1 }],
    });

    // Define columns
    sheet.columns = COLUMNS.map((col) => ({
      header: col.header,
      key: col.key,
      width: col.width,
    }));

    // Style the header row
    const headerRow = sheet.getRow(1);
    headerRow.eachCell((cell, colNumber) => {
      const colDef = COLUMNS[colNumber - 1];
      if (!colDef) return;

      cell.font = { bold: true, size: 11, color: { argb: colDef.required ? 'FF7B2D00' : 'FF1F2937' } };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: colDef.required ? 'FFFFEB3B' : 'FFE5E7EB' },
      };
      cell.border = {
        bottom: { style: 'medium', color: { argb: 'FF374151' } },
      };
      cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: false };
    });
    headerRow.height = 24;

    // Add example row
    const exampleData: Record<string, string> = {};
    for (const col of COLUMNS) {
      exampleData[col.key] = col.example;
    }
    const exampleRow = sheet.addRow(exampleData);
    exampleRow.eachCell((cell) => {
      cell.font = { italic: true, color: { argb: 'FF6B7280' } };
    });

    // Add validation notes sheet
    const notesSheet = workbook.addWorksheet('Instructions');
    notesSheet.getColumn(1).width = 80;
    const notes = [
      ['APEX Bulk Import — Instructions'],
      [''],
      ['★ Required Fields: nameAr, nameEn, sku, basePrice, niche'],
      ['niche values: retail | food | digital | services'],
      ['warrantyUnit values: days | months | years'],
      ['barcode format: 8-50 chars, letters/numbers/hyphens only (e.g. ABC-12345678)'],
      [''],
      ['Attributes & Specifications format:'],
      ['  Color:Red | Size:XL | Material:Cotton'],
      [''],
      ['Images:'],
      ['  mainImage → filename (e.g. product-main.jpg) OR full HTTPS URL'],
      ['  galleryImages → pipe-separated: img1.jpg|img2.jpg'],
      ['  For ZIP upload: place images in an "images/" folder within the ZIP'],
      [''],
      ['Max 500 rows per import.'],
      ['Max ZIP file size: 500MB.'],
    ];
    for (const note of notes) {
      const row = notesSheet.addRow(note);
      if (note[0]?.startsWith('APEX')) {
        row.getCell(1).font = { bold: true, size: 14 };
      }
    }

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }
}
