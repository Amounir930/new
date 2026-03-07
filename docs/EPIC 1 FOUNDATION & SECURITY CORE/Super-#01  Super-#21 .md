بالتأكيد، إليك تفاصيل تفصيلية للنقطتين "Super-#21 Onboarding Blueprint Editor 🧱" و "Super-#01 Tenant Overview Table 🌐"، مصاغة على غرار المثال الذي قدمته:

Super-#21 Onboarding Blueprint Editor 🧱
مقدمة:
يهدف هذا المكون إلى تمكين مشرفي النظام (Super Admins) من إنشاء وإدارة قوالب (Blueprints) لعملية إعداد المستأجرين (Tenant Onboarding). ستسمح هذه القوالب بتحديد بيانات أولية (مثل المنتجات والصفحات والإعدادات) والأصول (مثل الصور) التي يتم توفيرها تلقائيًا عند إنشاء مستأجر جديد. هذا يضمن الاتساق، يسرّع عملية الإعداد، ويقلل من الأخطاء اليدوية.

1. مفهوم محرّر قوالب الإعداد وسياق Provisioning (Onboarding Blueprint Editor & Provisioning Context Concepts)
Onboarding Blueprint (قالب الإعداد):
هو مستند JSON مهيكل يصف البيانات الأولية والإعدادات والأصول التي يجب توفيرها لمستأجر جديد عند إنشائه.
يعمل كقالب لإنشاء بيئات مستأجرين مختلفة بسرعة.
JSON Schema / Zod Schema:
أدوات لوصف والتحقق من بنية بيانات JSON.
ضرورية لضمان أن القوالب تتبع تنسيقًا متوقعًا، مما يمنع الأخطاء أثناء عملية التزويد (Provisioning).
Tenant Provisioning (تزويد المستأجر):
عملية إنشاء بيئة جديدة بالكامل لمستأجر جديد، بما في ذلك إنشاء سجل المستأجر في قاعدة البيانات الرئيسية، وتهيئة مخطط قاعدة البيانات الخاص به، وتعبئته بالبيانات الأولية والأصول.
MinIO (Asset Storage):
تخزين كائن (Object Storage) متوافق مع S3، يُستخدم لتخزين الأصول مثل الصور ومقاطع الفيديو والملفات.
ضروري لتخزين أي أصول مرجعية في القوالب.
Drizzle ORM:
أداة ORM (Object-Relational Mapping) لـ TypeScript تتيح التفاعل مع قواعد البيانات العلائقية (مثل PostgreSQL) باستخدام كود TypeScript.
تُستخدم لإدارة مخططات البيانات وإدخال البيانات الأولية.
2. الأدوات المستخدمة (Tools Utilized)
React (UI Framework): لإطار عمل واجهة المستخدم الأمامية.
Monaco Editor / react-json-editor-ajv: مكونات واجهة المستخدم لتحرير JSON.
Zod (Schema Validation): مكتبة TypeScript-first للتحقق من صحة المخطط.
@apex/db (Drizzle ORM): للتفاعل مع قاعدة البيانات (PostgreSQL).
MinIO (Asset Storage): لتخزين وإدارة أصول الملفات.
Bun CLI: لتشغيل الأداة البرمجية (CLI tool).
3. استراتيجية التنفيذ والتكوين التفصيلي (Detailed Execution Strategy & Configuration)
3.1. واجهة المستخدم (UI) لمحرر القوالب
الغرض: توفير واجهة رسومية لـ Super Admin لإنشاء وتحرير قوالب JSON.
الخطة التنفيذية:
بناء الصفحة: إنشاء صفحة React جديدة ضمن Super Admin UI (مثلاً /super-admin/blueprints/editor).
مكون محرر JSON: دمج مكون جاهز لتحرير JSON.
Monaco Editor: يوفر تجربة تحرير غنية مع تمييز بناء الجملة (syntax highlighting) وإكمال الكود التلقائي (autocompletion) لـ JSON. مثالي إذا كان Super Admin لديه بعض الخلفية التقنية.
react-json-editor-ajv: يوفر محررًا قائمًا على النموذج (form-based editor) مع دعم قوي للتحقق من صحة JSON Schema، مما يجعله أكثر سهولة للمستخدمين غير التقنيين.
إدارة الحالة: استخدام React hooks (مثل useState, useEffect) لإدارة حالة JSON Blueprint، وتغييراته، وأي أخطاء تحقق.
أزرار التحكم: إضافة أزرار لحفظ Blueprint، تحميل Blueprint موجود، وعرض أخطاء التحقق.
3.2. التحقق من صحة Schema للـ Blueprints (Schema Validation)
الغرض: ضمان أن Blueprints تتبع بنية متوقعة لمنع أخطاء التزويد.
الخطة التنفيذية:
تعريف Zod Schema:
إنشاء ملف schema مشترك (مثلاً packages/common/schemas/onboarding-blueprint.schema.ts).
تعريف Zod schema الذي يصف البنية المتوقعة لـ Blueprint (مثلاً، يجب أن يكون كائنًا يحتوي على صفائف لـ products و pages، مع تحديد أنواع الحقول لكل عنصر).
// packages/common/schemas/onboarding-blueprint.schema.ts
import { z } from 'zod';

