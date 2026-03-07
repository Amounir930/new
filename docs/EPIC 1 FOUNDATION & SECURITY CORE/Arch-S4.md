مقدمة:
تُعد سجلات المراجعة ضرورية لأغراض الأمان، الامتثال، وتتبع المشكلات في أي تطبيق. فهي توفر سجلاً غير قابل للتغيير لمن قام بماذا ومتى. يهدف هذا المشروع إلى تنفيذ نظام سجل مراجعة شامل في NestJS باستخدام AsyncLocalStorage لالتقاط سياق الطلب، و NestJS Interceptors لتتبع عمليات CUD (Create, Update, Delete) على الموارد الحساسة، وتسجيل التغييرات في جدول مخصص في PostgreSQL.

1. مفهوم سجلات المراجعة وسياق الطلب (Audit Logging & Request Context Concepts)
Audit Log: سجل زمني غير قابل للتغيير (append-only) يوثق الأحداث الهامة التي تحدث داخل النظام، عادةً عمليات CUD (إنشاء، تحديث، حذف) على البيانات.
Request Context: مجموعة من البيانات المتعلقة بطلب HTTP معين، مثل معرف المستخدم (user_id)، معرف المستأجر (tenant_id)، عنوان IP للعميل (ip_address)، ومعرف الطلب (request_id). هذه البيانات ضرورية لربط سجلات المراجعة بالطلب الأصلي والمستخدم الذي قام به.
AsyncLocalStorage: واجهة برمجة تطبيقات Node.js توفر آلية لتخزين البيانات المحلية لـ "سياق التنفيذ غير المتزامن" (asynchronous execution context). تسمح بتمرير البيانات تلقائيًا عبر سلاسل استدعاء غير متزامنة (مثل طلب HTTP بأكمله) دون الحاجة إلى تمريرها يدويًا عبر جميع الدوال.
NestJS Interceptors: ميزة في NestJS تسمح بـ "اعتراض" الطلبات والمعالجة على مستوى الـ Controller قبل وبعد تنفيذ المعالج. يمكن استخدامها لإضافة منطق مشترك مثل تسجيل الدخول، Caching، أو Audit Logging.
Append-Only Table: جدول قاعدة بيانات مصمم بحيث يتم إضافة السجلات إليه فقط، ولا يُسمح بتحديث أو حذف السجلات الموجودة. هذا يضمن سلامة سجلات المراجعة.
2. الأدوات المستخدمة (Tools Utilized)
NestJS Interceptors: لتطبيق منطق الاعتراض على مستوى الطلب.
AsyncLocalStorage (Node.js): لالتقاط ونشر سياق الطلب.
PostgreSQL: كقاعدة بيانات لتخزين سجلات المراجعة في جدول audit_logs.
Drizzle ORM: للتفاعل مع جدول audit_logs (من Arch-Core-04).
deep-diff (مكتبة اختيارية): لمقارنة الكائنات وتوليد تقرير بالتغييرات.
BullMQ: (اختياري، من Arch-Core-07) لتخزين سجلات المراجعة بشكل غير متزامن.
@apex/db، @apex/config: الحزم المشتركة في Monorepo.
3. استراتيجية التنفيذ والتكوين التفصيلي (Detailed Execution Strategy & Configuration)
3.1. تصميم جدول audit_logs في PostgreSQL:

