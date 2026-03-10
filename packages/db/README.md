# `@apex/db` — Sovereign Database Architecture (2026)

> **قاعدة البيانات هي دستور المشروع المقدس ونخاع أمنه السيادي.**
> الملفات المصدرية الوحيدة المسموح تعديل الـ schema منها هي ملفات الحوكمة الهندسية `*.hcl`.

---

## 🗺️ هيكل المجلد السيادي

```
packages/db/
├── migrations/                ← ✅ سجلات التاريخ المقدس (Atlas Migrations)
│   ├── 20260309222348_initial.sql ← النسخة المحصنة (RLS, WORM, Vector, GIST)
│   └── atlas.sum              ← بصمة التحقق الرقمي لسلامة البيانات
│
├── *.hcl                      ← تعريفات الـ Schema (Foundation, Catalog, CRM, etc.)
├── security_protocols.sql     ← بروتوكولات الأمان المحقنة (RLS & Triggers)
├── atlas.hcl                  ← إعدادات محرك Atlas للبيئات المختلفة
│
├── drizzle/                   ← ORM Layer (مُزامنة مع قاعدة البيانات)
│   └── schema.ts              ← تمثيل TypeScript للجداول (مُولَّد تلقائياً)
│
└── src/
    └── index.ts               ← محركات الاتصال (Sovereign Dual-Pool)
```

---

## ⚙️ بروتوكول التعديل (Enterprise Workflow)

يُمنع التعديل اليدوي على ملفات الـ SQL في `migrations/` إلا للضرورة القصوى وبإشراف هندسي. المسار الصحيح هو:

1.  **تعديل ملفات HCL**: قم بتحديث ملفات الـ `*.hcl` المناسبة (مثل `02_CATALOG_INVENTORY.hcl`).
2.  **توليد Migration**: استخدم محرك Atlas لتوليد النسخة الجديدة:
    ```bash
    atlas migrate diff <name> --env local
    ```
3.  **حقن الأمان**: أضف بروتوكولات الـ RLS والـ Triggers اللازمة من `security_protocols.sql` للـ migration المولد.
4.  **تحديث البصمة**:
    ```bash
    atlas migrate hash
    ```

---

## 🚀 إعادة النشر على أي سيرفر (Deployment Protocol)

لنشر قاعدة البيانات وإعدادها بالكامل:

### 1. المتطلبات الأولية
*   وجود محرك **Docker** و **Atlas CLI**.
*   صورة `pgvector/pgvector:pg16` للذكاء الاصطناعي.

### 2. خطوات النشر
```bash
# 1. تفعيل حاوية قاعدة البيانات السيادية
docker run --name apex-db -e POSTGRES_PASSWORD=<pass> -p 5432:5432 -d pgvector/pgvector:pg16

# 2. إنشاء قاعدة البيانات المستهدفة
docker exec apex-db psql -U postgres -c "CREATE DATABASE apex_prod;"

# 3. تفعيل الإضافات الأساسية (Vector)
docker exec apex-db psql -U postgres -d apex_prod -c "CREATE EXTENSION IF NOT EXISTS vector;"

# 4. تطبيق الرحلة الزمنية (Apply Migrations)
atlas migrate apply --url "postgres://postgres:<pass>@localhost:5432/apex_prod?sslmode=disable"
```

---

## 🔗 الترابط مع باقي المشروع

*   **Drizzle ORM**: مشروع الـ API يعتمد كلياً على `drizzle/schema.ts`. بعد أي migration، يجب تحديث الـ schema:
    ```bash
    bun run db:pull
    ```
*   **Infrastructure**: ملفات الـ `.env` في المشروع يجب أن تشير إلى قاعدة البيانات الجديدة عبر `DATABASE_URL`.
*   **Tenant Provisioning**: منطق إنشاء التاجر الجديد يعتمد على `governance.tenants` الخاضع لسياسات RLS، مما يضمن عزل بيانات كل تاجر برمجياً وفيزيائياً.

---

## 🔒 السياسات الأمنية (2026 Standards)

| البروتوكول | الوصف |
|---|---|
| **RLS (Row Level Security)** | عزل كامل لبيانات الـ Tenatts في طبقة قاعدة البيانات. |
| **WORM (Write Once Read Many)** | تجميد سجلات التدقيق والعمليات المالية ومنع الحذف/التعديل. |
| **VAULT Isolation** | فصل مفاتيح التشفير في Schema مستقل (vault) مع صلاحيات ضيقة. |
| **Deferrable Guards** | حماية الائتمان المالي عبر Triggers قابلة للتأجيل لضمان استمرارية العمل. |

---

## 🛠️ أوامر الطوارئ

```bash
atlas migrate status        # عرض حالة الـ migrations الحالية
atlas migrate hash          # إعادة حساب بصمة الملفات (عند النقل اليدوي)
atlas schema inspect -u URL # عرض هيكل قاعدة البيانات الحالية بصيغة HCL
```

🎉🛡️ **STATUS: HARDENED | SECURITY: ZERO-TOLERANCE** 🛡️🎉