export const ProductSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  price: z.number().positive(),
  image: z.string().url().optional(), // قد يكون رابط MinIO بعد الرفع
  // ... حقول المنتج الأخرى
});

export const PageSchema = z.object({
  slug: z.string().regex(/^[a-z0-9-]+$/),
  title: z.string().min(1),
  content: z.string().optional(),
  // ... حقول الصفحة الأخرى
});

export const BlueprintSchema = z.object({
  blueprintName: z.string().min(1),
  products: z.array(ProductSchema).optional(),
  pages: z.array(PageSchema).optional(),
  settings: z.record(z.string(), z.any()).optional(), // إعدادات عامة
  // ... أنواع بيانات أولية أخرى
});

export type OnboardingBlueprint = z.infer<typeof BlueprintSchema>;
التحقق من صحة الواجهة الخلفية (Backend Validation):
عند استلام Blueprint JSON من الواجهة الأمامية (API endpoint لـ Super Admin)، استخدم BlueprintSchema.parse(jsonPayload) للتحقق من صحته.
إذا فشل التحقق، قم بإرجاع 400 Bad Request مع تفاصيل خطأ Zod الواضحة.
التحقق من صحة الواجهة الأمامية (Frontend Validation):
دمج Zod أو AJV مع محرر JSON في الواجهة الأمامية لتوفير تغذية راجعة فورية حول صحة البنية، مما يقلل من الأخطاء قبل الإرسال.
3.3. تخزين Blueprints
الغرض: تخزين قوالب JSON بشكل فعال في قاعدة البيانات.
الخطة التنفيذية:
تعريف جدول Drizzle:
في @apex/db/src/schema.ts، تعريف جدول onboarding_blueprints.
// packages/db/src/schema.ts
import { pgTable, uuid, varchar, jsonb, timestamp } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const onboardingBlueprints = pgTable('onboarding_blueprints', {
  id: uuid('id').default(sql`gen_random_uuid()`).primaryKey(),
  blueprintName: varchar('blueprint_name', { length: 256 }).notNull().unique(), // اسم فريد للقالب
  blueprintJson: jsonb('blueprint_json').notNull(), // تخزين JSONBlueprint
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});
إنشاء Migration: استخدام drizzle-kit لتوليد وتطبيق Migration لهذا الجدول.
API للـ Super Admin: إنشاء نقطة نهاية في NestJS API (مثلاً POST /super-admin/blueprints, PUT /super-admin/blueprints/:name) لحفظ واسترداد Blueprints.
3.4. أداة CLI لـ Provisioning
الغرض: أتمتة عملية تزويد المستأجرين الجدد باستخدام Blueprints.
الخطة التنفيذية:
بناء أداة CLI:
إنشاء ملف cli/src/commands/provision.command.ts.
استخدام مكتبة مثل commander.js أو yargs لتحديد الأمر والخيارات.
// cli/src/commands/provision.command.ts (مخطط)
import { Command } from 'commander';
// ... استيراد الخدمات المطلوبة (TenantService, BlueprintService, MinioService)

