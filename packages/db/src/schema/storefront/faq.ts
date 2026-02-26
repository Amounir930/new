/**
 * FAQ Schema — V5
 *
 * Tables for Frequently Asked Questions.
 *
 * @module @apex/db/schema/storefront/faq
 */

import {
  boolean,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';
import { storefrontSchema, ulidId } from '../v5-core';

/**
 * FAQ Categories Table
 */
export const faqCategories = storefrontSchema.table('faq_categories', {
  // ── Fixed (Alignment) ──
  id: ulidId(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),

  // ── Integer ──
  order: integer('order').default(0),

  // ── Boolean ──
  isActive: boolean('is_active').default(true),

  // ── Scalar ──
  name: text('name').notNull(),
});

/**
 * FAQs Table
 * Column alignment: UUID → TIMESTAMPTZ → INT → BOOLEAN → TEXT
 */
export const faqs = storefrontSchema.table(
  'faqs',
  {
    // ── Fixed (Alignment) ──
    id: ulidId(),
    categoryId: uuid('category_id').references(() => faqCategories.id, {
      onDelete: 'set null',
    }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),

    // ── Integer ──
    order: integer('order').default(0),

    // ── Boolean ──
    isActive: boolean('is_active').default(true),

    // ── Scalar ──
    question: text('question').notNull(),
    answer: text('answer').notNull(),
  },
  (table) => ({
    idxFaqCategory: index('idx_faq_category').on(table.categoryId),
    idxFaqActive: index('idx_faq_active').on(table.isActive),
  })
);

// ─── Type Exports ───────────────────────────────────────────
export type FaqCategory = typeof faqCategories.$inferSelect;
export type Faq = typeof faqs.$inferSelect;
