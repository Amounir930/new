# 🔐 Apex v2 - Project Vault & Credentials Masterlist
**Classification:** `TOP SECRET - EYES ONLY`
**Generated:** 2026-02-07

---

## 🌍 Production Server Details
- **Provider:** Google Cloud Platform (GCP)
- **Instance Name:** apex-v2-server
- **Public IP:** `[[REDACTED_IP]]`
- **Zone:** `us-central1-a`
- **OS:** Ubuntu 22.04 LTS

### 🔑 SSH Access
- **User:** `apex-v2-dev`
- **Private Key Path:** `C:/Users/Dell/.ssh/id_ed25519_apex`
- **Public Key:** (Added to GCP metadata)

---

## 🗄️ Database Credentials (PostgreSQL)
- **Host:** `localhost` (Internal Docker Network)
- **Port:** `5432`
- **User:** `postgres`
- **Password:** `[[REDACTED_PASSWORD]]` (⚠️ CHANGE FOR PRODUCTION)
- **Database:** `test`
- **URL:** `postgresql://placeholder-user@localhost:5432/db_safe`

---

## 🚀 Cache & Queue (Redis)
- **Host:** `localhost`
- **Port:** `6379`
- **Password:** `[[REDACTED_PASSWORD]]` (⚠️ CHANGE FOR PRODUCTION)
- **URL:** `redis://:placeholder@localhost:6379`

---

## 📦 Object Storage (MinIO / S3)
- **Console URL:** `http://[[REDACTED_IP]]:9001`
- **API URL:** `http://[[REDACTED_IP]]:9000`
- **Root User:** `minioadmin`
- **Root Password:** `[[REDACTED_PASSWORD]]` (⚠️ CHANGE FOR PRODUCTION)
- **Default Bucket:** `apex-assets`

---

## 🛡️ Security Keys
### JWT (JSON Web Token)
- **Secret:** `[[REDACTED_SECRET]]` (⚠️ DEV KEY)
- **Expiry:** `7d`

---

## 📧 Email Testing (Mailpit)
- **SMTP Port:** `1025`
- **Web Interface:** `http://136.111.146.88:8025`

---

> **⚠️ SECURITY WARNING:**
> This file contains sensitive development credentials. 
> For **Production Environment**, referenced passwords MUST be rotated using `openssl rand -hex 32` and stored in a secure `.env` file on the server, not committed to git.
