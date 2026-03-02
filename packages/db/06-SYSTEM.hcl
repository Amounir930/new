// 5. SYSTEM & LOGS (Storefront)
// ==========================================
table "outbox_events" {
  schema = schema.storefront
  column "id" {
    type    = uuid
    default = sql("public.gen_ulid()::uuid")
  }
  column "tenant_id" {
    type = uuid
  }
  column "created_at" {
    type    = timestamptz
    default = sql("now()")
  }
  column "processed_at" {
    type = timestamptz
    null = true
  }
  column "retry_count" {
    type    = int
    default = 0
  }
  column "status" {
    type    = enum.outbox_status
    default = "pending"
  }
  column "event_type" {
    type = varchar(100)
  }
  column "aggregate_type" {
    type = varchar(50)
    null = true
  }
  column "aggregate_id" {
    type = uuid
    null = true
  }
  column "payload" {
    type = jsonb
  }
  // Strike 20: OpenTelemetry Trace ID for distributed AI training
  column "trace_id" {
    type = varchar(100)
    null = true
  }
  // Strike 09: Outbox Locking for horizontal scaling
  column "locked_by" {
    type = varchar(100)
    null = true
  }
  column "locked_at" {
    type = timestamptz
    null = true
  }
  check "chk_payload_size" {
    expr = "(pg_column_size(payload) <= 524288)"
  }
  primary_key {
    columns = [column.id, column.created_at]
  }
  partition {
    type    = RANGE
    columns = [column.created_at]
  }
  storage_params {
    name                            = "toast_tuple_target"
    value                           = "128"
    fillfactor                      = 70
    autovacuum_vacuum_scale_factor  = 0.01
    autovacuum_analyze_scale_factor = 0.005
  }
  index "idx_outbox_pending" {
    columns = [column.status, column.created_at]
    where   = "status ='pending'"
  }
  index "idx_outbox_created_brin" {
    columns = [column.created_at]
    type = "BRIN"
    storage_params {
      name  = "pages_per_range"
      value = "32"
    }
  }
  index "idx_outbox_events_tenant_active" {
    columns = [column.tenant_id]
  }
  trigger "trg_outbox_prevent_hijack" {
    on {
      table = table.outbox_events
    }
    before  = true
    update  = true
    foreach = ROW
    execute {
      function = function.prevent_tenant_hijacking
    }
  }
}
table "tenant_config" {
  schema = schema.storefront
  column "key" {
    type = varchar(100)
  }
  column "tenant_id" {
    type = uuid
  }
  column "value" {
    type = jsonb
  }
  column "updated_at" {
    type    = timestamptz
    default = sql("now()")
  }
  primary_key {
    columns = [column.key, column.tenant_id]
  }
  // Strike 05: Key Injection Protection
  check "chk_config_key" {
    expr = "key ~ '^[a-zA-Z0-9_]+$'"
  }
  check "chk_tc_value_size" {
    expr = "pg_column_size(value) <= 102400"
  }
  index "idx_tenant_config_tenant_active" {
    columns = [column.tenant_id]
  }
  trigger "trg_tenant_config_updated_at" {
    on {
      table = table.tenant_config
    }
    before  = true
    update  = true
    foreach = ROW
    execute {
      function = function.set_current_timestamp_updated_at
    }
  }
  trigger "trg_tenant_config_prevent_hijack" {
    on {
      table = table.tenant_config
    }
    before  = true
    update  = true
    foreach = ROW
    execute {
      function = function.prevent_tenant_hijacking
    }
  }
}
table "markets" {
  schema = schema.storefront
  column "id" {
    type    = uuid
    default = sql("public.gen_ulid()::uuid")
  }
  column "tenant_id" {
    type = uuid
  }
  column "created_at" {
    type    = timestamptz
    default = sql("now()")
  }
  column "is_primary" {
    type    = boolean
    default = false
  }
  column "is_active" {
    type    = boolean
    default = true
  }
  column "default_currency" {
    type = char(3)
  }
  column "default_language" {
    type    = char(2)
    default = "ar"
  }
  column "name" {
    type = jsonb
  }
  column "countries" {
    type = jsonb
  }
  primary_key {
    columns = [column.id]
  }
  index "uq_tenant_primary_market" {
    unique  = true
    columns = [column.tenant_id]
    where   = "is_primary =true"
  }
  index "idx_markets_tenant_active" {
    columns = [column.tenant_id]
  }
  // ALTER TABLE storefront.markets ENABLE ROW LEVEL SECURITY

  trigger "trg_markets_prevent_hijack" {
    on {
      table = table.markets
    }
    before  = true
    update  = true
    foreach = ROW
    execute {
      function = function.prevent_tenant_hijacking
    }
  }
}
table "price_lists" {
  schema = schema.storefront
  column "id" {
    type    = uuid
    default = sql("public.gen_ulid()::uuid")
  }
  column "tenant_id" {
    type = uuid
  }
  column "market_id" {
    type = uuid
  }
  column "product_id" {
    type = uuid
    null = true
  }
  column "variant_id" {
    type = uuid
    null = true
  }

  column "quantity_range" {
    type = sql("int4range")
    null = false
  }

  column "price" {
    type = sql("public.money_amount")
  }
  column "compare_at_price" {
    type = sql("public.money_amount")
    null = true
  }
  primary_key {
    columns = [column.id]
  }
  check "chk_pl_inner_not_null" {
    expr = "(price).amount IS NOT NULL AND (price).currency IS NOT NULL"
  }
  index "idx_price_lists_tenant_active" {
    columns = [column.tenant_id]
  }
  trigger "trg_price_lists_validate_currency" {
    on {
      table = table.price_lists
    }
    before  = true
    insert  = true
    update  = true
    foreach = ROW
    execute {
      function = function.validate_price_currency
    }
  }

  // ELITE: Prevent overlapping quantity ranges for same product/variant/market
  exclude "idx_price_list_overlap_prevent" {
    columns = [column.tenant_id, column.market_id, column.product_id, column.variant_id, column.quantity_range]
    type = "GIST"
    ops     = ["=", "=", "=", "=", "&&"]
    where   = "variant_id IS NOT NULL"
  }

  // Strike 04: Cross-Tenant Pricing Fix (Composite FK)
  foreign_key "fk_pl_market" {
    columns     = [column.tenant_id, column.market_id]
    ref_columns = [table.markets.column.tenant_id, table.markets.column.id]
    on_delete   = "RESTRICT"
  }
  check "chk_pl_price_inner" {
    expr = "(price).amount IS NOT NULL AND (price).currency IS NOT NULL"
  }
  trigger "trg_price_lists_prevent_hijack" {
    on {
      table = table.price_lists
    }
    before  = true
    update  = true
    foreach = ROW
    execute {
      function = function.prevent_tenant_hijacking
    }
  }
}
table "currency_rates" {
  schema = schema.storefront
  column "id" {
    type    = uuid
    default = sql("public.gen_ulid()::uuid")
  }
  column "tenant_id" {
    type = uuid
  }
  column "updated_at" {
    type    = timestamptz
    default = sql("now()")
  }
  column "from_currency" {
    type = char(3)
  }
  column "to_currency" {
    type = char(3)
  }
  column "rate" {
    type = numeric(12,6)
  }
  primary_key {
    columns = [column.id]
  }
  unique "uq_tenant_currency_pair" {
    columns = [column.tenant_id, column.from_currency, column.to_currency]
  }
  index "idx_currency_rates_tenant_active" {
    columns = [column.tenant_id]
  }
  trigger "trg_currency_rates_updated_at" {
    on {
      table = table.currency_rates
    }
    before  = true
    update  = true
    foreach = ROW
    execute {
      function = function.set_current_timestamp_updated_at
    }
  }
  trigger "trg_currency_rates_prevent_hijack" {
    on {
      table = table.currency_rates
    }
    before  = true
    update  = true
    foreach = ROW
    execute {
      function = function.prevent_tenant_hijacking
    }
  }
}

