const fs = require('node:fs');
const path = require('node:path');

const dumpPath = path.join(
  __dirname,
  'drizzle',
  '0001_wakeful_gamma_corps.sql'
);
const destPath = path.join(
  __dirname,
  'drizzle',
  '0006_phase8_commerce_completion.sql'
);

if (!fs.existsSync(dumpPath)) {
  console.error('Dump not found:', dumpPath);
  process.exit(1);
}

const sql = fs.readFileSync(dumpPath, 'utf8');

const tablesToExtract = [
  'tax_rules',
  'customer_consents',
  'customer_segments',
  'payment_methods',
  'affiliate_partners',
  'affiliate_transactions',
  'app_installations',
  'b2b_companies',
  'b2b_pricing_tiers',
  'b2b_users',
  'webhook_subscriptions',
  'rma_items',
  'rma_requests',
  'staff_members',
  'staff_roles',
  'staff_sessions',
];

const enums = [
  'b2b_company_status',
  'b2b_user_role',
  'affiliate_status',
  'affiliate_tx_status',
  'rma_reason_code',
  'rma_condition',
  'rma_resolution',
];

let outputSql = '-- Phase 8 Commerce Completion Migration\n\n';

// Extract Types/Enums
const typeRegex = /CREATE TYPE "[^"]+" AS ENUM\([^)]+\);/g;
const matchedTypes = sql.match(typeRegex);
if (matchedTypes) {
  for (const t of matchedTypes) {
    for (const e of enums) {
      if (t.includes(`"${e}"`)) {
        outputSql += `${t}\n--> statement-breakpoint\n`;
      }
    }
  }
}

// Extract Tables
for (const table of tablesToExtract) {
  const pattern = new RegExp(`CREATE TABLE "${table}" \\(.*?\\);`, 's');
  const match = sql.match(pattern);
  if (match) {
    // Add storefront schema explicitly
    const tableSql = match[0].replace(
      `CREATE TABLE "${table}" (`,
      `CREATE TABLE "storefront"."${table}" (`
    );
    outputSql += `${tableSql}\n--> statement-breakpoint\n`;
  }
}

// Extract Indexes
for (const table of tablesToExtract) {
  const pattern = new RegExp(
    `CREATE (UNIQUE )?INDEX .*? ON "${table}".*?;`,
    'g'
  );
  const matches = sql.match(pattern);
  if (matches) {
    for (const m of matches) {
      const indexSql = m.replace(
        ` ON "${table}"`,
        ` ON "storefront"."${table}"`
      );
      outputSql += `${indexSql}\n--> statement-breakpoint\n`;
    }
  }
}

// Alters
const alters = `
ALTER TABLE "storefront"."customers" ADD COLUMN IF NOT EXISTS "total_spent" "money_amount" DEFAULT '(0,SAR)'::money_amount NOT NULL;
ALTER TABLE "storefront"."customers" ADD COLUMN IF NOT EXISTS "total_orders" integer DEFAULT 0 NOT NULL;
ALTER TABLE "storefront"."customers" ADD COLUMN IF NOT EXISTS "last_order_at" timestamp (6) with time zone;
ALTER TABLE "storefront"."customers" ADD COLUMN IF NOT EXISTS "gender" text;
ALTER TABLE "storefront"."customers" ADD COLUMN IF NOT EXISTS "language" text DEFAULT 'ar' NOT NULL;
ALTER TABLE "storefront"."customers" ADD COLUMN IF NOT EXISTS "date_of_birth" timestamp with time zone;
--> statement-breakpoint
ALTER TABLE "storefront"."orders" ADD COLUMN IF NOT EXISTS "risk_score" integer DEFAULT 0 NOT NULL;
ALTER TABLE "storefront"."orders" ADD COLUMN IF NOT EXISTS "payment_method" text;
ALTER TABLE "storefront"."orders" ADD COLUMN IF NOT EXISTS "coupon_code" text;
ALTER TABLE "storefront"."orders" ADD COLUMN IF NOT EXISTS "cancel_reason" text;
ALTER TABLE "storefront"."orders" ADD COLUMN IF NOT EXISTS "ip_address" text;
ALTER TABLE "storefront"."orders" ADD COLUMN IF NOT EXISTS "user_agent" text;
ALTER TABLE "storefront"."orders" ADD COLUMN IF NOT EXISTS "tags" text[] DEFAULT '{}'::text[] NOT NULL;
--> statement-breakpoint
ALTER TABLE "storefront"."order_items" ADD COLUMN IF NOT EXISTS "fulfilled_quantity" integer DEFAULT 0 NOT NULL;
ALTER TABLE "storefront"."order_items" ADD COLUMN IF NOT EXISTS "returned_quantity" integer DEFAULT 0 NOT NULL;
ALTER TABLE "storefront"."order_items" ADD COLUMN IF NOT EXISTS "tax_lines" jsonb DEFAULT '[]'::jsonb NOT NULL;
ALTER TABLE "storefront"."order_items" ADD COLUMN IF NOT EXISTS "discount_allocations" jsonb DEFAULT '[]'::jsonb NOT NULL;
--> statement-breakpoint
ALTER TABLE "storefront"."abandoned_checkouts" ADD COLUMN IF NOT EXISTS "customer_id" uuid;
ALTER TABLE "storefront"."abandoned_checkouts" ADD COLUMN IF NOT EXISTS "subtotal" "money_amount";
ALTER TABLE "storefront"."abandoned_checkouts" ADD COLUMN IF NOT EXISTS "recovery_email_sent" boolean DEFAULT false NOT NULL;
ALTER TABLE "storefront"."abandoned_checkouts" ADD COLUMN IF NOT EXISTS "recovered_at" timestamp (6) with time zone;
--> statement-breakpoint
`;

outputSql += alters;

// Extract constraints
const constraintRegex = /ALTER TABLE "[^"]+" ADD CONSTRAINT .*?;/g;
const constraintMatches = sql.match(constraintRegex);
if (constraintMatches) {
  for (const c of constraintMatches) {
    for (const table of tablesToExtract) {
      if (c.includes(`ALTER TABLE "${table}" ADD CONSTRAINT`)) {
        const constraintSql = c.replace(
          `ALTER TABLE "${table}"`,
          `ALTER TABLE "storefront"."${table}"`
        );
        outputSql += `${constraintSql}\n--> statement-breakpoint\n`;
      }
    }
  }
}

fs.writeFileSync(destPath, outputSql, 'utf8');
console.log(
  'Successfully extracted schemas to 0006_phase8_commerce_completion.sql'
);
