# Apex V2 Database Package (`@apex/db`)

This package manages the schema, migrations, and Drizzle ORM layer for the Apex V2 platform.

## ⚠️ The Golden Commandment: DO NOT PUSH

> [!CAUTION]
> **NEVER** run `npx drizzle-kit push` against the production database (or any shared database).
>
> Drizzle Kit is used for **introspection (pull)** and **querying** ONLY. It does not understand PostgreSQL Triggers, Row Level Security (RLS) policies, or complex schemas and will attempt to DELETE them during a `push`.

## Workflow & Migrations

All schema changes must follow this strictly ordered workflow using **Atlas**:

1. **Design**: Modify the `.hcl` files in this directory.
2. **Migration Generation**: Generate SQL migration files using Atlas.
3. **Hardening**: SQL migrations are automatically hardened with security policies.
4. **Application**: Apply migrations to the server using the Atlas CLI.
5. **Introspection**: After the database is updated, run `npm run pull` to update the Drizzle `schema.ts`.

## Connection Policy (Zero-Trust)

### Production Environment
The application Backend **MUST NOT** connect using the `postgres` superuser.
- Connection must use the `app_user` account.
- This user is limited to CRUD operations on specific schemas and is subject to RLS policies.

### Connection Pooling
To prevent connection exhaustion under high traffic:
- Use the built-in pooling in the Drizzle driver.
- Configure `max` connections carefully based on the server capacity.
- **Example configuration in code**:
  ```typescript
  import { pgTable } from "drizzle-orm/pg-core";
  import { drizzle } from "drizzle-orm/postgres-js";
  import postgres from "postgres";

  const client = postgres(process.env.DATABASE_URL, { max: 20 });
  export const db = drizzle(client);
  ```

## Development Commands

- `npm run pull`: Sync Drizzle schema with the database (Introspection).
- `npm run check`: Run TypeScript compiler to verify schema and relations.
