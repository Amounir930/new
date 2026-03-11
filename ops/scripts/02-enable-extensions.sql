-- ═══════════════════════════════════════════════════════════════
--  Apex V2 — Extension Initialization Script
--  Runs automatically on FIRST database cluster creation only.
--  Enables all required PostgreSQL extensions in all databases.
-- ═══════════════════════════════════════════════════════════════

-- Enable pgvector for AI/Embedding support in apex_v2 (default DB)
CREATE EXTENSION IF NOT EXISTS vector SCHEMA public;

-- Enable pgvector in apex_dev_blank (Atlas dev/migration DB)
\c apex_dev_blank
CREATE EXTENSION IF NOT EXISTS vector SCHEMA public;

-- Return to default DB
\c apex_v2
