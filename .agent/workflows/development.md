---
description: كيفية بدء العمل على Apex Backend والتطوير
---

# 🚀 دليل تطوير Apex (Backend-Only)

هذا الدليل يشرح كيفية تشغيل وتطوير نظام Apex بعد تحويله إلى Backend-only API.

## 📋 المتطلبات الأساسية
- **Bun**: محرك التشغيل الأساسي (`bun install`)
- **Docker**: لتشغيل قاعدة البيانات (PostgreSQL) والخدمات (Redis, MinIO)
- **NestJS CLI**: اختياري ولكن مفضل للتطوير

## 🛠️ خطوات البدء السريع

### 1. تثبيت الاعتمادات
// turbo
```bash
bun install
```

### 2. تشغيل الخدمات الأساسية (Infrastructure)
// turbo
```bash
docker compose up -d
```

### 3. إعداد قاعدة البيانات
// turbo
```bash
cd packages/db
bun run db:generate
bun run db:migrate
```

### 4. تشغيل الـ API في وضع التطوير
// turbo
```bash
cd apps/api
bun run dev
```

## 🧪 الاختبارات والجودة

### تشغيل الاختبارات
```bash
# في جذر المشروع
bun run test

# في مجلد الـ API
cd apps/api
bun run test
```

### فحص الكود (Linting)
```bash
bun run lint
```

## 📜 الروابط الهامة
- **API Documentation**: `http://localhost:3000/docs` (Swagger)
- **Database Schema**: `packages/db/src/schema.ts`
