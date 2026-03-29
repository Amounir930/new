/**
 * BulkImportTemplateService
 * Generates a high-fidelity, bilingual Merchant Import Guide (.xlsx).
 * Features:
 * - Sheet 1: Styled Instructions (Active)
 * - Sheet 2: Data Entry with Dropdowns
 * - Sheet 3: Hidden Reference Data
 */

import { Injectable } from '@nestjs/common';
import ExcelJS from 'exceljs';
import { FIELD_METADATA } from '@apex/validation';

@Injectable()
export class BulkImportTemplateService {
  async generateTemplate(): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Apex Platform';
    workbook.lastModifiedBy = 'Apex System';

    // ─── STYLING CONSTANTS ───────────────────────────────────────────────────
    const COLORS = {
      primary: 'FF4F46E5', // Apex Indigo
      secondary: 'FF1E1B4B', // Dark Navy
      required: 'FF7B2D00', // Deep Orange for text
      requiredBg: 'FFFFEB3B', // Yellow fill
      optionalBg: 'FFF3F4F6', // Light Grey
      white: 'FFFFFFFF',
      border: 'FFD1D5DB',
    };

    // ─── SHEET 3: REFERENCE (HIDDEN) ─────────────────────────────────────────
    const refSheet = workbook.addWorksheet('Reference', { state: 'hidden' });
    
    // Niche options
    const niches = FIELD_METADATA.niche.options || [];
    niches.forEach((n, i) => {
      refSheet.getCell(i + 1, 1).value = n;
    });

    // Warranty Unit options
    const warrantyUnits = FIELD_METADATA.warrantyUnit.options || [];
    warrantyUnits.forEach((w, i) => {
      refSheet.getCell(i + 1, 2).value = w;
    });

    // ─── SHEET 1: INSTRUCTIONS ───────────────────────────────────────────────
    const instSheet = workbook.addWorksheet('Instructions (تعليمات الاستيراد)');
    instSheet.getColumn(1).width = 25; // Field Name
    instSheet.getColumn(2).width = 45; // Requirement Ar
    instSheet.getColumn(3).width = 45; // Requirement En
    instSheet.getColumn(4).width = 40; // Example

    // Title Section
    const titleRow = instSheet.addRow(['APEX MERCHANT IMPORT GUIDE | دليل استيراد المنتجات']);
    instSheet.mergeCells(1, 1, 1, 4);
    titleRow.height = 40;
    titleRow.getCell(1).font = { bold: true, size: 18, color: { argb: COLORS.white } };
    titleRow.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.primary } };
    titleRow.getCell(1).alignment = { vertical: 'middle', horizontal: 'center' };

    instSheet.addRow(['']); // Spacer

    // Header Row
    const instHeader = instSheet.addRow(['Field (الحقل)', 'Requirement (المتطلبات - عربي)', 'Description (الوصف - إنجليزي)', 'Format / Example (التنسيق / مثال)']);
    instHeader.height = 30;
    instHeader.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: COLORS.white } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.secondary } };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
      cell.border = { bottom: { style: 'medium', color: { argb: COLORS.primary } } };
    });

    // Data Rows
    Object.entries(FIELD_METADATA).forEach(([key, meta]) => {
      const row = instSheet.addRow([
        `${meta.required ? '★ ' : ''}${key}`,
        meta.descAr,
        meta.descEn,
        meta.example
      ]);
      row.height = 45;
      row.getCell(1).font = { bold: true, color: { argb: meta.required ? COLORS.required : 'FF374151' } };
      row.getCell(2).alignment = { wrapText: true, vertical: 'middle', horizontal: 'right' };
      row.getCell(3).alignment = { wrapText: true, vertical: 'middle', horizontal: 'left' };
      row.getCell(4).font = { italic: true, color: { argb: 'FF6B7280' } };
      row.getCell(4).alignment = { vertical: 'middle' };

      // Add borders to each cell
      row.eachCell((cell) => {
        cell.border = { bottom: { style: 'thin', color: { argb: COLORS.border } } };
      });
    });

    // Final Tips
    instSheet.addRow(['']);
    const tipRow = instSheet.addRow(['CRITICAL: To link a Category or Brand ID, copy the UUID from your dashboard and paste it into the respective column.']);
    instSheet.mergeCells(tipRow.number, 1, tipRow.number, 4);
    tipRow.getCell(1).font = { bold: true, color: { argb: COLORS.required } };

    // ─── SHEET 2: PRODUCTS ──────────────────────────────────────────────────
    const prodSheet = workbook.addWorksheet('Products (المنتجات)', {
      views: [{ state: 'frozen', ySplit: 1 }],
    });

    const fieldEntries = Object.entries(FIELD_METADATA);
    prodSheet.columns = fieldEntries.map(([key, meta]) => ({
      header: `${meta.required ? '★ ' : ''}${key}`,
      key: key,
      width: 20,
    }));

    // Header Styling
    const prodHeader = prodSheet.getRow(1);
    prodHeader.height = 30;
    prodHeader.eachCell((cell, colNumber) => {
      const meta = fieldEntries[colNumber - 1][1];
      cell.font = { bold: true, color: { argb: meta.required ? COLORS.required : 'FF374151' } };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: meta.required ? COLORS.requiredBg : COLORS.optionalBg },
      };
      cell.border = { bottom: { style: 'medium', color: { argb: COLORS.primary } } };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
    });

    // ─── DATA VALIDATIONS ────────────────────────────────────────────────────
    const maxRows = 500;
    fieldEntries.forEach(([key, meta], colIdx) => {
      const colLetter = prodSheet.getColumn(colIdx + 1).letter;
      
      if (key === 'niche') {
        const range = `$A$1:$A$${niches.length}`;
        for (let i = 2; i <= maxRows + 1; i++) {
          prodSheet.getCell(`${colLetter}${i}`).dataValidation = {
            type: 'list',
            allowBlank: false,
            formulae: [`'Reference'!${range}`],
            showErrorMessage: true,
            errorTitle: 'Invalid Niche',
            error: 'Please select a value from the allowed niches list.',
          };
        }
      }

      if (key === 'warrantyUnit') {
        const range = `$B$1:$B$${warrantyUnits.length}`;
        for (let i = 2; i <= maxRows + 1; i++) {
          prodSheet.getCell(`${colLetter}${i}`).dataValidation = {
            type: 'list',
            allowBlank: true,
            formulae: [`Reference!${range}`],
            showErrorMessage: true,
            errorTitle: 'Invalid Unit',
            error: 'Must be one of: days, months, years',
          };
        }
      }

      // Pre-fill one example row
      prodSheet.getCell(`${colLetter}2`).value = meta.example;
    });

    // Final adjustments
    instSheet.views = [{ activeCell: 'A1' }];
    workbook.views = [{ activeTab: 0 }]; // Start on Instructions

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }
}
