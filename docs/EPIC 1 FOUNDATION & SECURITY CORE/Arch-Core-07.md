Arch-Core-07: Async Job Queue (BullMQ) 🚀
مقدمة:
في التطبيقات الحديثة، غالبًا ما تكون هناك مهام تستغرق وقتًا طويلاً أو تتطلب معالجة في الخلفية دون حظر استجابة واجهة برمجة التطبيقات (API). أمثلة على ذلك تشمل إرسال رسائل البريد الإلكتروني، معالجة الصور، مزامنة البيانات، أو عمليات الذكاء الاصطناعي. يهدف هذا المشروع إلى تنفيذ نظام قائمة انتظار مهام قوي وغير متزامن باستخدام BullMQ، مدعومًا بـ Redis، لضمان معالجة هذه المهام بكفاءة وموثوقية، وتحسين استجابة الـ API.

1. مفهوم قائمة انتظار المهام غير المتزامنة (Async Job Queue Concepts)
المهام غير المتزامنة: هي مهام لا تحتاج إلى أن تُنفذ فورًا أو في نفس سياق الطلب الذي بدأها. يتم وضعها في قائمة انتظار ليتم معالجتها لاحقًا بواسطة "عمال" (Workers) مخصصين.
فصل الاهتمامات (Separation of Concerns): يفصل نظام قائمة انتظار المهام بين منطق العمل الذي يولد المهمة ومنطق العمل الذي يعالجها. هذا يحسن من قابلية التوسع والصيانة.
تحسين استجابة الـ API: بدلاً من انتظار مهمة طويلة الأمد لتكتمل، يمكن للـ API وضع المهمة في قائمة الانتظار والرد فورًا على العميل، مما يوفر تجربة مستخدم أفضل.
الموثوقية: يمكن لنظام قائمة انتظار المهام التعامل مع الفشل عن طريق إعادة محاولة المهام، وتخزين المهام الفاشلة للمراجعة.
BullMQ: مكتبة قوية وموثوقة لقوائم انتظار المهام لـ Node.js، مبنية على Redis. توفر ميزات مثل إعادة المحاولة، التأخير، التزامن، والمراقبة.
Redis: يُستخدم كـ "وسيط رسائل" (Message Broker) لـ BullMQ. يخزن Redis جميع بيانات قائمة الانتظار (المهام، حالاتها، نتائجها).
2. الأدوات المستخدمة (Tools Utilized)
BullMQ: مكتبة قائمة انتظار المهام.
Redis 🚀: وسيط الرسائل (من Arch-Core-02).
ioredis: عميل Redis قوي وموثوق لـ Node.js.
NestJS: لتطوير تطبيقات الـ API والـ Worker.
bull-board: لوحة تحكم لمراقبة مهام BullMQ.
3. استراتيجية التنفيذ والتكوين التفصيلي (Detailed Execution Strategy & Configuration)
3.1. خدمة Worker مخصصة:

الغرض: فصل منطق معالجة المهام عن الـ API الرئيسي لضمان عدم حظر الـ API وتحسين قابلية التوسع.
الخطة التنفيذية:
إنشاء تطبيق NestJS جديد (apps/worker):
cd apps
nest new worker --strict --package-manager bun
تثبيت التبعيات:
cd apps/worker
bun add bullmq ioredis @nestjs/bullmq
bun add -D @types/bullmq
تكوين WorkerModule:
// apps/worker/src/worker.module.ts
import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { EmailProcessor } from './processors/email.processor';
import { ProductSyncProcessor } from './processors/product-sync.processor';
// ... استيراد معالجات أخرى

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }), // لمتغيرات البيئة (من Arch-Core-03)
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        connection: {
          host: configService.get<string>('REDIS_HOST') || 'localhost',
          port: configService.get<number>('REDIS_PORT') || 6379,
          password: configService.get<string>('REDIS_PASSWORD'), // يُفضل استخدام Redis مع كلمة مرور في الإنتاج
        },
      }),
    }),
    BullModule.registerQueue(
      { name: 'emailQueue' },
      { name: 'productSyncQueue' },
      { name: 'aiProcessingQueue' },
      // ... تسجيل قوائم انتظار أخرى
    ),
  ],
  providers: [EmailProcessor, ProductSyncProcessor], // تسجيل المعالجات
})
export class WorkerModule {}
تعديل main.ts لـ Worker:
// apps/worker/src/main.ts
import { NestFactory } from '@nestjs/core';
import { WorkerModule } from './worker.module';
import { Logger } from '@nestjs/common';
import { EnvironmentSchema } from '@apex/config'; // من Arch-Core-03

