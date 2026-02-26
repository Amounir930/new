/**
 * Platform Extensibility Schema — V5 Enterprise Hardening
 *
 * Tables: entity_metafields.
 * Design: Shopify-grade extensibility for all core entities.
 */

import { index, jsonb, text, uniqueIndex, uuid } from 'drizzle-orm/pg-core';
import { storefrontSchema, ulidId } from '../v5-core';

/**
 * 🧬 Entity Metafields
 * Mandate #60: Infinite extensibility without migrations.
 * Usage: Attach custom data to products, orders, customers, etc.
 */
export const entityMetafields = storefrontSchema.table(
  'entity_metafields',
  {
    id: ulidId(),
    tenantId: uuid('tenant_id').notNull(),

    // Target reference
    entityType: text('entity_type').notNull(), // e.g., 'product', 'order', 'customer'
    entityId: uuid('entity_id').notNull(),

    // Namespace & Key
    namespace: text('namespace').notNull().default('global'),
    key: text('key').notNull(),

    // Type & Value
    type: text('type').notNull().default('string'), // string, integer, boolean, json, url
    value: jsonb('value').notNull(),
  },
  (table) => [
    // Decision #65: Unique constraint for key-value pair per entity
    uniqueIndex('idx_meta_unique').on(
      table.tenantId,
      table.entityType,
      table.entityId,
      table.namespace,
      table.key
    ),
    // Performance: Fast lookups for all metafields of an entity
    index('idx_meta_lookup').on(
      table.tenantId,
      table.entityType,
      table.entityId
    ),
    // Search: Index for querying by value
    index('idx_meta_value_gin').using('gin', table.value),
  ]
);

export type EntityMetafield = typeof entityMetafields.$inferSelect;
export type NewEntityMetafield = typeof entityMetafields.$inferInsert;
