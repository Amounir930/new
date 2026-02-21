export {
  sql,
  eq,
  and,
  or,
  not,
  desc,
  asc,
  relations,
  inArray,
  isNotNull,
  isNull,
  like,
  count,
  between,
  exists,
  gt,
  gte,
  inArray as in,
  lt,
  lte,
  ne,
  notExists,
  notInArray,
  notLike,
} from 'drizzle-orm';

export type {
  SQL,
  SQLWrapper,
  Column,
  ColumnBaseConfig,
  AnyColumn,
} from 'drizzle-orm';
export { drizzle } from 'drizzle-orm/node-postgres';
export type { NodePgDatabase } from 'drizzle-orm/node-postgres';

export * from './connection';
export * from './core';
export * from './db.module';
export * from './schema/index';
export * from './services/index';
export * from './tenant-registry.service';

import { publicDb, publicPool } from './connection.js';
export { publicDb, publicPool };