async function bootstrap() {
  // التحقق من متغيرات البيئة قبل بدء Worker
  const config = process.env; // افترض أن متغيرات البيئة يتم تحميلها بالفعل
  try {
      EnvironmentSchema.parse(config); // استخدام EnvironmentSchema (قد تحتاج لتخصيصها للـ worker)
      Logger.log('Worker Environment variables validated successfully.', 'Bootstrap');
  } catch (error) {
      Logger.error('Invalid worker environment variables:', 'Bootstrap', error);
      process.exit(1);
  }

  const app = await NestFactory.createApplicationContext(WorkerModule);
  // لا نحتاج إلى الاستماع إلى منفذ HTTP لأن هذا تطبيق worker
  Logger.log('Worker Application Started', 'Bootstrap');
}
bootstrap();
تكوين REDIS_HOST, REDIS_PORT, REDIS_PASSWORD: في ملف .env لـ apps/worker (أو عبر EnvironmentSchema من Arch-Core-03). يجب أن يشير REDIS_HOST إلى redis (اسم خدمة Redis في docker-compose) و REDIS_PORT إلى 6379.
3.2. تكوين BullMQ:

الغرض: تعريف قوائم الانتظار ومعالجاتها، وتكوين خيارات الاتصال بـ Redis.
الخطة التنفيذية:
استخدام ioredis: يتم تكوينه تلقائيًا بواسطة @nestjs/bullmq عند استخدام BullModule.forRootAsync وتحديد connection object.
تعريف Queue لكل نوع من المهام:
في WorkerModule، استخدم BullModule.registerQueue لتسجيل كل قائمة انتظار.
إنشاء معالجات المهام (Job Processors):
// apps/worker/src/processors/email.processor.ts
import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';

interface EmailJobData {
  to: string;
  subject: string;
  body: string;
}

@Processor('emailQueue') // اسم قائمة الانتظار
export class EmailProcessor extends WorkerHost {
  private readonly logger = new Logger(EmailProcessor.name);

  async process(job: Job<EmailJobData, any, string>): Promise<any> {
    this.logger.log(`Processing email job ${job.id} for ${job.data.to}`);
    // محاكاة إرسال بريد إلكتروني
    if (job.data.to === 'fail@example.com') { // لغرض اختبار تتبع الأخطاء
      throw new Error('Failed to send email to fail@example.com');
    }
    await new Promise(resolve => setTimeout(resolve, 1000)); // محاكاة عمل يستغرق وقتًا
    this.logger.log(`Email job ${job.id} completed for ${job.data.to}`);
    return { status: 'sent', recipient: job.data.to };
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job) {
    this.logger.debug(`Job ${job.id} completed`);
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job, err: Error) {
    this.logger.error(`Job ${job.id} failed with error: ${err.message}`);
  }
}
// apps/worker/src/processors/product-sync.processor.ts
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';

interface ProductSyncJobData {
  productId: string;
  source: string;
}

@Processor('productSyncQueue')
export class ProductSyncProcessor extends WorkerHost {
  private readonly logger = new Logger(ProductSyncProcessor.name);

