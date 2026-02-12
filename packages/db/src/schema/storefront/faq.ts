/**
 * FAQ Schema
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
    varchar,
} from 'drizzle-orm/pg-core';

/**
 * FAQ Categories Table
 */
export const faqCategories = pgTable(
    'faq_categories',
    {
        id: uuid('id').defaultRandom().primaryKey(),
        name: varchar('name', { length: 100 }).notNull(),
        order: integer('order').default(0),
        isActive: boolean('is_active').default(true),

        createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    }
);

/**
 * FAQs Table
 */
export const faqs = pgTable(
    'faqs',
    {
        id: uuid('id').defaultRandom().primaryKey(),
        categoryId: uuid('category_id').references(() => faqCategories.id, { onDelete: 'set null' }),

        question: varchar('question', { length: 500 }).notNull(),
        answer: text('answer').notNull(),

        order: integer('order').default(0),
        isActive: boolean('is_active').default(true),

        createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
        updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
    },
    (table) => ({
        idxFaqCategory: index('idx_faq_category').on(table.categoryId),
        idxFaqActive: index('idx_faq_active').on(table.isActive),
    })
);

/**
 * Type Exports
 */
export type FaqCategory = typeof faqCategories.$inferSelect;
export type NewFaqCategory = typeof faqCategories.$inferInsert;

export type Faq = typeof faqs.$inferSelect;
export type NewFaq = typeof faqs.$inferInsert;