الغرض: تخزين سجلات المراجعة بشكل منظم وغير قابل للتغيير.
الخطة التنفيذية:
تعريف Schema في Drizzle (packages/db/src/schema.ts):
// packages/db/src/schema.ts
import { pgTable, uuid, varchar, jsonb, timestamp } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const auditLogs = pgTable('audit_logs', {
  id: uuid('id').default(sql`gen_random_uuid()`).primaryKey(),
  userId: uuid('user_id'), // يمكن أن يكون null للعمليات غير المصادق عليها
  tenantId: uuid('tenant_id'), // يمكن أن يكون null للعمليات العالمية
  action: varchar('action', { length: 256 }).notNull(), // مثال: 'PRODUCT_CREATED', 'USER_DELETED'
  resourceType: varchar('resource_type', { length: 256 }).notNull(), // مثال: 'Product', 'User'
  resourceId: uuid('resource_id'), // يمكن أن يكون null للعمليات التي لا ترتبط بمورد محدد (مثل Login attempts)
  changes: jsonb('changes'), // لتخزين diff الكائن (old vs new) أو payload
  ipAddress: varchar('ip_address', { length: 64 }),
  timestamp: timestamp('timestamp').defaultNow().notNull(),
});
إنشاء Migration: استخدم Drizzle Kit لتوليد Migration لتطبيق هذا الجدول على قاعدة البيانات.
# في packages/db (بعد تغيير schema.ts)
bun drizzle-kit generate:pg
bun drizzle-kit migrate
فرض Append-Only (اختياري لكن موصى به):
على مستوى المستخدمين: تأكد من أن الدور الذي يتصل به تطبيقك (app_user) لديه فقط صلاحيات INSERT و SELECT على جدول audit_logs.
على مستوى RLS: إذا كنت تستخدم RLS، يمكن كتابة سياسات تمنع UPDATE و DELETE حتى لمديري النظام (لضمان عدم العبث بالسجلات).
-- على سبيل المثال، لمنع أي تحديث أو حذف على جدول audit_logs
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY audit_logs_read_only ON audit_logs FOR UPDATE USING (false);
CREATE POLICY audit_logs_no_delete ON audit_logs FOR DELETE USING (false);
3.2. خدمة AuditService:

الغرض: توفير نقطة واحدة مركزية لتسجيل أحداث المراجعة، والتعامل مع حساب التغييرات (diff) والوصول إلى سياق AsyncLocalStorage.
الخطة التنفيذية:
إنشاء AuditService (apps/api/src/audit/audit.service.ts):
// apps/api/src/audit/audit.service.ts
import { Injectable, Optional, Inject } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { DbService } from '../db/db.service'; // من Arch-Core-04
import * as schema from '@apex/db/src/schema';
import { auditLogs } from '@apex/db/src/schema'; // استيراد جدول audit_logs
import { AsyncLocalStorage } from 'async_hooks';
import { diff } from 'deep-diff'; // تثبيت bun add deep-diff

// تعريف واجهة لسياق AsyncLocalStorage
interface AuditContext {
  userId?: string;
  tenantId?: string;
  ipAddress?: string;
  requestId?: string; // لربط السجلات بنفس الطلب
  auditEvents: AuditLogEntry[]; // لتجميع الأحداث خلال الطلب الواحد
}

// تعريف واجهة لمدخل سجل المراجعة
interface AuditLogEntry {
  action: string;
  resourceType: string;
  resourceId?: string;
  oldValue?: Record<string, any>; // الحالة قبل التغيير
  newValue?: Record<string, any>; // الحالة بعد التغيير
  changes?: any; // نتيجة deep-diff
  payload?: Record<string, any>; // الحمولة الكاملة للـ POST/PUT
}

@Injectable()
export class AuditService {
  private db: NodePgDatabase<typeof schema>;

  constructor(
    private readonly dbService: DbService, // DbService لتوفير اتصال Drizzle
    @Optional() @Inject('AUDIT_ASYNC_LOCAL_STORAGE')
    private readonly als: AsyncLocalStorage<AuditContext> | undefined,
  ) {
    this.db = dbService.db;
    if (!this.als) {
        console.warn('AsyncLocalStorage for AuditService is not provided. Audit logs might miss context.');
    }
  }

  /**
   * يسجل حدث مراجعة (CUD)
   * @param entry تفاصيل حدث المراجعة
   */
  async logCUDEvent(entry: AuditLogEntry): Promise<void> {
    const context = this.als?.getStore(); // الحصول على السياق الحالي من AsyncLocalStorage

    // حساب التغييرات باستخدام deep-diff إذا كانت البيانات قبل وبعد متاحة
    let changesData = null;
    if (entry.oldValue && entry.newValue) {
      changesData = diff(entry.oldValue, entry.newValue);
    } else if (entry.payload) {
      changesData = entry.payload; // في حالة الـ POST، يمكن تخزين الحمولة مباشرة
    } else if (entry.changes) {
      changesData = entry.changes; // إذا كانت التغييرات تم حسابها مسبقًا
    }

    const auditRecord = {
      userId: context?.userId,
      tenantId: context?.tenantId,
      action: entry.action,
      resourceType: entry.resourceType,
      resourceId: entry.resourceId,
      changes: changesData, // سيتم تخزينها كـ JSONB
      ipAddress: context?.ipAddress,
    };

    // يمكن تخزين هذا في قائمة الانتظار المؤقتة ثم دفعه إلى DB في نهاية الطلب
    // أو إرساله مباشرة إلى BullMQ
    if (context) {
      context.auditEvents.push(auditRecord); // جمع الأحداث لتسجيلها لاحقًا
    } else {
      // إذا لم يكن هناك سياق (مثلاً، من سكربت خلفية)، قم بالتسجيل مباشرة
      await this.db.insert(auditLogs).values(auditRecord);
    }
  }