  async process(job: Job<ProductSyncJobData, any, string>): Promise<any> {
    this.logger.log(`Processing product sync job ${job.id} for product ${job.data.productId} from ${job.data.source}`);
    await new Promise(resolve => setTimeout(resolve, 2000));
    this.logger.log(`Product sync job ${job.id} completed`);
    return { status: 'synced', productId: job.data.productId };
  }
}
تكوينات Worker: يمكن تحديد عدد العمال (concurrency) لكل معالج في WorkerHost constructor.
// EmailProcessor constructor
constructor() {
    super({ concurrency: 5 }); // معالجة 5 مهام بريد إلكتروني بالتوازي
}
3.3. معالجة الأخطاء وإعادة المحاولة:

الغرض: زيادة موثوقية نظام قائمة انتظار المهام عن طريق التعامل مع الفشل المؤقت وإعادة محاولة المهام، وتوفير آلية لمراجعة المهام الفاشلة بشكل دائم.
الخطة التنفيذية:
تكوين خيارات attempts و backoff: عند إضافة مهمة إلى قائمة الانتظار.
// apps/api/src/email/email.service.ts (مثال)
import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Injectable()
export class EmailService {
  constructor(@InjectQueue('emailQueue') private readonly emailQueue: Queue) {}

  async sendEmail(to: string, subject: string, body: string) {
    const job = await this.emailQueue.add(
      'sendEmail', // اسم المهمة داخل قائمة الانتظار (يمكن أن يكون أي string)
      { to, subject, body }, // الـ payload الفعلي للمهمة
      {
        attempts: 3, // إعادة المحاولة 3 مرات
        backoff: {
          type: 'exponential', // تأخير متزايد (مثلاً: 1s, 2s, 4s)
          delay: 1000, // البدء بتأخير 1 ثانية
        },
        removeOnComplete: true, // إزالة المهمة عند الانتهاء بنجاح
        removeOnFail: false, // عدم إزالة المهام عند الفشل (لتمكين المراجعة في DLQ)
        jobId: Math.random().toString(36).substring(2, 15), // مثال لـ jobId فريد
      },
    );
    return job.id;
  }
}
إنشاء Dead-Letter Queue (DLQ):
في BullMQ، المهام التي تستنفد جميع محاولاتها تنتقل تلقائيًا إلى حالة failed. يمكن اعتبار قائمة المهام الفاشلة في كل Queue كـ DLQ.
يمكن مراقبة هذه المهام الفاشلة واستعراض تفاصيلها عبر BullMQ Dashboard.
لإعادة معالجة المهام الفاشلة، يمكن استخدام واجهة برمجة تطبيقات BullMQ (queue.retryJob(jobId)) أو BullMQ Dashboard لتحديد المهام الفاشلة وإعادة تشغيلها.
3.4. إرسال المهام من API:

الغرض: السماح للـ API بإرسال المهام إلى قائمة الانتظار دون حظر استجابتها.
الخطة التنفيذية:
تثبيت التبعيات في تطبيق الـ API:
cd apps/api
bun add bullmq ioredis @nestjs/bullmq
تكوين BullModule في AppModule (أو EmailModule، ProductModule) في الـ API:
// apps/api/src/app.module.ts
import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { EmailModule } from './email/email.module'; // مثال

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }), // من Arch-Core-03
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        connection: {
          host: configService.get<string>('REDIS_HOST') || 'localhost',
          port: configService.get<number>('REDIS_PORT') || 6379,
          password: configService.get<string>('REDIS_PASSWORD'),
        },
      }),
    }),
    EmailModule, // استيراد الوحدة التي ترسل المهام
  ],
  // ...
})
export class AppModule {}
// apps/api/src/email/email.module.ts
import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { EmailService } from './email.service';
import { EmailController } from './email.controller';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'emailQueue', // تسجيل قائمة الانتظار التي سيتم إرسال المهام إليها
    }),
  ],
  providers: [EmailService],
  controllers: [EmailController],
  exports: [EmailService],
})
export class EmailModule {}
إرسال المهام من Controller/Service:
استخدم @InjectQueue('queueName') لحقن Queue object.
استخدم queue.add('jobName', payload, options) لإضافة المهام.
jobId: uuid(): مهم جداً لتتبع المهام بشكل فريد. يمكن استخدام مكتبة uuid لتوليدها.
parent: { id: parentJobId, queue: parentQueueName }: لتتبع المهام الفرعية (Child Jobs) إذا كانت هناك مهام تعتمد على مهام أخرى.
3.5. لوحة تحكم BullMQ:

