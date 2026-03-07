مقدمة:
تُعد التطبيقات متعددة المستأجرين شائعة جداً، حيث تخدم عدة عملاء (مستأجرين) من نفس قاعدة الكود والبنية التحتية. يمثل عزل البيانات بين هؤلاء المستأجرين تحدياً أمنياً وتشغيلياً كبيراً. يهدف هذا المشروع إلى تنفيذ آلية قوية لعزل المستأجرين باستخدام نهج يعتمد على Subdomain، و caching معرفات المستأجرين في Redis، وتطبيق Row-Level Security (RLS) في PostgreSQL بالتعاون مع Drizzle ORM، مما يضمن أقصى درجات الأمان والفعالية.

1. مفهوم عزل المستأجرين (Tenant Isolation Concepts)
Multi-tenancy: نمط معماري حيث يتم تشغيل نسخة واحدة من التطبيق على الخادم، وتخدم العديد من المستأجرين (العملاء)، مع فصل بيانات كل مستأجر.
Subdomain per Tenant: تخصيص subdomain فريد لكل مستأجر (مثل alpha.apex.localhost، beta.apex.localhost). هذا يسهل التعرف على المستأجر القادم في كل طلب.
Row-Level Security (RLS): ميزة في PostgreSQL تسمح لك بتعريف سياسات للتحكم في الوصول إلى الصفوف الفردية في الجدول. هذا يعني أن كل مستأجر سيرى فقط البيانات المتعلقة به، حتى لو كان يستعلم عن نفس الجدول.
SET LOCAL app.current_tenant: طريقة لتعيين متغير خاص بالجلسة (Session Variable) في PostgreSQL. هذا المتغير يمكن أن تستخدمه سياسات RLS لتحديد المستأجر الحالي.
2. الأدوات المستخدمة (Tools Utilized)
NestJS: بيئة تطوير التطبيقات المستخدمة لتطوير الـ Middleware.
Drizzle ORM 🌧️: ORM لـ TypeScript يوفر Type-safe SQL-like queries. (يحل محل Prisma المذكور في التحليلات السابقة لغرض هذا المشروع).
PostgreSQL RLS 🛡️: ميزة عزل البيانات المدمجة في PostgreSQL.
Redis: لـ caching معرفات المستأجرين (Tenant IDs) لتحسين الأداء.
Zod: (من Arch-Core-03) للتحقق من صحة متغيرات البيئة.
3. استراتيجية التنفيذ والتكوين التفصيلي (Detailed Execution Strategy & Configuration)
3.1. استخلاص Subdomain (NestJS Middleware):

الغرض: في كل طلب HTTP وارد، نحتاج إلى تحديد المستأجر الذي يرسل هذا الطلب بناءً على الـ subdomain المستخدم.
الخطة التنفيذية:
إنشاء TenantMiddleware:
// apps/api/src/common/middleware/tenant.middleware.ts
import { Injectable, NestMiddleware, HttpException, HttpStatus } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { ConfigService } from '@nestjs/config';
import { RedisService } from '../../redis/redis.service'; // من Arch-Core-07
import { DbService } from '../../db/db.service'; // استخدام Drizzle ORM

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  constructor(
    private readonly configService: ConfigService,
    private readonly redisService: RedisService,
    private readonly dbService: DbService,
  ) {}

  async use(req: Request, res: Response, next: NextFunction) {
    const host = req.hostname;
    const rootDomain = this.configService.get<string>('ROOT_DOMAIN'); // مثال: 'apex.localhost'
    const subdomain = host.replace(`.${rootDomain}`, '');

    // إذا كان الطلب من النطاق الجذر أو لا يحتوي على subdomain، قد يكون طلبًا لـ Admin API أو غير خاص بمستأجر
    if (subdomain === host || !subdomain) {
      // يمكن هنا التعامل مع الطلبات العامة أو الخاصة بالإدارة
      // أو إلقاء خطأ إذا كانت جميع الطلبات تتطلب مستأجرًا
      return next();
    }

    // تخزين الـ subdomain في الـ Request لإمكانية الوصول إليه لاحقاً
    (req as any).subdomain = subdomain;

    // الخطوة التالية: البحث عن Tenant ID
    const tenantId = await this.findTenantId(subdomain);

    if (!tenantId) {
      throw new HttpException('Tenant Not Found', HttpStatus.NOT_FOUND);
    }

    // تخزين tenantId في الـ Request
    (req as any).tenantId = tenantId;

    // تعيين متغير الجلسة لقاعدة البيانات
    await this.dbService.setTenantContext(tenantId); // دالة مخصصة في DbService لتعيين SET LOCAL

    next();
  }

  private async findTenantId(subdomain: string): Promise<string | null> {
    const cacheKey = `tenant:${subdomain}`;
    let tenantId = await this.redisService.get(cacheKey); // البحث في Redis

    if (tenantId) {
      return tenantId;
    }

    // لم يتم العثور عليه في Cache، البحث في قاعدة البيانات (table `tenants`)
    const tenant = await this.dbService.getTenantBySubdomain(subdomain); // استخدام Drizzle
    if (tenant) {
      tenantId = tenant.id;
      await this.redisService.set(cacheKey, tenantId, 3600); // تخزين في Redis لمدة ساعة
      return tenantId;
    }

    return null;
  }
}
تطبيق الـ Middleware في NestJS:
// apps/api/src/app.module.ts
import { MiddlewareConsumer, Module, RequestMethod } from '@nestjs/common';
import { TenantMiddleware } from './common/middleware/tenant.middleware';
// ... (باقي الـ imports)

