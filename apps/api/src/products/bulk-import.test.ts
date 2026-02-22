import { describe, it, expect } from 'bun:test';
import { BulkImportSchema } from './dto/bulk-import.dto';

describe('BulkImport Validation', () => {
    it('should validate correctly with valid fileData', () => {
        const result = BulkImportSchema.safeParse({
            fileData: 'base64-encoded-content',
        });
        expect(result.success).toBe(true);
    });

    it('should validate correctly with valid fileUrl', () => {
        const result = BulkImportSchema.safeParse({
            fileUrl: 'https://example.com/products.csv',
        });
        expect(result.success).toBe(true);
    });

    it('should fail if both fileData and fileUrl are missing', () => {
        const result = BulkImportSchema.safeParse({
            options: { updateExisting: true }
        });
        expect(result.success).toBe(false);
    });

    it('should fail with invalid fileUrl', () => {
        const result = BulkImportSchema.safeParse({
            fileUrl: 'not-a-url'
        });
        expect(result.success).toBe(false);
    });
});