الغرض: توفير واجهة رسومية لمراقبة حالة قوائم الانتظار والمهام (النشطة، المعلقة، المكتملة، الفاشلة).
الخطة التنفيذية:
تثبيت bull-board:
cd apps/api # أو تطبيق منفصل للمراقبة (موصى به في بيئات الإنتاج)
bun add @bull-board/api @bull-board/express
تكوين لوحة التحكم في تطبيق NestJS (عادةً في main.ts أو وحدة مخصصة):
// apps/api/src/main.ts (أو apps/monitor/src/main.ts)
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { createBullBoard } from '@bull-board/api';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { ExpressAdapter } from '@bull-board/express';
import { Queue } from 'bullmq';
import { getQueueToken } from '@nestjs/bullmq';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // إعداد BullMQ Dashboard
  const serverAdapter = new ExpressAdapter();
  serverAdapter.setBasePath('/admin/queues'); // المسار الذي ستكون لوحة التحكم متاحة عليه

  // الحصول على قوائم الانتظار المسجلة
  const emailQueue = app.get<Queue>(getQueueToken('emailQueue'));
  const productSyncQueue = app.get<Queue>(getQueueToken('productSyncQueue'));
  const aiProcessingQueue = app.get<Queue>(getQueueToken('aiProcessingQueue'));

  createBullBoard({
    queues: [
      new BullMQAdapter(emailQueue),
      new BullMQAdapter(productSyncQueue),
      new BullMQAdapter(aiProcessingQueue),
    ],
    serverAdapter: serverAdapter,
  });

  // ربط لوحة التحكم بمسار في التطبيق
  app.use('/admin/queues', serverAdapter.getRouter());

  await app.listen(configService.get<number>('PORT') || 3000);
}
bootstrap();
الوصول إلى لوحة التحكم: بعد تشغيل التطبيق، يمكن الوصول إليها عبر http://localhost:3000/admin/queues.
4. تحقيق الأهداف والتحقق (Achieving Objectives & Verification)
4.1. معالجة المهام (Job Processing):

الخطة التنفيذية:
بدء تشغيل apps/api و apps/worker وخدمة redis في Docker Compose.
إرسال 10,000 مهمة بريد إلكتروني من الـ API (مثلاً، عبر endpoint مخصص لذلك في EmailController يستدعي EmailService.sendEmail في حلقة).
الهدف والمتوقع: الـ API تستجيب على الفور (HTTP 202 Accepted)، وخدمة الـ worker تقوم بمعالجة جميع المهام بنجاح خلال وقت محدد (مثال: 5 دقائق) دون حظر الـ Event Loop لـ API.
التحقق:
استجابة الـ API: التأكد من أن الـ API ترد بسرعة (أقل من 100ms) مع 202 Accepted أو ما شابه.
سجلات Worker: مراقبة سجلات apps/worker للتأكد من أن المهام يتم التقاطها ومعالجتها.
BullMQ Dashboard: التحقق من لوحة التحكم لمراقبة تقدم المهام في emailQueue (عدد المهام النشطة، المكتملة، المعلقة). يجب أن ترى عدد المهام المكتملة يزداد تدريجياً.
مراقبة Event Loop: استخدام أدوات مثل pm2 أو Node.js diagnostics لمراقبة Event Loop لـ apps/api والتأكد من عدم وجود حظر.
4.2. تتبع الأخطاء (Error Tracking):

