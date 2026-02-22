import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const BulkImportSchema = z.object({
    // Base64 encoded CSV content or a URL to the file
    fileData: z.string().optional(),
    fileUrl: z.string().url().optional(),
    options: z.object({
        updateExisting: z.boolean().default(true),
        skipErrors: z.boolean().default(true),
    }).default({}),
}).refine(data => data.fileData || data.fileUrl, {
    message: "Either fileData or fileUrl must be provided",
});

export class BulkImportDto extends createZodDto(BulkImportSchema) { }