  /**
   * يسجل الأحداث المجمعة في سياق AsyncLocalStorage إلى قاعدة البيانات.
   * يُستدعى هذا عادةً من AuditLogInterceptor عند انتهاء الطلب.
   */
  async flushAuditLogs(): Promise<void> {
    const context = this.als?.getStore();
    if (context && context.auditEvents.length > 0) {
      // يمكن هنا إرسالها إلى BullMQ بدلاً من الإدراج المباشر
      await this.db.insert(auditLogs).values(context.auditEvents);
      context.auditEvents = []; // تفريغ الأحداث بعد التسجيل
    }
  }
}
توفير AuditService في AppModule:
// apps/api/src/app.module.ts
import { Module, MiddlewareConsumer, RequestMethod } from '@nestjs/common';
import { AsyncLocalStorage } from 'async_hooks'; // استيراد AsyncLocalStorage
import { AuditService } from './audit/audit.service';
import { AuditLogInterceptor } from './common/interceptors/audit-log.interceptor';
// ...

@Module({
  imports: [/* ... */],
  providers: [
    AuditService,
    { // توفير AsyncLocalStorage كرمز مميز
        provide: 'AUDIT_ASYNC_LOCAL_STORAGE',
        useValue: new AsyncLocalStorage<AuditContext>(),
    },
    // ...
  ],
  exports: [AuditService], // تصدير AuditService إذا كانت الوحدات الأخرى تحتاج إليه
})
export class AppModule {
    // ...
}
3.3. AuditLogInterceptor:

الغرض: تهيئة AsyncLocalStorage لكل طلب، وتحديد متى يتم تسجيل حدث مراجعة.
الخطة التنفيذية:
إنشاء AuditLogInterceptor (packages/common/interceptors/audit-log.interceptor.ts):
// packages/common/interceptors/audit-log.interceptor.ts
import { CallHandler, ExecutionContext, Injectable, NestInterceptor, Inject } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AsyncLocalStorage } from 'async_hooks';
import { Request } from 'express';
import { AuditService } from '../../apps/api/src/audit/audit.service'; // المسار يجب أن يكون صحيحًا

interface AuditContext {
  userId?: string;
  tenantId?: string;
  ipAddress?: string;
  requestId?: string;
  auditEvents: AuditLogEntry[];
}

@Injectable()
export class AuditLogInterceptor implements NestInterceptor {
  constructor(
    private readonly auditService: AuditService,
    @Inject('AUDIT_ASYNC_LOCAL_STORAGE')
    private readonly als: AsyncLocalStorage<AuditContext>,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse();

    const userId = (request as any).user?.id; // افترض أن معرف المستخدم موجود في req.user
    const tenantId = (request as any).tenantId; // من Arch-Core-04 Tenant Isolation Middleware
    const ipAddress = request.ip || request.headers['x-forwarded-for'] as string;
    const requestId = request.headers['x-request-id'] as string || Math.random().toString(36).substring(2, 15); // توليد معرف طلب

    const store: AuditContext = {
      userId,
      tenantId,
      ipAddress,
      requestId,
      auditEvents: [], // لتجميع الأحداث لكل طلب
    };

    // تشغيل سلسلة التنفيذ داخل سياق AsyncLocalStorage
    return this.als.run(store, () =>
      next.handle().pipe(
        tap(
          () => {
            // عند اكتمال الطلب بنجاح، يتم تفريغ سجلات المراجعة المجمعة
            this.auditService.flushAuditLogs();
          },
          (error) => {
            // يمكن هنا إضافة سجلات مراجعة للفشل
            // ومع ذلك، لن يتم تفريغ سجلات المراجعة المجمعة إذا كان هناك خطأ
            // يمكن للمطورين إضافة سجلات الفشل مباشرة في AuditService
            console.error(`Request failed, not flushing audit logs: ${error.message}`);
          }
        ),
      ),
    );
  }
}
تطبيق الـ Interceptor عالميًا في main.ts (لتطبيق API):
// apps/api/src/main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { AuditLogInterceptor } from './common/interceptors/audit-log.interceptor';
import { AuditService } from './audit/audit.service'; // لاستخدامه في Interceptor
import { AsyncLocalStorage } from 'async_hooks'; // لاستخدامه في Interceptor

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // حقن AuditService و AsyncLocalStorage في Interceptor يدويا
  // أو تسجيل Interceptor كـ Global
  const auditService = app.get(AuditService);
  const als = app.get<AsyncLocalStorage<any>>('AUDIT_ASYNC_LOCAL_STORAGE');
  app.useGlobalInterceptors(new AuditLogInterceptor(auditService, als));

  // ... (باقي التكوين)
  await app.listen(3000);
}
bootstrap();
3.4. تتبع العمليات في الخدمات:

