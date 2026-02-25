# APEX V2: DDL MANIFEST (ENGINE-LEVEL)
This file tracks all custom SQL enforcements, indexes, and extensions NOT managed by Drizzle Kit.

## Custom Extensions
- `pgcrypto`: Used for `gen_ulid` hashing foundations.
- `pg_cron`: Used for scheduled maintenance (Archival, Sweeps).
- `btree_gist`: Required for B2B Pricing Tier EXCLUDE constraints.
- `pg_stat_statements`: Query performance monitoring.

## Custom Triggers & Functions
### Global (public)
- `set_updated_at()`: Uses `CLOCK_TIMESTAMP()` for monotonicity.

### Governance
- `block_audit_log_deletion()`: Triggers `P0002` exception.
- `audit_log_throttle()`: Kill-switch at 1000 events/sec.

### Maintenance
- `sweep_all_tenants(task)`: Automated tenant maintenance executor.

### Storefront
- `enforce_ledger_atomicity()`: `SELECT FOR UPDATE` on wallet transactions.
- `enforce_refund_limit_v3()`: `SELECT FOR NO KEY UPDATE` on order serialization.
- `ensure_outbox_partition()`: Dynamic on-the-fly partition creation.
- `block_consent_mutation()`: Append-only enforcement for `customer_consents`.
- `is_valid_ulid()`: Guard for B-Tree fragmentation.

## Physical Locks
- `FORCE ROW LEVEL SECURITY`: Enabled on all tenant tables.
- `REVOKE ALL ON SCHEMA vault`: Access restricted to root/super_admin.
- `REVOKE CREATE ON SCHEMA public`: Locked public schema.
- `RULE no_update`: Immutability for consents and blueprints.
- `CHECK (timezone = 0)`: Forced UTC on temporal columns.
