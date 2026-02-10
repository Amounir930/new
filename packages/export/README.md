# 📦 Tenant Data Export System

## نظام تصدير بيانات المستأجرين

---

## 🎯 Overview

نظام آمن وفعال لتصدير بيانات المستأجرين مع الحفاظ على عزل البيانات (S2) والتدقيق الكامل (S4).

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  POST /api/v1/tenant/export { profile: 'lite'|'native'|'analytics' }
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  ExportStrategyFactory (Strategy Pattern)                    │
│  ├── LiteExportStrategy    → PostgreSQL → JSON              │
│  ├── NativeExportStrategy  → pg_dump -Fc (Binary)           │
│  └── AnalyticsExportStrategy → CSV/Excel                    │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  BullMQ Queue + Redis                                        │
│  • Job: { tenantId, profile, requestedBy }                  │
│  • Concurrency Limit: 1 per tenant                          │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  Export Worker                                               │
│  1. Query tenant schema ONLY (S2 isolation)                 │
│  2. Fetch S3/MinIO assets (tenant prefix only)              │
│  3. Bundle → /export_{tenant}_{timestamp}/                  │
│  4. Compress → .tar.gz                                      │
│  5. Upload to restricted bucket (24h TTL)                   │
│  6. Generate presigned URL → email to admin                 │
│  7. Audit log (S4)                                          │
└─────────────────────────────────────────────────────────────┘
```

---

## ✨ Features

### 1. Export Profiles

| Profile | Format | Use Case | Size |
|---------|--------|----------|------|
| **lite** | JSON | Migration, Backups | Small |
| **native** | pg_dump | PostgreSQL restore | Medium |
| **analytics** | CSV | BI, Reporting | Variable |

### 2. Security (S1-S8 + S14)

- ✅ **S2**: Strict tenant isolation (schema-per-tenant)
- ✅ **S4**: Immutable audit logging
- ✅ **S7**: Presigned URLs with 24h expiry
- ✅ **S14**: Export-specific security gate

### 3. Performance

- **Queue-based**: Non-blocking export processing
- **Throttling**: 1 concurrent export per tenant
- **Compression**: Automatic .tar.gz compression
- **Auto-cleanup**: 24h lifecycle policy

---

## 🚀 Usage

### Request Export

```bash
curl -X POST https://api.60sec.shop/api/v1/tenant/export \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "profile": "lite",
    "includeAssets": true
  }'
```

Response:
```json
{
  "message": "Export job created successfully",
  "job": {
    "id": "uuid",
    "tenantId": "tenant-123",
    "profile": "lite",
    "status": "pending",
    "requestedAt": "2026-02-08T..."
  }
}
```

### Check Status

```bash
curl https://api.60sec.shop/api/v1/tenant/export/{id}/status \
  -H "Authorization: Bearer $TOKEN"
```

### Analytics Export with Date Range

```bash
curl -X POST https://api.60sec.shop/api/v1/tenant/export \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "profile": "analytics",
    "dateRange": {
      "from": "2026-01-01",
      "to": "2026-01-31"
    }
  }'
```

---

## 📊 Bundle Structure

```
export_{tenant}_{timestamp}.tar.gz
├── database/
│   ├── users.json
│   ├── orders.json
│   └── products.json
├── assets/ (optional)
│   ├── logo.png
│   └── products/
└── manifest.json
```

### manifest.json

```json
{
  "tenantId": "tenant-123",
  "exportedAt": "2026-02-08T12:00:00Z",
  "profile": "lite",
  "database": {
    "tables": ["users", "orders", "products"],
    "rowCount": 15000,
    "format": "json"
  },
  "assets": {
    "files": ["logo.png"],
    "totalSize": 2048000
  },
  "version": "1.0.0"
}
```

---

## 🛡️ Security Features

### 1. Tenant Isolation (S2)

```typescript
// Schema-scoped queries only
const schemaName = `tenant_${tenantId}`;
const result = await client.query(
  `SELECT * FROM ${schemaName}.users`  // ✅ Safe
);
```

### 2. Audit Logging (S4)

```typescript
await audit.log({
  action: 'EXPORT_COMPLETED',
  entityType: 'EXPORT',
  entityId: jobId,
  tenantId,
  metadata: { profile, sizeBytes, checksum },
});
```

### 3. Secure URLs + Immediate Cleanup (S7)

```typescript
// Presigned URL with immediate cleanup option
const url = await getSignedUrl(s3Client, command, {
  expiresIn: 24 * 60 * 60,
});

// Client confirms download -> immediate delete
POST /api/v1/tenant/export/{id}/confirm-download
```

**Cleanup Modes:**
| Mode | Trigger | Use Case |
|------|---------|----------|
| **Immediate** | Client calls `confirm-download` | Production (recommended) |
| **Timeout** | 5-minute auto-delete | Development/testing |
| **External** | Upload to client storage | Enterprise integration |

---

## 🔧 Configuration

### Environment Variables

```bash
# Redis (BullMQ)
REDIS_HOST=localhost
REDIS_PORT=6379

# S3/MinIO
MINIO_ENDPOINT=http://localhost:9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_REGION=us-east-1

# Database
DATABASE_URL=postgresql://***REDACTED***
```

---

## 📈 Monitoring

### Queue Metrics

```typescript
// Get queue status
const waiting = await exportQueue.getWaitingCount();
const active = await exportQueue.getActiveCount();
const completed = await exportQueue.getCompletedCount();
```

### Job Progress

```typescript
// Real-time progress updates
await job.updateProgress(50); // 50% complete
```

---

## 🧪 Testing

```bash
# Run S14 security gate
act -j s14-export-security

# Unit tests
bun test packages/export
```

---

## 🎓 CI/CD Integration

### S14 Export Security Gate

```yaml
jobs:
  s14-export:
    uses: ./.github/workflows/s14-export-security-gate.yml
    
  deploy:
    needs: [s1-s8, s9-s13, s14-export]
```

Checks:
- ✅ S2 Tenant Isolation
- ✅ Strategy Pattern Validation
- ✅ Queue Throttling
- ✅ Storage Security
- ✅ Audit Logging
- ✅ Authorization
- ✅ Data Integrity
- ✅ Resource Cleanup

---

## ⚠️ Problems & Solutions

| Problem | Impact | Solution |
|---------|--------|----------|
| **Large Exports** | Memory/timeout issues | ✅ 500MB size limit + 100K row limit per table |
| **Duplicate Requests** | Resource waste | ✅ Deduplication (1 min cooldown) |
| **Failed Cleanup** | Disk space leak | ✅ Cleanup in catch/finally blocks |
| **Concurrent Exports** | DB overload | ✅ 1 per tenant limit + BullMQ queue |
| **Mid-fail Failures** | Partial files left | ✅ Atomic cleanup on any error |
| **Storage Costs** | Accumulating files | ✅ Immediate/5min cleanup |
| **No Download Confirm** | Files left forever | ✅ `confirm-download` endpoint |

---

## 🔄 Comparison: Before vs After

| Aspect | Manual Export | KIMI Export System |
|--------|--------------|-------------------|
| Time | Hours | Minutes |
| Isolation | Risky | S2 Compliant |
| Audit | None | S4 Full Trail |
| Security | Manual | Automated |
| Cleanup | Manual | 24h Auto-delete |
| Queue | None | BullMQ |

---

## 📝 License

MIT - See LICENSE file

---

*Built with 🛡️ security-first principles*
