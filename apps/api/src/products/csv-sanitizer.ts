/**
 * S14 FIX 4B: CSV Formula Injection Sanitization
 *
 * Excel, Google Sheets, and LibreOffice execute formulas in cells
 * starting with =, +, -, or @. A malicious merchant can upload
 * a CSV with `=cmd|'/C calc'!A0` which executes on the Super Admin's
 * machine when they export and open the file.
 *
 * This utility neutralizes such cells before DB insertion.
 */

/**
 * Sanitize a single CSV field to prevent formula injection
 * @param value - Raw CSV cell value
 * @returns Sanitized value safe for spreadsheet consumption
 */
export function sanitizeCsvField(value: string): string {
  if (typeof value !== 'string') return value;

  const dangerousPrefixes = ['=', '+', '-', '@', '\t', '\r', '\n'];

  if (dangerousPrefixes.some((prefix) => value.startsWith(prefix))) {
    // Prepend single quote to neutralize formula execution
    return `'${value}`;
  }

  return value;
}

/**
 * Sanitize all string fields in a record
 * @param record - Key-value object from CSV row
 * @returns Sanitized record
 */
export function sanitizeCsvRecord(
  record: Record<string, unknown>
): Record<string, unknown> {
  const sanitized: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(record)) {
    sanitized[key] =
      typeof value === 'string' ? sanitizeCsvField(value) : value;
  }

  return sanitized;
}