@Module({
  // ...
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(TenantMiddleware)
      .exclude(
        { path: 'health', method: RequestMethod.GET }, // استبعاد نقاط نهاية معينة
        { path: 'api/v1/public/*', method: RequestMethod.ALL },
      )
      .forRoutes('*'); // تطبيق الـ middleware على جميع الـ routes
  }
}
تكوين ROOT_DOMAIN: في apps/api/.env أو عبر EnvironmentSchema (Arch-Core-03).
ROOT_DOMAIN=apex.localhost
إعداد DNS/Hosts: لإتاحة alpha.apex.localhost و beta.apex.localhost محلياً، أضف السجلات التالية إلى ملف hosts الخاص بك:
127.0.0.1 apex.localhost
127.0.0.1 alpha.apex.localhost
127.0.0.1 beta.apex.localhost
3.2. البحث عن Tenant في Redis Cache وFallback على قاعدة البيانات:

Redis Integration: (سيتم تفصيله في Arch-Core-07)
يجب أن تكون RedisService متاحة لحقنها في الـ Middleware.
توفر طرق get(key) و set(key, value, ttl) للتعامل مع Redis.
DbService Integration (Drizzle ORM):
نحتاج إلى DbService (أو ما يعادلها) للتعامل مع Drizzle ORM.
يجب أن تكون هناك دالة مثل getTenantBySubdomain(subdomain: string) في هذه الخدمة تستعلم عن جدول tenants.
جدول tenants (Drizzle Schema):
// packages/db/src/schema.ts (مثال لـ Drizzle Schema)
import { pgTable, uuid, varchar, timestamp } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const tenants = pgTable('tenants', {
  id: uuid('id').default(sql`gen_random_uuid()`).primaryKey(),
  subdomain: varchar('subdomain', { length: 256 }).unique().notNull(),
  name: varchar('name', { length: 256 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const products = pgTable('products', {
  id: uuid('id').default(sql`gen_random_uuid()`).primaryKey(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id), // ربط المنتج بالمستأجر
  name: varchar('name', { length: 256 }).notNull(),
  price: varchar('price', { length: 256 }).notNull(), // يمكن أن تكون رقمية
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
دالة getTenantBySubdomain في DbService:
// apps/api/src/db/db.service.ts
import { Injectable } from '@nestjs/common';
import { NodePgDatabase, drizzle } from 'drizzle-orm/node-postgres';
import { Client } from 'pg';
import * as schema from '@apex/db/src/schema'; // استيراد Drizzle Schema
import { eq } from 'drizzle-orm';

@Injectable()
export class DbService {
  private db: NodePgDatabase<typeof schema>;
  private pgClient: Client;

  constructor(private configService: ConfigService) {
    this.pgClient = new Client({
      connectionString: this.configService.get<string>('DATABASE_URL'),
    });
    this.pgClient.connect();
    this.db = drizzle(this.pgClient, { schema });
  }

  async getTenantBySubdomain(subdomain: string) {
    const result = await this.db.select().from(schema.tenants).where(eq(schema.tenants.subdomain, subdomain)).limit(1);
    return result[0] || null;
  }

  async setTenantContext(tenantId: string): Promise<void> {
    // هذا الأمر يعين متغير جلسة في قاعدة البيانات
    // يجب أن يتم تنفيذه في نفس الجلسة (connection) التي ستُستخدم للاستعلامات اللاحقة
    await this.pgClient.query(`SET LOCAL app.current_tenant = '${tenantId}'`);
  }

  // دالة مساعدة لتنفيذ الاستعلامات مع ضمان السياق
  // بدلاً من استخدام this.db مباشرة، يمكن استخدام هذه الدالة
  async executeTenantQuery<T>(queryBuilder: (db: NodePgDatabase<typeof schema>) => Promise<T>): Promise<T> {
    // يمكن هنا إعادة إنشاء اتصال مؤقت لضمان أن SET LOCAL يتم تطبيقه
    // ولكن النهج الأكثر فعالية هو التأكد من أن DbService تستخدم اتصالاً واحداً لكل طلب
    // وهذا يتطلب إدارة جيدة للاتصالات (pooler) و Contextual Bindings في NestJS
    // للمثال المبسّط، نفترض أن pgClient الحالي يتم استخدامه لكل طلب بشكل منفصل أو managed through a request-scoped provider.
    return queryBuilder(this.db);
  }
}
ملاحظة هامة: إدارة اتصالات قاعدة البيانات مع SET LOCAL في سياق تطبيقات الويب (خاصة NestJS) تتطلب عناية. يجب التأكد من أن أمر SET LOCAL يتم تطبيقه على نفس الاتصال الذي ستنفذ عليه الاستعلامات اللاحقة لهذا الطلب. هذا عادة ما يتطلب request-scoped DbService أو transaction pool مخصص لكل طلب. الطريقة المبسطة أعلاه قد لا تكون كافية في بيئة إنتاج ذات concurrency عالية.
3.3. إعداد RLS (PostgreSQL & Drizzle ORM):

الغرض: ضمان أن قاعدة البيانات نفسها تفرض عزل البيانات، بغض النظر عن الكود.
الخطة التنفيذية:
تمكين RLS على الجداول ذات الصلة:
لكل جدول يحتوي على بيانات خاصة بالمستأجر، يجب تمكين RLS وإضافة عمود tenant_id.
-- أولاً، إضافة عمود tenant_id إذا لم يكن موجودًا
ALTER TABLE products ADD COLUMN tenant_id UUID NOT NULL;
ALTER TABLE products ADD CONSTRAINT fk_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id);
CREATE INDEX ON products (tenant_id);

-- تفعيل RLS على جدول المنتجات
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- إنشاء سياسة RLS لعزل المستأجرين
-- هذه السياسة ستسمح للمستخدمين (بالدور app_user) برؤية وتعديل الصفوف فقط حيث يكون tenant_id مطابقًا
-- لقيمة app.current_tenant المُعينة في الجلسة.
CREATE POLICY tenant_isolation ON products
FOR ALL -- ينطبق على SELECT, INSERT, UPDATE, DELETE
USING (tenant_id = current_setting('app.current_tenant', true)::uuid);

-- (اختياري) لضمان أن مدير قاعدة البيانات (بصلاحيات عالية) يمكنه تجاوز RLS:
ALTER TABLE products FORCE ROW LEVEL SECURITY; -- يجبر جميع المستخدمين (حتى المشرفين) على اتباع السياسات
-- للحسابات ذات الصلاحيات العالية (مثل الدور admin_user)، يمكن تجاوز RLS.
-- ولكن هذا النهج يركز على التطبيق (app_user)
Drizzle ORM Hooks/Query Enhancers:
Drizzle ORM لا يحتوي على "hooks" مدمجة بنفس طريقة بعض الـ ORMs الأخرى، لكن يمكن تحقيق هذا الهدف عبر:
تغليف الاستعلامات: إنشاء دالة مساعدة في DbService (كما هو موضح في setTenantContext و executeTenantQuery أعلاه) تضمن أن أمر SET LOCAL يتم تنفيذه في بداية كل معاملة أو طلب خاص بالمستأجر.
استخدام اتصالات خاصة بالطلب: في NestJS، يمكن جعل DbService Request-scoped لتوفير اتصال قاعدة بيانات جديد لكل طلب، مما يضمن أن SET LOCAL يؤثر فقط على هذا الطلب.
مثال على استخدام Drizzle مع tenantId (في خدمة NestJS):
// apps/api/src/products/products.service.ts
import { Injectable, Scope, Inject } from '@nestjs/common';
import { DbService } from '../db/db.service';
import * as schema from '@apex/db/src/schema';
import { eq } from 'drizzle-orm';
import { REQUEST } from '@nestjs/core';
import { Request } from 'express';

@Injectable({ scope: Scope.REQUEST }) // جعل الخدمة request-scoped
export class ProductsService {
  private tenantId: string;

  constructor(
    private readonly dbService: DbService,
    @Inject(REQUEST) private readonly request: Request,
  ) {
    this.tenantId = (request as any).tenantId; // الحصول على tenantId من الـ middleware
    if (!this.tenantId) {
        throw new Error('Tenant ID not set in request context.');
    }
    // DbService already set the SET LOCAL for this request
  }

  async getProducts() {
    // Drizzle queries will automatically respect RLS as SET LOCAL is active
    return this.dbService.db.select().from(schema.products).execute();
    // RLS سيضمن أن هذا الاستعلام سيرجع فقط المنتجات ذات الصلة بـ tenantId المحدد في SET LOCAL
  }

  async createProduct(name: string, price: string) {
    return this.dbService.db.insert(schema.products).values({
      name,
      price,
      tenantId: this.tenantId, // مهم: يجب تعيين tenantId عند الإدراج
    }).returning();
  }
}
ملاحظة: لضمان عمل SET LOCAL بشكل صحيح، يجب أن يكون DbService في NestJS مضبوطاً ليكون Request-scoped أو أن كل عملية استعلام تُجري عبر dbService تقوم بإدارة الاتصال بشكل صحيح لضمان أن SET LOCAL يطبق على الاتصال الصحيح.
3.4. معالجة الأخطاء:

الغرض: تقديم استجابات واضحة للمستخدم في حالة عدم العثور على المستأجر.
الخطة التنفيذية:
كما هو موضح في TenantMiddleware، في حالة عدم العثور على tenantId صالح بعد البحث في Redis وقاعدة البيانات، يتم إلقاء HttpException (إما NOT_FOUND أو FORBIDDEN).
404 Not Found: إذا لم يكن هناك مستأجر بهذا الـ subdomain على الإطلاق.
403 Forbidden: يمكن استخدامها إذا كان الـ subdomain موجودًا ولكنه غير نشط أو لا يملك المستخدم الحالي صلاحية الوصول إليه (يتطلب منطقًا إضافيًا). 404 هو الأكثر أمانًا في البداية لتجنب تسريب معلومات عن وجود المستأجرين.
3.5. اختبارات التكامل (End-to-End Tests):

الغرض: التحقق من أن آلية عزل المستأجرين تعمل بشكل صحيح.
الخطة التنفيذية:
إعداد بيئة اختبار: استخدم Test NestJS Application و Supertest لإرسال طلبات HTTP.
بذور البيانات: قم بملء قاعدة البيانات ببيانات مستأجرين مختلفة (مثلاً، منتجات لـ alpha ومنتجات لـ beta).
سيناريوهات الاختبار:
طلب ناجح للمستأجر alpha:
// apps/api/test/tenant-isolation.e2e-spec.ts
import * as request from 'supertest';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from '../src/app.module';
import { DbService } from '../src/db/db.service';
import { tenants, products } from '@apex/db/src/schema';
import { faker } from '@faker-js/faker';

describe('Tenant Isolation (e2e)', () => {
  let app: INestApplication;
  let dbService: DbService;
  let alphaTenantId: string;
  let betaTenantId: string;

  beforeAll(async () => {
    // ... (إعداد TestModule و DbService و RedisService)
    app = await moduleFixture.createNestApplication();
    await app.init();
    dbService = app.get(DbService);

    // إعداد بيانات المستأجرين والمنتجات
    await dbService.db.delete(tenants);
    await dbService.db.delete(products);

    const alpha = await dbService.db.insert(tenants).values({ subdomain: 'alpha', name: 'Alpha Corp' }).returning({ id: tenants.id });
    alphaTenantId = alpha[0].id;
    await dbService.db.insert(products).values({ tenantId: alphaTenantId, name: 'Alpha Product 1', price: faker.commerce.price() });
    await dbService.db.insert(products).values({ tenantId: alphaTenantId, name: 'Alpha Product 2', price: faker.commerce.price() });

    const beta = await dbService.db.insert(tenants).values({ subdomain: 'beta', name: 'Beta Corp' }).returning({ id: tenants.id });
    betaTenantId = beta[0].id;
    await dbService.db.insert(products).values({ tenantId: betaTenantId, name: 'Beta Product 1', price: faker.commerce.price() });
  });

  afterAll(async () => {
    await app.close();
  });

  it('should retrieve only alpha products when requesting alpha.apex.localhost', async () => {
    const response = await request(app.getHttpServer())
      .get('/products')
      .set('Host', 'alpha.apex.localhost')
      .expect(200);

    expect(response.body).toHaveLength(2);
    expect(response.body[0].name).toContain('Alpha');
    expect(response.body[1].name).toContain('Alpha');
  });

  it('should retrieve only beta products when requesting beta.apex.localhost', async () => {
    const response = await request(app.getHttpServer())
      .get('/products')
      .set('Host', 'beta.apex.localhost')
      .expect(200);

    expect(response.body).toHaveLength(1);
    expect(response.body[0].name).toContain('Beta');
  });

  it('should return 404 for an unknown subdomain', () => {
    return request(app.getHttpServer())
      .get('/products')
      .set('Host', 'unknown.apex.localhost')
      .expect(HttpStatus.NOT_FOUND);
  });
});
ملاحظة: سيتطلب ذلك تهيئة DbService و RedisService في بيئة الاختبار لـ testing purposes.
4. تحقيق الأهداف والتحقق (Achieving Objectives & Verification)
4.1. عزل بيانات Tenant (Tenant Data Isolation):

التحقق: اختبارات E2E (كما هو موضح أعلاه) تؤكد أن طلب GET /products إلى alpha.apex.localhost يعرض فقط المنتجات الخاصة بـ alpha (2 منتجات)، ولا يعرض أي منتجات من beta. والعكس صحيح لـ beta.apex.localhost.
4.2. حماية ضد تجاوز RLS (RLS Bypass Protection):

التحقق:
باستخدام أداة خارجية مثل psql، اتصل بقاعدة البيانات باسم المستخدم العادي للتطبيق (مثلاً app_user).
تأكد من عدم تعيين SET LOCAL app.current_tenant في الجلسة.
نفذ استعلامًا مباشرًا: SELECT * FROM products;
يجب أن تعود بمجموعات نتائج فارغة للجداول المطبقة عليها RLS، لأن current_setting('app.current_tenant', true) ستكون null أو غير معرّفة، وبالتالي لن تتطابق مع أي tenant_id حقيقي، ما لم تكن السياسة تسمح بذلك بشكل صريح.
4.3. أداء Caching (Caching Performance):

التحقق:
مراقبة مقاييس Redis (باستخدام Redis CLI أو أداة مراقبة).
تنفيذ عدد كبير من الطلبات المتكررة إلى نفس الـ subdomain.
توقع أن تظهر نسبة cache hit ratio عالية (أكثر من 95%) لعمليات البحث عن المستأجرين (tenant:subdomain).
تأكيد أن الطلب الأول لـ subdomain معين يؤدي إلى cache miss (يصل إلى DB) ثم يتم تخزينه، والطلبات اللاحقة لنفس الـ subdomain تؤدي إلى cache hit.
4.4. عدم وجود تسرب للبيانات (No Data Leakage):

التحقق:
مراجعة الكود: التأكد من أن جميع الجداول التي تحتوي على بيانات Tenant-specific تحتوي على عمود tenant_id.
مراجعة سياسات RLS: التأكد من أن CREATE POLICY موجودة ومُطبقة بشكل صحيح على جميع هذه الجداول.
اختبارات RLS: تنفيذ اختبارات إضافية (أو جزء من اختبارات E2E) تحاول الوصول إلى بيانات مستأجر آخر عمداً (مثلاً، عن طريق محاولة تمرير tenant_id في الاستعلامات يدوياً إذا لم تكن RLS مطبقة، أو محاولة تعديل بيانات مستأجر آخر). يجب أن تفشل هذه الاختبارات.
Prisma Studio/DBeaver: استخدام أدوات استعراض قاعدة البيانات للتأكد من أن البيانات مخزنة بشكل صحيح مع tenant_id المقابل.
ملخص وفوائد (Summary and Benefits)
بتطبيق Arch-Core-04 Tenant Isolation Middleware ⚡🌐، سيتم بناء نظام متعدد المستأجرين آمن وفعال للغاية:

عزل بيانات مضمون: يتم فصل بيانات المستأجرين بشكل آمن على مستوى قاعدة البيانات باستخدام RLS، مما يقلل من مخاطر تسرب البيانات.
تحسين الأداء: استخدام Redis caching لـ tenant IDs يقلل من الحمل على قاعدة البيانات ويسرع عملية تحديد المستأجر.
مرونة التطوير: يتيح نهج Subdomain-based للمطورين بناء تطبيقات متعددة المستأجرين بطريقة منظمة وواضحة.
تجربة مستخدم أفضل: يقلل من أوقات الاستجابة ويضمن أن كل مستخدم يرى بياناته فقط.
قابلية التوسع: يوفر حلاً يمكنه النمو مع عدد المستأجرين دون المساس بالأمان أو الأداء.
هذه الخطة توفر كل التفاصيل اللازمة لتصميم وتنفيذ نظام قوي لعزل المستأجرين في بيئة NestJS و PostgreSQL.