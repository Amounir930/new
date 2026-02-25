-- 🚨 Audit 999 Performance Hardening: 0056_denormalized_quotas.sql

            USING ERRCODE = 'P0002';
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Counter Maintenance Trigger
CREATE OR REPLACE FUNCTION governance.maintain_tenant_quota_counters()
RETURNS TRIGGER AS $$
DECLARE
    tenant_id_val UUID;
    delta INT;
BEGIN
    delta := CASE WHEN (TG_OP = 'INSERT') THEN 1 ELSE -1 END;
    
    -- Resolve tenant_id
    IF (TG_OP = 'INSERT') THEN
        tenant_id_val := NEW.tenant_id;
    ELSE
        tenant_id_val := OLD.tenant_id;
    END IF;

    IF TG_TABLE_NAME = 'products' THEN
        -- Mandate #56: Atomic counter update (Audit 444)
        UPDATE governance.tenant_quotas 
        SET current_products_count = current_products_count + delta 
        WHERE tenant_id = tenant_id_val;
    ELSIF TG_TABLE_NAME = 'orders' THEN
        UPDATE governance.tenant_quotas 
        SET current_orders_count = current_orders_count + delta 
        WHERE tenant_id = tenant_id_val;
    END IF;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Bootstrap Counters (Point #7) - Hardened for concurrency
DO $$
BEGIN
    -- Only update if there's a mismatch to reduce bloat
    UPDATE governance.tenant_quotas q
    SET current_products_count = (SELECT count(*) FROM storefront.products p WHERE p.tenant_id = q.tenant_id AND p.deleted_at IS NULL),
        current_orders_count = (SELECT count(*) FROM storefront.orders o WHERE o.tenant_id = q.tenant_id AND o.deleted_at IS NULL)
    WHERE (current_products_count != (SELECT count(*) FROM storefront.products p WHERE p.tenant_id = q.tenant_id AND p.deleted_at IS NULL)
       OR current_orders_count != (SELECT count(*) FROM storefront.orders o WHERE o.tenant_id = q.tenant_id AND o.deleted_at IS NULL));
END $$;