export function registerProvisionCommand(program: Command) {
  program
    .command('provision:tenant')
    .description('Provision a new tenant using a blueprint.')
    .option('--blueprint <name>', 'Name of the blueprint to use', 'default')
    .requiredOption('--subdomain <name>', 'Subdomain for the new tenant')
    // ... خيارات أخرى
    .action(async (options) => {
      console.log(`Provisioning tenant ${options.subdomain} with blueprint ${options.blueprint}`);
      try {
        // 1. إنشاء Tenant جديد
        const tenantId = await tenantService.createTenant(options.subdomain, /* ... */);

        // 2. قراءة JSON Blueprint المحدد
        const blueprint = await blueprintService.getBlueprint(options.blueprint);
        if (!blueprint) {
          throw new Error(`Blueprint ${options.blueprint} not found.`);
        }

        // 3. استخدام Drizzle ORM لإدخال بيانات أولية
        await dataProvisioningService.applyBlueprint(tenantId, blueprint.blueprintJson);

        // 4. رفع أي أصول (images) مذكورة في الـ Blueprint إلى MinIO
        await assetProvisioningService.uploadBlueprintAssets(tenantId, blueprint.blueprintJson);

        console.log(`Tenant ${options.subdomain} provisioned successfully!`);
      } catch (error) {
        console.error('Tenant provisioning failed:', error.message);
        process.exit(1);
      }
    });
}
إنشاء Tenant في public.tenants:
استدعاء TenantService لإنشاء سجل جديد في جدول public.tenants باستخدام Drizzle ORM، مع subdomain المقدم.
قراءة JSON Blueprint:
استدعاء BlueprintService لجلب JSON Blueprint من جدول onboarding_blueprints بناءً على blueprint_name.
إدخال البيانات الأولية:
إنشاء DataProvisioningService يحلل blueprintJson.
لكل نوع من أنواع البيانات (مثلاً products, pages):
استخدام Drizzle ORM لإدخال هذه البيانات في الجداول الخاصة بالمستأجر (مثلاً tenant_X.products, tenant_X.pages).
هذا يتطلب إدارة دقيقة لـ Drizzle لضمان الاتصال بالمخطط الصحيح للمستأجر (Tenant Schema).
رفع الأصول إلى MinIO:
إنشاء AssetProvisioningService يمسح blueprintJson بحثًا عن مراجع الأصول (مثل روابط الصور المؤقتة أو مسارات الملفات المحلية).
استخدام MinIO SDK لرفع هذه الأصول إلى Bucket MinIO الخاص بالمستأجر.
تحديث روابط الأصول في بيانات Blueprint أو قاعدة البيانات لتشير إلى MinIO URLs.
4. تحقيق الأهداف والتحقق (Achieving Objectives & Verification)
4.1. إنشاء/تعديل Blueprint (Create/Edit Blueprint):
الخطة التنفيذية:
افتح محرر Blueprint في Super Admin UI.
أدخل JSON Blueprint جديدًا (مثال: {"blueprintName": "fashion-store-v2", "products": [{"name": "T-shirt", "price": 20}]}).
احفظ Blueprint.
الهدف والمتوقع: يجب حفظ Blueprint بنجاح في جدول onboarding_blueprints في قاعدة البيانات. يجب أن تظهر التعديلات على Blueprint موجودة.
التحقق: الاستعلام مباشرة عن جدول onboarding_blueprints في PostgreSQL للتأكد من وجود السجل الجديد/المحدّث ومحتواه.
4.2. تحقق Schema (Schema Validation):
الخطة التنفيذية:
في محرر Blueprint UI، أدخل JSON Blueprint غير صالح (مثلاً، حقل name مفقود لمنتج، أو price ليس رقمًا).
الهدف والمتوقع: يجب أن يظهر خطأ تحقق واضح في الواجهة الأمامية. إذا تم تجاهل الخطأ وحفظه (أو إذا تم إرساله مباشرة إلى الـ API)، يجب أن ترجع API خطأ 400 Bad Request مع تفاصيل خطأ Zod.
التحقق:
ملاحظة رسائل الخطأ في UI.
فحص استجابة API endpoint للحفظ (باستخدام Postman/Insomnia) للتأكد من استجابة 400 مع تفاصيل الخطأ.
4.3. Provisioning ناجح (Successful Provisioning):
الخطة التنفيذية:
تشغيل أمر CLI: bun run cli provision:tenant --blueprint=fashion-store-v2 --subdomain=new-store-test.
الهدف والمتوقع:
يجب إنشاء Tenant جديد في جدول public.tenants.
يجب أن يتم ملء جداول المستأجر الجديدة (new_store_test.products, new_store_test.pages إلخ) بالبيانات المحددة في Blueprint.
يجب أن تكون أي أصول (صور) مذكورة في Blueprint قد تم رفعها إلى MinIO.
يجب أن يعمل Tenant الجديد (مثلاً new-store-test.apex.localhost) بشكل صحيح ويعرض المنتجات والصفحات المحددة.
التحقق:
التحقق من جدول public.tenants.
الاستعلام مباشرة عن جداول المستأجر الخاصة بـ new-store-test (مثلاً SELECT * FROM new_store_test.products;) للتأكد من وجود البيانات.
فحص MinIO UI أو استخدام MinIO CLI للتأكد من رفع الأصول.
زيارة https://new-store-test.apex.localhost والتأكد من عمل المتجر وعرض المحتوى الصحيح.
4.4. توثيق Blueprints (Blueprint Documentation):
الخطة التنفيذية:
إنشاء أو تحديث ملف docs/onboarding.md.
الهدف والمتوقع: يجب أن يحتوي الملف على توثيق واضح ومفصل لبنية Blueprint المتوقعة (بما في ذلك الحقول المطلوبة والاختيارية وأنواع البيانات)، مع أمثلة.
التحقق: مراجعة الملف للتأكد من اكتمال التوثيق ووضوحه.
5. ملخص وفوائد (Summary and Benefits)


