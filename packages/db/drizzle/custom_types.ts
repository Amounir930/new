import { customType } from 'drizzle-orm/pg-core';

/**
 * Custom type for PostgreSQL money_amount (numeric 12,4 with explicit handling)
 */
export const moneyAmount = customType<{ data: string }>({
  dataType() {
    return 'numeric(12, 4)';
  },
});

/**
 * Custom type for PostgreSQL ltree extension (hierarchical paths)
 */
export const ltree = customType<{ data: string }>({
  dataType() {
    return 'ltree';
  },
});

/**
 * Custom type for PostGIS geography
 */
export const geography = customType<{ data: string }>({
  dataType() {
    return 'geography';
  },
});

/**
 * Custom type for PostgreSQL int4range
 */
export const int4range = customType<{ data: string }>({
  dataType() {
    return 'int4range';
  },
});

/**
 * Custom type for PostgreSQL tstzrange
 */
export const tstzrange = customType<{ data: string }>({
  dataType() {
    return 'tstzrange';
  },
});

/**
 * Custom type for PG 'name' internal type (used in views)
 */
export const pgName = customType<{ data: string }>({
  dataType() {
    return 'name';
  },
});
