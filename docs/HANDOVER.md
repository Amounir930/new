# Production Handover & Operations Guide 🚀

This document provides all essential information for managing the Apex v2 production environment.

## 🖥️ Server Infrastructure
- **Server IP:** `34.102.121.225`
- **Provider:** Google Cloud Platform (GCP)
- **Environment:** Ubuntu Linux
- **Project Root:** `/opt/apex-v2`
- **SSH Access:** `ssh -i ops/keys/apex-deploy deploy@34.102.121.225`

## 🌐 DNS & Domains
The following records are configured at the registrar:

| Type | Host | Value | Purpose |
| :--- | :--- | :--- | :--- |
| **A** | `@` | `34.102.121.225` | Root Domain (`60sec.shop`) |
| **A** | `api` | `34.102.121.225` | API Endpoint (`api.60sec.shop`) |
| **A** | `*` | `34.102.121.225` | Wildcard Tenants (`*.60sec.shop`) |
| **A** | `super-admin`| `34.102.121.225` | Administration UI |
| **A** | `www` | `34.102.121.225` | WWW Redirect |

## 🚀 Deployment Methodology
We use an **Artifact-Driven Deployment** strategy. The system builds the code into compiled JavaScript before execution to ensure stability and proper metadata handling.

### Redeploy Command:
Run from the local root directory:
```bash
ssh -i ops/keys/apex-deploy -o StrictHostKeyChecking=no deploy@34.102.121.225 "cd /opt/apex-v2 && git reset --hard && git pull && sudo docker build -t ghcr.io/amounir930/adel/api:latest -f apps/api/Dockerfile . && sudo docker compose --env-file .env -f ops/docker-compose.prod.yml up -d --force-recreate api"
```

## 🔐 Security Protocols (S1-S8)
The system is strictly hardened according to Apex v2 security standards:
- **S1/S7:** High-entropy encryption keys with strict complexity regex.
- **S3/S14:** Secure data export with SQL injection protection.
- **S8:** Hardened security headers via Traefik & Helmet.
- **S2:** Deep tenant isolation via PostgreSQL schema resolution.

## 🛠️ Management & Monitoring
- **View Logs:** `sudo docker logs -f ops-api-1`
- **Resource Usage:** `sudo docker stats`
- **Restart Services:** `sudo docker compose -f ops/docker-compose.prod.yml restart`

---
*Documented on 2026-02-13* 🍏🚀✨🏁