بتطبيق Super-#21 Onboarding Blueprint Editor 🧱، سيتم تحقيق ما يلي:

تسريع إعداد المستأجرين: أتمتة عملية توفير البيانات الأولية والأصول للمستأجرين الجدد.
الاتساق والتوحيد: ضمان أن جميع المستأجرين الجدد يتم إعدادهم بطريقة متسقة ووفقًا لقوالب محددة.
تقليل الأخطاء البشرية: تقليل الحاجة إلى الإدخال اليدوي للبيانات أثناء عملية الإعداد.
مرونة في التكوين: يمكن لـ Super Admins تعريف وتحديث قوالب مختلفة لأنواع مختلفة من المستأجرين.
تجربة مستخدم محسّنة: توفير واجهة مستخدم بديهية لإنشاء وإدارة القوالب.
قابلية التوسع: دعم تزويد عدد كبير من المستأجرين بكفاءة.
Super-#01 Tenant Overview Table 🌐
مقدمة:
يهدف هذا المكون إلى تزويد مشرفي النظام (Super Admins) بلوحة تحكم مركزية وفعالة لإدارة وعرض تفاصيل المستأجرين (Tenants) المسجلين في النظام. سيوفر هذا الجدول تفاعلاً غنيًا من خلال وظائف البحث والفلترة والفرز وتقسيم الصفحات، مدعومًا بآليات جلب البيانات الفعالة والتخزين المؤقت لضمان الأداء وتحديث البيانات شبه الفوري.