الغرض: تحديد نقاط محددة في منطق العمل لتسجيل أحداث CUD التفصيلية، بما في ذلك التغييرات.
الخطة التنفيذية:
في الخدمات (مثلاً ProductsService):
// apps/api/src/products/products.service.ts
import { Injectable } from '@nestjs/common';
import { AuditService } from '../audit/audit.service';
import { Product } from '@apex/db/src/schema'; // Drizzle schema
import * as schema from '@apex/db/src/schema';
import { DbService } from '../db/db.service';
import { eq } from 'drizzle-orm';

@Injectable()
export class ProductsService {
  constructor(
    private readonly auditService: AuditService,
    private readonly dbService: DbService,
  ) {}

  async createProduct(data: Partial<Product>): Promise<Product> {
    const [newProduct] = await this.dbService.db.insert(schema.products).values({ ...data, tenantId: 'some-tenant-id' }).returning();
    await this.auditService.logCUDEvent({
      action: 'PRODUCT_CREATED',
      resourceType: 'Product',
      resourceId: newProduct.id,
      payload: data, // تسجيل حمولة الإنشاء
      // لا يوجد oldValue هنا
      newValue: newProduct, // تسجيل الكائن الجديد
    });
    return newProduct;
  }

  async updateProduct(id: string, data: Partial<Product>): Promise<Product | null> {
    const [oldProduct] = await this.dbService.db.select().from(schema.products).where(eq(schema.products.id, id));
    if (!oldProduct) return null;

    const [updatedProduct] = await this.dbService.db.update(schema.products)
      .set(data)
      .where(eq(schema.products.id, id))
      .returning();

    await this.auditService.logCUDEvent({
      action: 'PRODUCT_UPDATED',
      resourceType: 'Product',
      resourceId: id,
      oldValue: oldProduct,
      newValue: updatedProduct,
    });
    return updatedProduct;
  }

  async deleteProduct(id: string): Promise<Product | null> {
    const [deletedProduct] = await this.dbService.db.delete(schema.products).where(eq(schema.products.id, id)).returning();
    if (!deletedProduct) return null;

    await this.auditService.logCUDEvent({
      action: 'PRODUCT_DELETED',
      resourceType: 'Product',
      resourceId: id,
      oldValue: deletedProduct, // تسجيل الحالة قبل الحذف
      // لا يوجد newValue هنا
    });
    return deletedProduct;
  }
}
3.5. تخزين البيانات (خيارات التكامل):

الخطة التنفيذية (افتراضي: مباشر إلى DB):
كما هو موضح في AuditService.logCUDEvent، يتم الإدراج المباشر في جدول audit_logs عبر dbService.
الخطة التنفيذية (بديل: عبر BullMQ للأنظمة الكبيرة):
تكوين auditQueue في apps/api (AppModule):
// apps/api/src/app.module.ts
import { BullModule } from '@nestjs/bullmq';
// ...
@Module({
    imports: [
        BullModule.registerQueue({ name: 'auditQueue' }),
        // ...
    ],
    // ...
})
export class AppModule {}
تعديل AuditService.logCUDEvent لإرسال إلى BullMQ:
// apps/api/src/audit/audit.service.ts
import { Queue } from 'bullmq';
import { InjectQueue } from '@nestjs/bullmq';
// ...
export class AuditService {
    constructor(
        // ...
        @InjectQueue('auditQueue') private readonly auditQueue: Queue, // حقن AuditQueue
    ) { /* ... */ }

