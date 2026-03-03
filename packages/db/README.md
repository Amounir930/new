# `@apex/db` — Database Package

> **قاعدة البيانات هي دستور المشروع المقدس.**
> الملف الوحيد المسموح تعديل الـ schema منه هو `drizzle/schema.ts` — وفقط بعد تطبيق migration جديد.

---

## 🗺️ هيكل المجلد

```
packages/db/
├── drizzle/                       ← ✅ المصدر الوحيد للحقيقة
│   ├── 0001_baseline.sql          ← Schema كامل (Core Tables, Types, Extensions)
│   ├── 0002_security_hardening.sql
│   ├── 0003_definitive_hardening.sql
│   ├── 0004_phase1_infrastructure.sql
│   ├── 0005_commerce_completion.sql
│   ├── 0006_financial_and_data_integrity.sql
│   ├── 0007_isolation_and_security_hardening.sql
│   ├── 0008_infrastructure_and_performance_tuning.sql
│   ├── 0009_critical_fixes.sql
│   ├── 0010_public_schema_isolation.sql
│   ├── 0011_definitive_security_batch.sql
│   │
│   ├── schema.ts                  ← ORM layer (مُولَّد تلقائياً من قاعدة البيانات)
│   ├── relations.ts               ← تعريفات العلاقات (مُولَّد تلقائياً)
│   └── custom_types.ts            ← Custom TypeScript types
│
├── src/
│   ├── index.ts                   ← Database connection pools (adminDb, tenantDb)
│   └── run-migrate.ts             ← Migration runner (bun run db:migrate)
│
└── ops/scripts/init-db.sh         ← Server-side deployment script
```

---

## ⚙️ القاعدة الأساسية: ترتيب العمل

```
قاعدة البيانات الحقيقية
        ↓
   drizzle/*.sql     ← تُطبق عبر init-db.sh أو bun run db:migrate
        ↓
   drizzle/schema.ts ← مُولَّد تلقائياً عبر bun run db:pull
        ↓
   الكود (API)       ← يستخدم schema.ts للاستعلامات
```

---

## 🚀 Deployment على سيرفر جديد (خطوة واحدة)

```bash
# 1. انسخ المشروع للسيرفر
git clone <repo> /opt/apex-v2 && cd /opt/apex-v2

# 2. انسخ ملف .env
scp .env deploy@SERVER:/opt/apex-v2/.env

# 3. شغّل قاعدة البيانات + طبّق كل الـ migrations
docker compose -f ops/docker-compose.prod.yml --env-file .env up -d apex-postgres
chmod +x ops/scripts/init-db.sh
./ops/scripts/init-db.sh

# 4. شغّل كل الخدمات
docker compose -f ops/docker-compose.prod.yml --env-file .env up -d
```

---

## 🔄 إضافة Migration جديد

```bash
# 1. عدّل ملفات .hcl أو schema.ts
# 2. أنشئ ملف SQL جديد في drizzle/ باسم تسلسلي:
#    drizzle/0012_your_feature_name.sql
# 3. أضف اسم الملف في ops/scripts/init-db.sh ← قائمة MIGRATIONS
# 4. طبّق على السيرفر:
./ops/scripts/init-db.sh
# الملفات السابقة ستُتخطى تلقائياً (idempotent)
```

---

## ⚠️ القواعد المحرّمة

| محرّم | السبب |
|---|---|
| `drizzle-kit push` على production | يحذف Triggers و RLS policies |
| تعديل `schema.ts` يدوياً | يُولَّد تلقائياً من قاعدة البيانات |
| حذف أي ملف من `drizzle/` | تاريخ المشروع الكامل |
| `DROP TABLE` بدون migration | يكسر الـ schema.ts والكود |

---

## 🛠️ أوامر التطوير

```bash
bun run db:migrate  # طبّق الـ migrations (يستخدم src/run-migrate.ts)
bun run db:pull     # حدّث schema.ts + relations.ts من قاعدة البيانات الحقيقية
bun run db:studio   # افتح Drizzle Studio (واجهة بصرية)
```

---

## 🏗️ Schemas في قاعدة البيانات

| Schema | الوظيفة |
|---|---|
| `public` | الجداول العامة (users, stores, orders, ..) |
| `governance` | إدارة الـ tenants, audit_logs, billing |
| `storefront` | الواجهة (products, categories, customers) |
| `vault` | مفاتيح التشفير (مُعزول تماماً) |

---

## 🔒 Connection Policy

- **Production API** → يتصل كـ `app_user` (CRUD فقط، خاضع لـ RLS)
- **Migrations** → يتصل كـ `apex` (superuser مؤقتاً)
- **لا يُسمح بـ** `postgres` superuser في الـ production code