1. مفهوم جدول نظرة عامة على المستأجرين وسياق البيانات (Tenant Overview Table & Data Context Concepts)
Tenant Overview Table (جدول نظرة عامة على المستأجرين):
عرض جدولي لجميع المستأجرين في النظام، يعرض الحقول الرئيسية لكل مستأجر مثل subdomain، name، status، plan، created_at.
يخدم كنقطة انطلاق لمهام إدارة المستأجرين الأخرى.
TanStack Table / AG Grid:
مكتبات واجهة المستخدم (UI Libraries) متقدمة لإنشاء جداول بيانات تفاعلية.
توفر ميزات مثل البحث الشامل، الفلترة حسب العمود، الفرز، وتقسيم الصفحات (Pagination) خارج الصندوق.
Pagination (تقسيم الصفحات):
عرض البيانات على شكل صفحات صغيرة (مثلاً 10 أو 20 صفًا لكل صفحة) بدلاً من تحميل جميع البيانات دفعة واحدة.
يحسن الأداء ويقلل من استهلاك الموارد على كل من الخادم والعميل.
Redis Cache:
مخزن بيانات سريع في الذاكرة يُستخدم لتخزين نتائج الاستعلامات التي يتم الوصول إليها بشكل متكرر أو الكائنات الفردية.
يقلل من حمل قاعدة البيانات ويسرع أوقات استجابة API.
Polling / WebSockets:
Polling: تقنية يسأل فيها العميل الخادم بشكل دوري عن تحديثات (مثلاً كل 30 ثانية). بسيطة التنفيذ.
WebSockets: تقنية اتصال ثنائي الاتجاه تسمح للخادم بإرسال تحديثات فورية إلى العميل دون الحاجة إلى طلب العميل. توفر تحديثات في الوقت الفعلي.
2. الأدوات المستخدمة (Tools Utilized)
React (UI Framework): لإطار عمل واجهة المستخدم الأمامية.
TanStack Table / AG Grid: لمكون جدول البيانات التفاعلي.
PostgreSQL (Database): لتخزين بيانات المستأجرين.
Redis Cache: للتخزين المؤقت لبيانات المستأجرين المستردة.
3. استراتيجية التنفيذ والتكوين التفصيلي (Detailed Execution Strategy & Configuration)
3.1. واجهة المستخدم (UI) لجدول المستأجرين
الغرض: بناء صفحة React تعرض جدولًا تفصيليًا للمستأجرين.
الخطة التنفيذية:
صفحة React: إنشاء صفحة React جديدة ضمن Super Admin UI (مثلاً /super-admin/tenants).
تصميم الجدول: تحديد الأعمدة التي ستُعرض (مثلاً Subdomain, Name, Status, Plan, Creation Date, Actions).
إدارة حالة UI: استخدام React hooks لإدارة حالة الجدول (بيانات المستأجرين، حالة التحميل، أخطاء، حالة البحث، الفلترة، الفرز، Pagination).
3.2. مكون جدول قوي (Powerful Table Component)
الغرض: توفير تجربة مستخدم غنية وتفاعلية لإدارة بيانات المستأجرين.
الخطة التنفيذية:
دمج TanStack Table:
تثبيت tanstack/react-table وتهيئته في مكون الجدول.
تكوين الأعمدة لتعيين accessorKeys، headers، وتحديد ما إذا كانت قابلة للفرز أو الفلترة.
البحث الشامل (Global Search):
إضافة حقل إدخال (input) للبحث أعلى الجدول.
عند تغيير قيمة حقل البحث، يتم إرسال استعلام search إلى API.
يمكن تحقيق البحث على مستوى العميل إذا كانت مجموعة البيانات صغيرة (لكن هذا لا ينطبق على 1000+ مستأجر).
الفلترة (Column Filtering):
إضافة عناصر UI (مثلاً قوائم منسدلة أو حقول إدخال) لكل عمود قابل للفلترة (مثلاً Status, Plan).
عند تطبيق فلتر، يتم إرسال معلمة الفلتر إلى API (مثلاً status=active).
الفرز (Sorting):
تفعيل الفرز للأعمدة الرئيسية (مثلاً created_at, subdomain, plan).
عند النقر على رأس عمود، يتم إرسال معلمة sortBy و sortOrder إلى API.
تقسيم الصفحات (Pagination):
إضافة أزرار التحكم في Pagination (الصفحة الأولى، السابقة، التالية، الأخيرة) بالإضافة إلى تحديد حجم الصفحة (مثلاً 10, 20, 50).
إرسال معلمات page و limit إلى API.
3.3. Fetch البيانات (Data Fetching)
الغرض: جلب بيانات المستأجرين من الواجهة الخلفية بشكل فعال.
الخطة التنفيذية:
API Endpoint في NestJS:
إنشاء SuperAdminTenantsController جديد في NestJS.
تحديد نقطة نهاية GET /super-admin/tenants التي تقبل معلمات الاستعلام: page, limit, search, status, plan, sort_by, sort_order.
// apps/api/src/super-admin/tenants/tenants.controller.ts
import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { TenantsService } from './tenants.service';
import { AuthGuard } from '@nestjs/passport'; // لحماية نقطة النهاية

@Controller('super-admin/tenants')
@UseGuards(AuthGuard('jwt')) // التأكد من أن Super Admin فقط يمكنه الوصول
export class TenantsController {
  constructor(private readonly tenantsService: TenantsService) {}

