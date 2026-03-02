-- Current sql file was generated after introspecting the database
-- If you want to run this migration please uncomment this code before executing migrations
/*
CREATE TYPE "public"."actor_type" AS ENUM('super_admin', 'tenant_admin', 'system');--> statement-breakpoint
CREATE TYPE "public"."affiliate_status" AS ENUM('active', 'pending', 'suspended');--> statement-breakpoint
CREATE TYPE "public"."affiliate_tx_status" AS ENUM('pending', 'approved', 'paid', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."audit_result_enum" AS ENUM('SUCCESS', 'FAILURE');--> statement-breakpoint
CREATE TYPE "public"."b2b_company_status" AS ENUM('active', 'pending', 'suspended');--> statement-breakpoint
CREATE TYPE "public"."b2b_user_role" AS ENUM('admin', 'buyer', 'viewer');--> statement-breakpoint
CREATE TYPE "public"."blueprint_status" AS ENUM('active', 'paused');--> statement-breakpoint
CREATE TYPE "public"."consent_channel" AS ENUM('email', 'sms', 'push', 'whatsapp');--> statement-breakpoint
CREATE TYPE "public"."discount_applies_to" AS ENUM('all', 'specific_products', 'specific_categories', 'specific_customers');--> statement-breakpoint
CREATE TYPE "public"."discount_type" AS ENUM('percentage', 'fixed', 'buy_x_get_y', 'free_shipping');--> statement-breakpoint
CREATE TYPE "public"."dunning_status" AS ENUM('pending', 'retried', 'failed', 'recovered');--> statement-breakpoint
CREATE TYPE "public"."fulfillment_status" AS ENUM('pending', 'shipped', 'in_transit', 'delivered', 'failed');--> statement-breakpoint
CREATE TYPE "public"."inventory_movement_type" AS ENUM('in', 'out', 'adjustment', 'return', 'transfer');--> statement-breakpoint
CREATE TYPE "public"."invoice_status" AS ENUM('draft', 'issued', 'paid', 'overdue');--> statement-breakpoint
CREATE TYPE "public"."lead_status" AS ENUM('new', 'contacted', 'qualified', 'converted');--> statement-breakpoint
CREATE TYPE "public"."location_type" AS ENUM('warehouse', 'retail', 'dropship');--> statement-breakpoint
CREATE TYPE "public"."order_source" AS ENUM('web', 'mobile', 'b2b', 'pos');--> statement-breakpoint
CREATE TYPE "public"."order_status" AS ENUM('draft', 'awaiting_approval', 'pending', 'processing', 'shipped', 'delivered', 'cancelled', 'returned');--> statement-breakpoint
CREATE TYPE "public"."outbox_status" AS ENUM('pending', 'processing', 'completed', 'failed');--> statement-breakpoint
CREATE TYPE "public"."payment_method" AS ENUM('card', 'cod', 'wallet', 'bnpl', 'bank_transfer');--> statement-breakpoint
CREATE TYPE "public"."payment_status" AS ENUM('pending', 'paid', 'partially_refunded', 'refunded', 'failed');--> statement-breakpoint
CREATE TYPE "public"."purchase_order_status" AS ENUM('draft', 'ordered', 'partial', 'received', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."refund_status" AS ENUM('pending', 'processed', 'failed');--> statement-breakpoint
CREATE TYPE "public"."reservation_status" AS ENUM('active', 'converted', 'expired');--> statement-breakpoint
CREATE TYPE "public"."rma_condition" AS ENUM('new', 'opened', 'damaged');--> statement-breakpoint
CREATE TYPE "public"."rma_reason_code" AS ENUM('defective', 'wrong_item', 'changed_mind', 'not_as_described', 'damaged_in_transit');--> statement-breakpoint
CREATE TYPE "public"."rma_resolution" AS ENUM('refund', 'exchange', 'store_credit');--> statement-breakpoint
CREATE TYPE "public"."rma_status" AS ENUM('requested', 'approved', 'shipped', 'received', 'completed', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."severity_enum" AS ENUM('INFO', 'WARNING', 'CRITICAL', 'SECURITY_ALERT');--> statement-breakpoint
CREATE TYPE "public"."tenant_niche" AS ENUM('retail', 'wellness', 'education', 'services', 'hospitality', 'real-estate', 'creative');--> statement-breakpoint
CREATE TYPE "public"."tenant_plan" AS ENUM('free', 'basic', 'pro', 'enterprise');--> statement-breakpoint
CREATE TYPE "public"."tenant_status" AS ENUM('active', 'suspended', 'pending', 'archived');--> statement-breakpoint
CREATE TYPE "public"."transfer_status" AS ENUM('draft', 'in_transit', 'received', 'cancelled');--> statement-breakpoint
CREATE TABLE "spatial_ref_sys" (
	"srid" integer PRIMARY KEY NOT NULL,
	"auth_name" varchar(256),
	"auth_srid" integer,
	"srtext" varchar(2048),
	"proj4text" varchar(2048),
	CONSTRAINT "spatial_ref_sys_srid_check" CHECK ((srid > 0) AND (srid <= 998999))
);
--> statement-breakpoint
CREATE TABLE "part_config" (
	"parent_table" text PRIMARY KEY NOT NULL,
	"control" text NOT NULL,
	"partition_type" text NOT NULL,
	"partition_interval" text NOT NULL,
	"constraint_cols" text[],
	"premake" integer DEFAULT 4 NOT NULL,
	"optimize_trigger" integer DEFAULT 4 NOT NULL,
	"optimize_constraint" integer DEFAULT 30 NOT NULL,
	"epoch" text DEFAULT 'none' NOT NULL,
	"inherit_fk" boolean DEFAULT true NOT NULL,
	"retention" text,
	"retention_schema" text,
	"retention_keep_table" boolean DEFAULT true NOT NULL,
	"retention_keep_index" boolean DEFAULT true NOT NULL,
	"infinite_time_partitions" boolean DEFAULT false NOT NULL,
	"datetime_string" text,
	"automatic_maintenance" text DEFAULT 'on' NOT NULL,
	"jobmon" boolean DEFAULT true NOT NULL,
	"sub_partition_set_full" boolean DEFAULT false NOT NULL,
	"undo_in_progress" boolean DEFAULT false NOT NULL,
	"trigger_exception_handling" boolean DEFAULT false,
	"upsert" text DEFAULT '' NOT NULL,
	"trigger_return_null" boolean DEFAULT true NOT NULL,
	"template_table" text,
	"publications" text[],
	"inherit_privileges" boolean DEFAULT false,
	"constraint_valid" boolean DEFAULT true NOT NULL,
	"subscription_refresh" text,
	"drop_cascade_fk" boolean DEFAULT false NOT NULL,
	"ignore_default_data" boolean DEFAULT false NOT NULL,
	CONSTRAINT "positive_premake_check" CHECK (premake > 0),
	CONSTRAINT "publications_no_empty_set_chk" CHECK (publications <> '{}'::text[]),
	CONSTRAINT "control_constraint_col_chk" CHECK ((constraint_cols @> ARRAY[control]) <> true),
	CONSTRAINT "retention_schema_not_empty_chk" CHECK (retention_schema <> ''::text),
	CONSTRAINT "part_config_automatic_maintenance_check" CHECK (CHECK (check_automatic_maintenance_value(automatic_maintenance),
	CONSTRAINT "part_config_epoch_check" CHECK (CHECK (check_epoch_type(epoch),
	CONSTRAINT "part_config_type_check" CHECK (CHECK (check_partition_type(partition_type)
);
--> statement-breakpoint
CREATE TABLE "part_config_sub" (
	"sub_parent" text PRIMARY KEY NOT NULL,
	"sub_partition_type" text NOT NULL,
	"sub_control" text NOT NULL,
	"sub_partition_interval" text NOT NULL,
	"sub_constraint_cols" text[],
	"sub_premake" integer DEFAULT 4 NOT NULL,
	"sub_optimize_trigger" integer DEFAULT 4 NOT NULL,
	"sub_optimize_constraint" integer DEFAULT 30 NOT NULL,
	"sub_epoch" text DEFAULT 'none' NOT NULL,
	"sub_inherit_fk" boolean DEFAULT true NOT NULL,
	"sub_retention" text,
	"sub_retention_schema" text,
	"sub_retention_keep_table" boolean DEFAULT true NOT NULL,
	"sub_retention_keep_index" boolean DEFAULT true NOT NULL,
	"sub_infinite_time_partitions" boolean DEFAULT false NOT NULL,
	"sub_automatic_maintenance" text DEFAULT 'on' NOT NULL,
	"sub_jobmon" boolean DEFAULT true NOT NULL,
	"sub_trigger_exception_handling" boolean DEFAULT false,
	"sub_upsert" text DEFAULT '' NOT NULL,
	"sub_trigger_return_null" boolean DEFAULT true NOT NULL,
	"sub_template_table" text,
	"sub_inherit_privileges" boolean DEFAULT false,
	"sub_constraint_valid" boolean DEFAULT true NOT NULL,
	"sub_subscription_refresh" text,
	"sub_date_trunc_interval" text,
	"sub_ignore_default_data" boolean DEFAULT false NOT NULL,
	CONSTRAINT "positive_premake_check" CHECK (sub_premake > 0),
	CONSTRAINT "control_constraint_col_chk" CHECK ((sub_constraint_cols @> ARRAY[sub_control]) <> true),
	CONSTRAINT "retention_schema_not_empty_chk" CHECK (sub_retention_schema <> ''::text),
	CONSTRAINT "part_config_sub_automatic_maintenance_check" CHECK (CHECK (check_automatic_maintenance_value(sub_automatic_maintenance),
	CONSTRAINT "part_config_sub_epoch_check" CHECK (CHECK (check_epoch_type(sub_epoch),
	CONSTRAINT "part_config_sub_type_check" CHECK (CHECK (check_partition_type(sub_partition_type)
);
--> statement-breakpoint
CREATE TABLE "custom_time_partitions" (
	"parent_table" text NOT NULL,
	"child_table" text NOT NULL,
	"partition_range" "tstzrange" NOT NULL,
	CONSTRAINT "custom_time_partitions_pkey" PRIMARY KEY("parent_table","child_table")
);
--> statement-breakpoint
ALTER TABLE "part_config_sub" ADD CONSTRAINT "part_config_sub_sub_parent_fkey" FOREIGN KEY ("sub_parent") REFERENCES "public"."part_config"("parent_table") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
CREATE INDEX "part_config_type_idx" ON "part_config" USING btree ("partition_type" text_ops);--> statement-breakpoint
CREATE INDEX "custom_time_partitions_partition_range_idx" ON "custom_time_partitions" USING gist ("partition_range" range_ops);--> statement-breakpoint
CREATE VIEW "public"."geography_columns" AS (SELECT current_database() AS f_table_catalog, n.nspname AS f_table_schema, c.relname AS f_table_name, a.attname AS f_geography_column, postgis_typmod_dims(a.atttypmod) AS coord_dimension, postgis_typmod_srid(a.atttypmod) AS srid, postgis_typmod_type(a.atttypmod) AS type FROM pg_class c, pg_attribute a, pg_type t, pg_namespace n WHERE t.typname = 'geography'::name AND a.attisdropped = false AND a.atttypid = t.oid AND a.attrelid = c.oid AND c.relnamespace = n.oid AND (c.relkind = ANY (ARRAY['r'::"char", 'v'::"char", 'm'::"char", 'f'::"char", 'p'::"char"])) AND NOT pg_is_other_temp_schema(c.relnamespace) AND has_table_privilege(c.oid, 'SELECT'::text));--> statement-breakpoint
CREATE VIEW "public"."geometry_columns" AS (SELECT current_database()::character varying(256) AS f_table_catalog, n.nspname AS f_table_schema, c.relname AS f_table_name, a.attname AS f_geometry_column, COALESCE(postgis_typmod_dims(a.atttypmod), sn.ndims, 2) AS coord_dimension, COALESCE(NULLIF(postgis_typmod_srid(a.atttypmod), 0), sr.srid, 0) AS srid, replace(replace(COALESCE(NULLIF(upper(postgis_typmod_type(a.atttypmod)), 'GEOMETRY'::text), st.type, 'GEOMETRY'::text), 'ZM'::text, ''::text), 'Z'::text, ''::text)::character varying(30) AS type FROM pg_class c JOIN pg_attribute a ON a.attrelid = c.oid AND NOT a.attisdropped JOIN pg_namespace n ON c.relnamespace = n.oid JOIN pg_type t ON a.atttypid = t.oid LEFT JOIN ( SELECT s.connamespace, s.conrelid, s.conkey, replace(split_part(s.consrc, ''''::text, 2), ')'::text, ''::text) AS type FROM ( SELECT pg_constraint.connamespace, pg_constraint.conrelid, pg_constraint.conkey, pg_get_constraintdef(pg_constraint.oid) AS consrc FROM pg_constraint) s WHERE s.consrc ~~* '%geometrytype(% = %'::text) st ON st.connamespace = n.oid AND st.conrelid = c.oid AND (a.attnum = ANY (st.conkey)) LEFT JOIN ( SELECT s.connamespace, s.conrelid, s.conkey, replace(split_part(s.consrc, ' = '::text, 2), ')'::text, ''::text)::integer AS ndims FROM ( SELECT pg_constraint.connamespace, pg_constraint.conrelid, pg_constraint.conkey, pg_get_constraintdef(pg_constraint.oid) AS consrc FROM pg_constraint) s WHERE s.consrc ~~* '%ndims(% = %'::text) sn ON sn.connamespace = n.oid AND sn.conrelid = c.oid AND (a.attnum = ANY (sn.conkey)) LEFT JOIN ( SELECT s.connamespace, s.conrelid, s.conkey, replace(replace(split_part(s.consrc, ' = '::text, 2), ')'::text, ''::text), '('::text, ''::text)::integer AS srid FROM ( SELECT pg_constraint.connamespace, pg_constraint.conrelid, pg_constraint.conkey, pg_get_constraintdef(pg_constraint.oid) AS consrc FROM pg_constraint) s WHERE s.consrc ~~* '%srid(% = %'::text) sr ON sr.connamespace = n.oid AND sr.conrelid = c.oid AND (a.attnum = ANY (sr.conkey)) WHERE (c.relkind = ANY (ARRAY['r'::"char", 'v'::"char", 'm'::"char", 'f'::"char", 'p'::"char"])) AND NOT c.relname = 'raster_columns'::name AND t.typname = 'geometry'::name AND NOT pg_is_other_temp_schema(c.relnamespace) AND has_table_privilege(c.oid, 'SELECT'::text));--> statement-breakpoint
CREATE VIEW "public"."table_privs" AS (SELECT u_grantor.rolname AS grantor, grantee.rolname AS grantee, nc.nspname AS table_schema, c.relname AS table_name, c.prtype AS privilege_type FROM ( SELECT pg_class.oid, pg_class.relname, pg_class.relnamespace, pg_class.relkind, pg_class.relowner, (aclexplode(COALESCE(pg_class.relacl, acldefault('r'::"char", pg_class.relowner)))).grantor AS grantor, (aclexplode(COALESCE(pg_class.relacl, acldefault('r'::"char", pg_class.relowner)))).grantee AS grantee, (aclexplode(COALESCE(pg_class.relacl, acldefault('r'::"char", pg_class.relowner)))).privilege_type AS privilege_type, (aclexplode(COALESCE(pg_class.relacl, acldefault('r'::"char", pg_class.relowner)))).is_grantable AS is_grantable FROM pg_class) c(oid, relname, relnamespace, relkind, relowner, grantor, grantee, prtype, grantable), pg_namespace nc, pg_roles u_grantor, ( SELECT pg_roles.oid, pg_roles.rolname FROM pg_roles UNION ALL SELECT 0::oid AS oid, 'PUBLIC'::name) grantee(oid, rolname) WHERE c.relnamespace = nc.oid AND (c.relkind = ANY (ARRAY['r'::"char", 'v'::"char", 'p'::"char"])) AND c.grantee = grantee.oid AND c.grantor = u_grantor.oid AND (c.prtype = ANY (ARRAY['INSERT'::text, 'SELECT'::text, 'UPDATE'::text, 'DELETE'::text, 'TRUNCATE'::text, 'REFERENCES'::text, 'TRIGGER'::text])) AND (pg_has_role(u_grantor.oid, 'USAGE'::text) OR pg_has_role(grantee.oid, 'USAGE'::text) OR grantee.rolname = 'PUBLIC'::name));
*/