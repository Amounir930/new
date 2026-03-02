import { z } from 'zod';

/**
 * Entity Metafield Schema (EAV)
 */
export const EntityMetafieldSchema = z.object({
  id: z.string().uuid().optional(),
  entityType: z.enum(['product', 'variant', 'order', 'customer', 'collection']),
  entityId: z.string().uuid(),
  namespace: z.string().default('global'),
  key: z.string().min(1),
  type: z
    .enum(['string', 'json', 'integer', 'boolean', 'url', 'color'])
    .default('string'),
  value: z.unknown(),
});

export type EntityMetafield = z.infer<typeof EntityMetafieldSchema>;

export const CreateMetafieldSchema = EntityMetafieldSchema.omit({ id: true });
export const UpdateMetafieldSchema = CreateMetafieldSchema.partial();
