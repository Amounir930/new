import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

// S3: Strict Input Validation
export const createBlueprintSchema = z.object({
    name: z.string().min(3).max(100),
    description: z.string().optional(),
    plan: z.enum(['free', 'pro', 'enterprise']).default('free'),
    isDefault: z.boolean().default(false),
    // JSON structure validation handled by specific validator in Service
    // or via refined type here if @apex/validators schema is compatible
    blueprint: z.string().min(10, "Blueprint must be a valid JSON string"),
});

export class CreateBlueprintDto extends createZodDto(createBlueprintSchema) { }

export const updateBlueprintSchema = createBlueprintSchema.partial();
export class UpdateBlueprintDto extends createZodDto(updateBlueprintSchema) { }