    async logCUDEvent(entry: AuditLogEntry): Promise<void> {
        // ... (نفس حساب changesData) ...
        const auditRecord = { /* ... */ };

        // بدلاً من الإدراج المباشر في DB، أرسل إلى BullMQ
        await this.auditQueue.add('logAuditEvent', auditRecord, {
            attempts: 5, // إعادة المحاولة إذا فشل عامل الـ Worker
            backoff: { type: 'exponential', delay: 1000 },
            removeOnComplete: true,
            removeOnFail: false, // لتمكين المراجعة اليدوية للمهام الفاشلة
        });
    }
    // ...
}
إنشاء AuditProcessor في apps/worker:
// apps/worker/src/processors/audit.processor.ts
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { DbService } from '../../api/src/db/db.service'; // استخدام DbService العامل للـ worker
import { auditLogs } from '@apex/db/src/schema'; // استيراد جدول audit_logs

@Processor('auditQueue')
export class AuditProcessor extends WorkerHost {
  private readonly logger = new Logger(AuditProcessor.name);
  private db: NodePgDatabase<typeof schema>;

  constructor(private readonly dbService: DbService) {
    super();
    this.db = dbService.db;
  }

  async process(job: Job<any, any, string>): Promise<any> {
    this.logger.log(`Processing audit log job ${job.id}`);
    const auditRecord = job.data;
    try {
      await this.db.insert(auditLogs).values(auditRecord);
      this.logger.log(`Audit log ${job.id} inserted successfully.`);
      return { status: 'logged' };
    } catch (error) {
      this.logger.error(`Failed to insert audit log ${job.id}: ${error.message}`, error.stack);
      throw error; // إعادة إلقاء الخطأ للسماح لـ BullMQ بإعادة المحاولة
    }
  }
}
تسجيل auditQueue و AuditProcessor في apps/worker (WorkerModule):
// apps/worker/src/worker.module.ts
import { BullModule } from '@nestjs/bullmq';
import { AuditProcessor } from './processors/audit.processor';
// ...
@Module({
  imports: [
    // ...
    BullModule.registerQueue({ name: 'auditQueue' }),
  ],
  providers: [AuditProcessor], // إضافة AuditProcessor هنا
})
export class WorkerModule {}
4. تحقيق الأهداف والتحقق (Achieving Objectives & Verification)
4.1. تسجيل شامل (Comprehensive Logging):

الخطة التنفيذية:
ابدأ جميع الخدمات (API، Worker، PostgreSQL، Redis).
نفذ عمليات CUD كاملة على موارد حساسة (مثل المنتجات والمستخدمين) من خلال الـ API (مثلاً: POST /products, PATCH /products/:id, DELETE /products/:id).
تأكد من أن المستخدم مصادق عليه وأن tenant_id صحيح.
الهدف والمتوقع: أي عملية CUD (إنشاء، تحديث، حذف) لمنتج، طلب، أو مستخدم تسجل إدخالًا جديدًا في جدول audit_logs.
التحقق:
بعد إجراء العمليات، قم بالاستعلام مباشرة عن جدول audit_logs في PostgreSQL:
SELECT id, user_id, tenant_id, action, resource_type, resource_id, changes, ip_address, timestamp FROM audit_logs ORDER BY timestamp DESC;
تأكد من وجود سجل لكل عملية CUD تم إجراؤها.
4.2. سياق كامل (Complete Context):