  @Get()
  async findAll(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('plan') plan?: string,
    @Query('sort_by') sortBy?: string,
    @Query('sort_order') sortOrder?: 'asc' | 'desc',
  ) {
    const result = await this.tenantsService.findAndCountAll({
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      search, status, plan, sortBy, sortOrder
    });
    return {
      data: result.tenants,
      total: result.total,
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
    };
  }
}
خدمة TenantService:
استخدام TenantsService للوصول إلى قاعدة البيانات (عبر Drizzle ORM).
تطبيق منطق البحث (باستخدام ilike أو search في Drizzle)، الفلترة (باستخدام eq، in), الفرز (باستخدام orderBy), وتقسيم الصفحات (باستخدام limit و offset).
التعامل مع التخزين المؤقت (Caching) قبل الوصول إلى قاعدة البيانات.
3.4. Caching
الغرض: تحسين الأداء عن طريق تخزين نتائج الاستعلامات المتكررة في Redis.
الخطة التنفيذية:
دمج NestJS CacheModule مع Redis:
تكوين CacheModule لاستخدام Redis Store (من Arch-Core-02).
// apps/api/src/app.module.ts
import { CacheModule, Module } from '@nestjs/common';
import * as redisStore from 'cache-manager-redis-store'; // تثبيت bun add cache-manager-redis-store
import { ConfigService } from '@nestjs/config';

