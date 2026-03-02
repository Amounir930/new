#!/bin/bash
export DATABASE_URL='postgres://apex:ApexV2DBPassSecure2026GrowthScale!QazXswEdCv@172.28.2.2:5432/apex_v2?sslmode=disable'
atlas migrate apply --dir 'file:///opt/apex-v2/migrations' --url "$DATABASE_URL" --allow-dirty