الخطة التنفيذية:
إرسال مهمة بريد إلكتروني إلى عنوان مصمم للفشل (مثلاً fail@example.com كما هو محدد في EmailProcessor).
الهدف والمتوقع: المهمة تنتقل إلى failed حالة في BullMQ Dashboard بعد عدد محدد من المحاولات (3 محاولات في هذا المثال).
التحقق:
مراقبة سجلات apps/worker لرؤية رسائل إعادة المحاولة والفشل.
التحقق من BullMQ Dashboard، يجب أن تظهر المهمة في قسم Failed لـ emailQueue، مع تفاصيل الخطأ وعدد المحاولات. يمكن النقر على المهمة لرؤية سجل الأخطاء.
4.3. أداء Worker (Worker Performance):

الخطة التنفيذية:
تشغيل apps/worker تحت حمل معالجة المهام (مثل 10,000 مهمة).
استخدام أدوات مراقبة النظام (مثل htop، docker stats، أو أدوات مراقبة السحابة) لمراقبة استهلاك CPU و Memory لعملية apps/worker.
الهدف والمتوقع: مراقبة CPU و Memory لخدمة worker تظهر استهلاكًا مستقرًا للموارد، دون ارتفاعات حادة أو تسرب للذاكرة (memory leaks).
التحقق:
تحليل الرسوم البيانية لاستهلاك الموارد. يجب أن يكون الاستهلاك متناسبًا مع حجم العمل، ولكن مستقرًا على المدى الطويل. يجب أن تظل الذاكرة مستقرة ولا تستمر في الزيادة.
4.4. توثيق المهام (Job Documentation):

الخطة التنفيذية:
إنشاء ملف docs/jobs.md في جذر الـ Monorepo.
توثيق كل نوع من المهام (مثلاً emailQueue:sendEmail, productSyncQueue:syncProduct, aiProcessingQueue:processImage).
لكل مهمة، توثيق:
الاسم: (مثلاً sendEmail)
قائمة الانتظار: (مثلاً emailQueue)
Payload: (مثلاً { to: string; subject: string; body: string; })
الخيارات: (مثلاً attempts: 3, backoff: { type: 'exponential', delay: 1000 })
الغرض: وصف موجز للمهمة.
المعالجات: الإشارة إلى المعالج المسؤول عن هذه المهمة.
الهدف والمتوقع: توثيق جميع أنواع المهام، payloads، وخيارات إعادة المحاولة في docs/jobs.md بشكل واضح ومفصل.
التحقق:
مراجعة ملف docs/jobs.md للتأكد من شموله ودقته ووضوحه.
5. ملخص وفوائد (Summary and Benefits)
بتطبيق Arch-Core-07 Async Job Queue (BullMQ) 🚀، سيتم تحقيق ما يلي:

تحسين أداء الـ API: الـ API تستجيب بسرعة أكبر عن طريق تفريغ المهام الطويلة إلى الخلفية.
قابلية التوسع: يمكن توسيع نطاق الـ Workers بشكل مستقل عن الـ API لمعالجة أحمال العمل المتزايدة.
الموثوقية: التعامل مع الفشل المؤقت وإعادة محاولة المهام، مع آلية لمراجعة المهام الفاشلة بشكل دائم.
فصل الاهتمامات: هيكل منظم يفصل بين توليد المهام ومعالجتها.
مراقبة شاملة: لوحة تحكم BullMQ توفر رؤية واضحة لحالة جميع المهام وقوائم الانتظار.
تجربة مستخدم أفضل: تقليل أوقات الانتظار وزيادة استجابة التطبيق.
هذه الخطة توفر تفاصيل شاملة لهيكل وتنفيذ نظام قائمة انتظار مهام قوي وفعال باستخدام BullMQ و Redis.