@Module({
  imports: [
    CacheModule.registerAsync({
      useFactory: (configService: ConfigService) => ({
        store: redisStore,
        host: configService.get<string>('REDIS_HOST'),
        port: configService.get<number>('REDIS_PORT'),
        ttl: 300, // 5 دقائق
        // ... إعدادات Redis إضافية
      }),
      inject: [ConfigService],
    }),
    // ...
  ],
  // ...
})
export class AppModule {}
تطبيق التخزين المؤقت:
استخدام CacheInterceptor أو CacheKey و CacheTTL decorators على نقطة نهاية GET /super-admin/tenants لتخزين النتائج المؤقتة.
@CacheKey يسمح بتخصيص مفتاح التخزين المؤقت بناءً على معلمات الاستعلام، مما يضمن تخزين كل مجموعة فريدة من الفلاتر/البحث/الصفحات بشكل منفصل.
// apps/api/src/super-admin/tenants/tenants.controller.ts (تعديل)
import { CacheInterceptor, CacheKey, CacheTTL } from '@nestjs/cache-manager';
// ...
@Controller('super-admin/tenants')
@UseGuards(AuthGuard('jwt'))
@UseInterceptors(CacheInterceptor) // تطبيق CacheInterceptor
export class TenantsController {
  // ...
  @Get()
  @CacheKey((req) => `tenants_overview_${JSON.stringify(req.query)}`) // مفتاح cache ديناميكي
  @CacheTTL(30) // Cache لمدة 30 ثانية
  async findAll(
    // ...
  ) { /* ... */ }
}
تخزين بيانات المستأجرين الفردية:
بالإضافة إلى نتائج الاستعلامات، يمكن تخزين كائنات المستأجرين الفردية (مثلاً عند استرداد تفاصيل مستأجر محدد بواسطة ID) في Redis Cache لتحسين الأداء للوصول المتكرر.
3.5. تحديثات شبه فورية (Near Real-time Updates)
الغرض: ضمان أن بيانات الجدول حديثة بما فيه الكفاية لـ Super Admin.
الخطة التنفيذية:
Polling (الخيار الأبسط):
في مكون React لجدول المستأجرين، استخدام useEffect مع setInterval لجدولة استدعاء API findAll كل 30 ثانية.
تتوقف عملية الـ polling عند مغادرة المكون للصفحة.
WebSockets (للتحسينات المستقبلية):
Backend NestJS Gateway: إنشاء TenantsGateway يستخدم Socket.IO أو ws لإرسال إشعارات عند تغيير حالة المستأجر (مثلاً عند تفعيله، تعليقه، تغيير خطته).
Frontend React: استخدام مكتبة عميل WebSockets (مثل socket.io-client) للاشتراك في الأحداث. عند استلام حدث، يتم تحديث صف المستأجر المتأثر في الجدول مباشرة أو يتم تحديث البيانات بالكامل.
4. تحقيق الأهداف والتحقق (Achieving Objectives & Verification)
4.1. تحميل سريع للجدول (Fast Table Load):
الخطة التنفيذية:
ملء قاعدة البيانات بـ 1000 سجل مستأجر (عبر Seeders).
افتح صفحة Tenant Overview في Super Admin UI.
الهدف والمتوقع: يجب أن يتم تحميل وعرض الجدول مع أول 10-20 مستأجرًا (حسب Pagination) في أقل من 2 ثانية.
التحقق:
استخدام أدوات المطور في المتصفح (Network tab) لقياس وقت استجابة API ووقت تحميل الصفحة.
مراقبة أداء قاعدة البيانات للتأكد من أن الاستعلامات فعالة.
4.2. وظائف البحث/الفلترة/الفرز (Search/Filter/Sort Functionality):
الخطة التنفيذية:
اختبر كل وظيفة:
أدخل مصطلح بحث في حقل البحث العام.
طبق فلاتر لـ Status و Plan.
انقر على رؤوس الأعمدة لفرز البيانات تصاعديًا وتنازليًا.
الهدف والمتوقع: يجب أن يتم تحديث الجدول ديناميكيًا بناءً على إدخالات البحث والفلاتر ومعلمات الفرز، وأن تعكس البيانات التغييرات بشكل صحيح.
التحقق:
ملاحظة استجابة الواجهة الأمامية ونتائج البحث/الفلترة/الفرز.
التحقق من أن استدعاءات API (في Network tab) تتضمن المعلمات الصحيحة.
4.3. بيانات دقيقة (Accurate Data):
الخطة التنفيذية:
افتح صفحة Tenant Overview.
من خلال نقطة نهاية API أخرى أو مباشرة في قاعدة البيانات، قم بتغيير حالة مستأجر (مثلاً من active إلى suspended).
انتظر (30 ثانية إذا كان polling) أو لاحظ التحديث إذا كان WebSockets.
الهدف والمتوقع: يجب أن تعكس بيانات الجدول في الواجهة الأمامية دائمًا أحدث حالة للـ Tenants في قاعدة البيانات (مع تأخر بسيط إذا تم استخدام polling).
التحقق:
ملاحظة التغيير في الواجهة الأمامية بعد مرور فترة الـ polling أو فور حدوثه مع WebSockets.
التحقق من سجلات API للتأكد من أن البيانات المستردة حديثة.
4.4. أداء Cache (Cache Performance):
الخطة التنفيذية:
افتح صفحة Tenant Overview لأول مرة.
أعد تحميل الصفحة أو كرر نفس الاستعلام (بمعلمات بحث/فلترة/فرز/صفحات متطابقة) عدة مرات ضمن فترة TTL للـ Cache.
الهدف والمتوقع: يجب أن تظهر مراقبة Redis Cache ارتفاعًا في Cache hit ratio لبيانات المستأجرين. يجب أن تكون الاستجابات للطلبات المتكررة أسرع.
التحقق:
استخدام redis-cli monitor أو أدوات مراقبة Redis الأخرى لمراقبة الطلبات التي تصل إلى Redis ومفتاح التخزين المؤقت.
قياس وقت استجابة API للطلبات الأولى واللاحقة.
4.5. توثيق API (API Documentation):
الخطة التنفيذية:
إنشاء أو تحديث ملف docs/api.md (أو باستخدام Swagger/OpenAPI).
الهدف والمتوقع: يجب أن يحتوي الملف على توثيق واضح وشامل لنقطة نهاية GET /super-admin/tenants، بما في ذلك المعلمات المطلوبة والاختيارية، أنواع الاستجابات، وأي أمثلة مفيدة.
التحقق: مراجعة الملف للتأكد من اكتمال التوثيق ووضوحه.
5. ملخص وفوائد (Summary and Benefits)
بتطبيق Super-#01 Tenant Overview Table 🌐، سيتم تحقيق ما يلي:

إدارة مركزية للمستأجرين: توفير لوحة تحكم واحدة لـ Super Admins لمراقبة جميع المستأجرين.
كفاءة إدارية: تسهيل البحث، الفلترة، الفرز، وتصفح بيانات المستأجرين، مما يوفر الوقت والجهد على المشرفين.
أداء عالي: استخدام التخزين المؤقت (Caching) و Pagination يضمن استجابة سريعة للواجهة الأمامية والواجهة الخلفية، حتى مع وجود عدد كبير من المستأجرين.
بيانات حديثة: آليات التحديث (polling أو WebSockets) تضمن رؤية شبه فورية لحالة المستأجرين.
تجربة مستخدم محسّنة: جدول تفاعلي وغني بالميزات يحسن من إنتاجية Super Admin.
قابلية التوسع: تصميم يسمح بالتعامل مع نمو عدد المستأجرين دون تدهور كبير في الأداء.