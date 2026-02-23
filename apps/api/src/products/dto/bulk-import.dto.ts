import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const BulkImportSchema = z.object({
    // S2 FIX 22B: Reduced from 13.4MB to 1MB to prevent Event Loop blocking
    // Large files MUST use fileUrl (server-side fetch, non-blocking)
    fileData: z.string().max(1 * 1024 * 1024, "File data too large (max 1MB inline, use fileUrl for larger files)").optional(),
    fileUrl: z.string().url().optional(),
    options: z.object({
        updateExisting: z.boolean().default(true),
        skipErrors: z.boolean().default(true),
    }).default({}),
}).refine(data => data.fileData || data.fileUrl, {
    message: "Either fileData or fileUrl must be provided",
});

export class BulkImportDto extends createZodDto(BulkImportSchema) { }
