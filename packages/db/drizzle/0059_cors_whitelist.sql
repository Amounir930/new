-- 🚨 Audit 999 Security Hardening: 0059_cors_whitelist.sql

-- 1. Dynamic CORS Whitelist (Audit Point #25)
CREATE TABLE IF NOT EXISTS governance.cors_whitelist (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES governance.tenants(id),
    origin TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(tenant_id, origin)
);

-- Seed defaults for public app
INSERT INTO governance.cors_whitelist (origin) 
VALUES ('https://60sec.shop'), ('https://app.60sec.shop')
ON CONFLICT DO NOTHING;