الخطة التنفيذية:
تأكد من أن Tenant Isolation Middleware يعمل بشكل صحيح.
سجل الدخول كمستخدم، ثم نفذ عمليات CUD متعددة تحت مستأجرين مختلفين.
الهدف والمتوقع: كل سجل مراجعة يحتوي على user_id و tenant_id صحيحين (إذا كانت العملية مرتبطة بمستخدم ومستأجر)، و action واضح، و changes_jsonb يوضح التغييرات التي تمت.
التحقق:
فحص كل سجل في audit_logs:
user_id: يجب أن يتطابق مع معرف المستخدم الذي قام بالعملية.
tenant_id: يجب أن يتطابق مع معرف المستأجر الذي تم من خلاله تنفيذ العملية.
action: يجب أن يكون وصفياً للعملية (مثلاً PRODUCT_CREATED).
resource_type: يجب أن يكون مطابقًا لنوع المورد (مثلاً Product).
resource_id: يجب أن يكون معرف المورد المتأثر.
changes_jsonb (عمود changes): يجب أن يحتوي على diff دقيق بين الحالة القديمة والجديدة للمورد، أو الحمولة الكاملة للإنشاء.
4.3. عدم قابلية للتغيير (Immutability):

الخطة التنفيذية:
اتصل بقاعدة البيانات باستخدام بيانات اعتماد app_user (الدور الذي يستخدمه التطبيق).
حاول تنفيذ أمر UPDATE على سجل موجود في audit_logs (مثلاً تغيير action).
حاول تنفيذ أمر DELETE على سجل موجود في audit_logs.
الهدف والمتوقع: محاولة UPDATE أو DELETE لسجل في audit_logs تفشل بسبب قيود (constraints) أو RLS (إذا كان مطبقًا).
التحقق:
يجب أن تفشل كلتا العمليتين (UPDATE و DELETE) وتنتج رسالة خطأ تشير إلى عدم وجود صلاحيات أو انتهاك لسياسة RLS.
تحقق من أن الدور app_user لديه فقط صلاحية INSERT و SELECT على جدول audit_logs.
4.4. اختبارات Interceptor (Interceptor Tests):

الخطة التنفيذية:
اختبارات الوحدة لـ AuditLogInterceptor و AuditService:
كتابة اختبارات للـ AuditLogInterceptor للتأكد من أنه يقوم بتهيئة AsyncLocalStorage بشكل صحيح، ويلتقط سياق الطلب (userId, tenantId, ipAddress)، ويستدعي auditService.flushAuditLogs() عند اكتمال الطلب.
كتابة اختبارات لـ AuditService للتأكد من أنه يحسب deep-diff بشكل صحيح، ويقوم بإنشاء السجل في قاعدة البيانات (أو يضيفه إلى BullMQ queue).
اختبارات التكامل/E2E: (تم تغطيتها جزئيًا في النقاط 4.1 و 4.2)
كتابة اختبارات E2E تقوم بإجراء عمليات CUD فعلية عبر الـ API.
بعد كل عملية، قم بالتحقق من محتوى جدول audit_logs مباشرة للتأكد من تسجيل البيانات الصحيحة.
الهدف والمتوقع: اختبارات الوحدة والتكامل للـ Interceptor تؤكد أنه يلتقط البيانات الصحيحة وأن آلية التسجيل تعمل كما هو متوقع.
التحقق:
اجتياز جميع الاختبارات مع تغطية كود جيدة.
5. ملخص وفوائد (Summary and Benefits)
بتطبيق Arch-S4 Audit Logging Interceptor ⚡، سيتم تحقيق ما يلي:

أمان محسن: توفير سجلات غير قابلة للتغيير لأي تغييرات تتم على البيانات الحساسة، مما يساعد في التحقيق في الحوادث الأمنية.
امتثال وسهولة التدقيق: تلبية متطلبات الامتثال التنظيمي التي تتطلب سجلات مراجعة مفصلة.
تتبع وحل المشكلات: القدرة على تتبع من قام بماذا ومتى، مما يسهل تصحيح الأخطاء وتحديد مصدر المشكلات.
رؤية شاملة: ربط سجلات المراجعة بسياق الطلب الكامل (المستخدم، المستأجر، IP) يوفر رؤية غنية بالمعلومات.
أداء قابل للتوسع: استخدام AsyncLocalStorage يقلل من تعقيد تمرير السياق، واستخدام BullMQ (اختياري) يمكن أن يفصل كتابة سجلات المراجعة عن تدفق الطلب، مما يحسن من استجابة الـ API.
كود نظيف: استخدام Interceptors وخدمات مخصصة يبقي منطق تسجيل المراجعة بعيدًا عن منطق العمل الأساسي.
هذه الخطة توفر تفاصيل شاملة لهيكل وتنفيذ نظام سجل مراجعة قوي وفعال في تطبيقات NestJS.