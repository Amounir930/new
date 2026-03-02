#!/bin/bash
export PGPASSWORD='ApexV2DBPassSecure2026GrowthScale!QazXswEdCv'
cat /opt/apex-v2/packages/db/consolidated_hardening.sql | docker exec -i apex-postgres psql -U apex -d apex_v2
