مقدمة:
تُعد خدمة تحديد المعدل (Rate Limiting) آلية أساسية لحماية تطبيقات الويب من الإفراط في الاستخدام، الهجمات، وضمان توافر الموارد. تهدف هذه النقطة إلى تنفيذ نظام فعال لتحديد المعدل في NestJS، باستخدام Redis لتخزين البيانات، وتوفير قدرة على التحديد الديناميكي للمعدل بناءً على خطط العملاء (Tenants)، بالإضافة إلى ميزة حظر عناوين IP المسيئة مؤقتًا.

1. مفهوم خدمة تحديد المعدل وسياق الطلب (Rate Limiting Service & Request Context Concepts)
Rate Limiting (تحديد المعدل):

هي تقنية تُستخدم للتحكم في عدد الطلبات التي يمكن للعميل أو عنوان IP واحد إجراؤها إلى خدمة معينة خلال فترة زمنية محددة.
الهدف الرئيسي هو منع الاستخدام المفرط للموارد، حماية الخادم من هجمات Denial of Service (DoS/DDoS)، وضمان العدالة في الوصول للمستخدمين المختلفين.
عند تجاوز الحد الأقصى، يتم رفض الطلبات الإضافية عادةً مع رمز الحالة 429 Too Many Requests.
Throttling (التخنيق):

مصطلح يُستخدم بالتبادل مع Rate Limiting، لكن أحيانًا يشير إلى تقليل سرعة الطلبات بدلاً من حظرها تمامًا. في سياق NestJS Throttler، يشير إلى Rate Limiting.
Redis Store:

Redis هو مخزن بيانات مفتاح-قيمة في الذاكرة، ويُستخدم غالبًا كـ Cache أو وسيط رسائل.
مثالي لتخزين بيانات تحديد المعدل نظرًا لسرعته العالية وقدرته على التعامل مع عمليات الزيادة/النقصان الذرية (atomic increments/decrements) وتنفيذ عمليات TTL (Time To Live).
Dynamic Rate Limiting (تحديد المعدل الديناميكي):

القدرة على تطبيق حدود مختلفة لتحديد المعدل بناءً على سمات معينة للطلب أو العميل، مثل: هوية المستخدم، مستوى الاشتراك (خطة Tenant)، أو مفتاح API.
يتيح هذا النهج تخصيص الموارد بناءً على الأهمية أو القيمة التي يقدمها العميل.
IP Blocking (حظر IP):

إجراء أمني يتم فيه منع الوصول من عنوان IP معين لفترة زمنية محددة أو بشكل دائم.
يُستخدم غالبًا كإجراء ردع بعد تجاوز حدود تحديد المعدل بشكل متكرر أو عند اكتشاف سلوك ضار.
2. الأدوات المستخدمة (Tools Utilized)
Redis 🚀 (Caching & Storage): مخزن البيانات الأساسي لتخزين عدادات تحديد المعدل ومعلومات حظر IP.
@nestjs/throttler: حزمة NestJS توفر أدوات قوية وسهلة الاستخدام لتطبيق تحديد المعدل.
@nestjs/common: مكتبة NestJS الأساسية التي توفر واجهات Guards و Decorators.
ioredis: عميل Redis لـ Node.js، يستخدمه RedisThrottlerStorage.
@apex/config: حزمة الإعدادات المشتركة في Monorepo (لاسترداد إعدادات Redis).
Arch-Core-02 (Redis Instance): إشارة إلى توفر وتكوين مثيل Redis.
3. استراتيجية التنفيذ والتكوين التفصيلي (Detailed Execution Strategy & Configuration)
3.1. دمج @nestjs/throttler وتكوين Redis Store
الغرض: تثبيت الحزمة وإعدادها لاستخدام Redis كمخزن لبيانات تحديد المعدل.
الخطة التنفيذية:
التثبيت:
bun add @nestjs/throttler ioredis
bun add -D @types/ioredis
تكوين ThrottlerModule في AppModule (apps/api/src/app.module.ts):
// apps/api/src/app.module.ts
import { Module } from '@nestjs/common';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { RedisThrottlerStorage } from '@nestjs/throttler-storage-redis';
import { ConfigService } from '@nestjs/config'; // لاسترداد إعدادات Redis من @apex/config
import { APP_GUARD } from '@nestjs/core';
import { Redis } from 'ioredis'; // عميل Redis

// ... (باقي الوحدات والخدمات)

@Module({
  imports: [
    // ... وحدات أخرى
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const redisConfig = configService.get('redis'); // استرداد إعدادات Redis من @apex/config

        // إنشاء عميل Redis واحد مشترك
        const redisClient = new Redis({
          host: redisConfig.host,
          port: redisConfig.port,
          password: redisConfig.password,
          // ... إعدادات Redis أخرى
        });

        return {
          ttl: 60, // افتراضي: 60 ثانية
          limit: 100, // افتراضي: 100 طلب
          storage: new RedisThrottlerStorage(redisClient),
          // skipIf: (context: ExecutionContext) => true, // يمكن تخطي بعض الطلبات هنا
        };
      },
    }),
  ],
  providers: [
    // ... خدمات أخرى
    {
      provide: APP_GUARD, // تطبيق ThrottlerGuard عالميًا
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
3.2. تحديد المعدل الديناميكي باستخدام TenantRateLimitGuard
الغرض: تطبيق حدود مختلفة لتحديد المعدل بناءً على خطة Tenant (Free, Pro, Enterprise).
الخطة التنفيذية:
إنشاء TenantRateLimitGuard (packages/common/guards/tenant-rate-limit.guard.ts):
// packages/common/guards/tenant-rate-limit.guard.ts
import { Injectable, ExecutionContext, Logger } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { Request } from 'express';
import { ConfigService } from '@nestjs/config'; // لتجربة جلب config

// تعريف واجهة Tenant (يفترض أن يتم حقنها في request.user)
interface UserWithTenant {
  id: string;
  email: string;
  tenant: {
    id: string;
    plan: 'free' | 'pro' | 'enterprise'; // خطة Tenant
  };
}

@Injectable()
export class TenantRateLimitGuard extends ThrottlerGuard {
  private readonly logger = new Logger(TenantRateLimitGuard.name);
  private readonly rateLimits = {
    free: { ttl: 60, limit: 100 },
    pro: { ttl: 60, limit: 1000 },
    enterprise: { ttl: 60, limit: 5000 },
  };

  constructor(private readonly configService: ConfigService) {
    super(); // استدعاء constructor الأساسي لـ ThrottlerGuard
  }

  protected getTracker(req: Request): string {
    // يمكن تتبع الطلبات بناءً على معرف المستخدم ومعرف المستأجر
    // أو فقط معرف المستأجر، أو حتى عنوان IP
    const user = (req as any).user as UserWithTenant;
    if (user?.tenant?.id) {
      return user.tenant.id; // تتبع حسب معرف المستأجر
    }
    return req.ip; // إذا لم يكن هناك معرف مستأجر، استخدم IP
  }

  protected async getThrottlerOptions(context: ExecutionContext): Promise<{ ttl: number; limit: number }[]> {
    const request = context.switchToHttp().getRequest<Request>();
    const user = (request as any).user as UserWithTenant;

    const tenantPlan = user?.tenant?.plan || 'free'; // الخطة الافتراضية إذا لم يتم العثور عليها

    const options = this.rateLimits[tenantPlan] || this.rateLimits.free;
    this.logger.debug(`Applying rate limit for tenant plan '${tenantPlan}': ${options.limit} requests per ${options.ttl}s`);

    // يمكن أيضًا جلب هذه الإعدادات من قاعدة بيانات أو خدمة
    // return [{ ttl: options.ttl, limit: options.limit }];

    // يمكن إضافة خيارات إضافية إذا كان هناك throttlerGuard آخر يطبق حدودًا مختلفة
    return [{ ttl: options.ttl, limit: options.limit }];
  }

  // Override handleRequest إذا أردنا معالجة IP Banning هنا
  async handleRequest(context: ExecutionContext, limit: number, ttl: number): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const ip = request.ip;

    // **********************************************
    // خطوة إضافية: التحقق من حظر IP قبل تطبيق Rate Limit
    // (سيتم تفصيلها في الجزء 3.3 IP Banning)
    // هذا الجزء يفترض أن لدينا خدمة أو طريقة للتحقق من الحظر
    // **********************************************
    const redisClient = (this.storage as any).storage; // الوصول لعميل Redis من المخزن
    const isBanned = await redisClient.get(`ip:banned:${ip}`);
    if (isBanned) {
      this.logger.warn(`Banned IP ${ip} attempted access. Returning 403 Forbidden.`);
      throw new ForbiddenException(`Your IP address ${ip} has been temporarily blocked due to suspicious activity.`);
    }

    return super.handleRequest(context, limit, ttl);
  }
}
تطبيق TenantRateLimitGuard عالميًا في AppModule:
// apps/api/src/app.module.ts (تعديل)
// ... (الاستيرادات)
import { TenantRateLimitGuard } from './packages/common/guards/tenant-rate-limit.guard'; // تأكد من المسار
// ...
@Module({
  // ...
  providers: [
    // ...
    {
      provide: APP_GUARD, // استبدال ThrottlerGuard الافتراضي بـ TenantRateLimitGuard
      useClass: TenantRateLimitGuard,
    },
  ],
})
export class AppModule {}
3.3. حظر IP مؤقت (IP Blocking)
الغرض: حظر عنوان IP مؤقتًا بعد عدد معين من انتهاكات تحديد المعدل.
الخطة التنفيذية:
توسيع RedisThrottlerStorage لتعقب الانتهاكات:
سنقوم بتخصيص RedisThrottlerStorage ليكون لديه القدرة على تتبع "انتهاكات" IP.
عندما يتجاوز العميل الحد، سيزيد المخزن عداد "الانتهاكات" الخاص بالـ IP.
إذا وصل هذا العداد إلى حد معين خلال فترة زمنية (مثلاً 5 انتهاكات في 30 ثانية)، فسيقوم بوضع IP في قائمة الحظر.
// packages/common/storage/ip-ban-throttler.storage.ts
import { RedisThrottlerStorage } from '@nestjs/throttler-storage-redis';
import { Redis } from 'ioredis';
import { ThrottlerStorageRecord } from '@nestjs/throttler/dist/throttler-storage-record.interface';
import { Logger } from '@nestjs/common';

export class IpBanThrottlerStorage extends RedisThrottlerStorage {
  private readonly logger = new Logger(IpBanThrottlerStorage.name);
  private readonly BAN_STRIKES_LIMIT = 5;
  private readonly BAN_STRIKES_WINDOW_SECONDS = 30; // 30 ثانية لتجميع الانتهاكات
  private readonly IP_BAN_DURATION_SECONDS = 5 * 60; // 5 دقائق حظر

  constructor(protected readonly redis: Redis) {
    super(redis);
  }

  async increment(key: string, ttl: number): Promise<ThrottlerStorageRecord> {
    const result = await super.increment(key, ttl);

    if (result.remaining <= 0) { // تم تجاوز الحد، هذا يعتبر انتهاكًا
      const ip = key.split(':')[0]; // نفترض أن المفتاح يبدأ بالـ IP

      // زيادة عداد الانتهاكات لـ IP
      const strikeKey = `ip:strikes:${ip}`;
      const currentStrikes = await this.redis.incr(strikeKey);
      await this.redis.expire(strikeKey, this.BAN_STRIKES_WINDOW_SECONDS); // نافذة زمنية للانتهاكات

      this.logger.warn(`Rate limit exceeded for IP: ${ip}. Strikes: ${currentStrikes}/${this.BAN_STRIKES_LIMIT}`);

      if (currentStrikes >= this.BAN_STRIKES_LIMIT) {
        // تجاوز عدد الانتهاكات، حظر IP
        await this.redis.set(`ip:banned:${ip}`, 'true', 'EX', this.IP_BAN_DURATION_SECONDS);
        this.logger.error(`IP ${ip} has been BANNED for ${this.IP_BAN_DURATION_SECONDS} seconds.`);
        // إعادة تعيين الـ strikes لمنع إعادة الحظر الفوري بعد انتهاء الحظر
        await this.redis.del(strikeKey);
      }
    }
    return result;
  }
}
استخدام IpBanThrottlerStorage في AppModule:
// apps/api/src/app.module.ts (تعديل)
// ... (الاستيرادات)
import { IpBanThrottlerStorage } from './packages/common/storage/ip-ban-throttler.storage'; // تأكد من المسار

@Module({
  imports: [
    // ...
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const redisConfig = configService.get('redis');
        const redisClient = new Redis({
          host: redisConfig.host, port: redisConfig.port, password: redisConfig.password,
        });
        return {
          ttl: 60,
          limit: 100,
          storage: new IpBanThrottlerStorage(redisClient), // استخدام المخزن المخصص للحظر
        };
      },
    }),
  ],
  // ...
})
export class AppModule {}
تعديل TenantRateLimitGuard للتحقق من الحظر (موضح في القسم 3.2):
الجزء المتعلق بـ isBanned في handleRequest داخل TenantRateLimitGuard هو المسؤول عن التحقق من مفتاح الحظر في Redis ورمي ForbiddenException (403) إذا كان IP محظورًا.
3.4. Headers في استجابات 429
الغرض: تزويد العملاء بمعلومات حول حدود تحديد المعدل.
الخطة التنفيذية:
حزمة @nestjs/throttler تضيف تلقائيًا Headers التالية إلى استجابات 429 Too Many Requests:
X-RateLimit-Limit: الحد الأقصى للطلبات المسموح بها في الفترة.
X-RateLimit-Remaining: عدد الطلبات المتبقية في الفترة الحالية.
X-RateLimit-Reset: الطابع الزمني (Unix timestamp) عندما ينتهي التحديد الحالي للمعدل ويعاد تعيينه.
التحقق: يتم التحقق من وجود هذه الـ Headers وقيمها في معايير القبول.
4. تحقيق الأهداف والتحقق (Achieving Objectives & Verification)
4.1. فرض الحدود (Enforcing Limits):
الخطة التنفيذية:
تشغيل التطبيق.
إنشاء مستأجر (Tenant) بخطة "Free" وتأكيد تسجيل الدخول.
تنفيذ اختبار تحميل سريع (باستخدام أدوات مثل ApacheBench أو k6 أو حتى curl في حلقة) لـ 101 طلب في أقل من دقيقة واحدة لنقطة نهاية محمية.
الهدف والمتوقع: عند الطلب رقم 101 (أو أي طلب بعد تجاوز الحد)، يجب أن يعود الطلب برمز الحالة 429 Too Many Requests.
التحقق: فحص استجابة الطلب رقم 101 وما يليه.
4.2. حظر IP (IP Blocking):
الخطة التنفيذية:
تنفيذ 5 طلبات أو أكثر تثير استجابات 429 Too Many Requests من نفس عنوان IP، وذلك خلال فترة 30 ثانية (نافذة تجميع الانتهاكات).
بعد ذلك، حاول إرسال طلبات إضافية من نفس IP.
الهدف والمتوقع: الطلبات اللاحقة من نفس IP بعد تفعيل الحظر يجب أن تعود برمز الحالة 403 Forbidden، وذلك لمدة 5 دقائق.
التحقق:
مراقبة استجابات الطلبات بعد تجاوز الحد للمرة الخامسة.
فحص سجلات التطبيق للتأكد من تسجيل حظر IP.
فحص Redis للتأكد من وجود مفتاح ip:banned:{your_ip_address}.
4.3. Headers صحيحة (Correct Headers):
الخطة التنفيذية:
إرسال طلبات تؤدي إلى استجابة 429 Too Many Requests (كما في اختبار فرض الحدود).
الهدف والمتوقع: استجابات 429 يجب أن تحتوي على الـ Headers التالية بقيم صحيحة:
X-RateLimit-Limit: قيمة حد الطلبات المسموح بها.
X-RateLimit-Remaining: 0 عند تجاوز الحد.
X-RateLimit-Reset: الطابع الزمني (Unix timestamp) لوقت انتهاء الفترة الحالية.
التحقق: استخدام أدوات المطور في المتصفح أو curl -v لفحص الـ Headers في استجابة 429.
4.4. تكوين موثق (Documented Configuration):
الخطة التنفيذية:
إنشاء ملف docs/security.md أو تحديثه.
الهدف والمتوقع: يحتوي الملف على توثيق واضح لتكوين ThrottlerModule و TenantRateLimitGuard، مع شرح للحدود المختلفة لكل خطة (Free, Pro, Enterprise) وكيفية عمل آلية حظر IP.
التحقق: مراجعة الملف للتأكد من اكتمال التوثيق ووضوحه.
5. ملخص وفوائد (Summary and Benefits)
بتطبيق Arch-S6 Rate Limiting Service 🚀🛡️، سيتم تحقيق ما يلي:

حماية محسنة من هجمات DoS/DDoS: تقييد عدد الطلبات يمنع الاستخدام المفرط للموارد ويحمي الخدمة من التعطل.
ضمان العدالة في استخدام الموارد: يضمن حصول كل عميل على حصته من موارد الخادم، مع إعطاء الأولوية للعملاء ذوي الخطط المدفوعة.
تخصيص مرن: القدرة على تحديد المعدل ديناميكيًا بناءً على خطة Tenant تسمح بتطبيق سياسات عمل مختلفة بسهولة.
ردع السلوك المسيء: حظر عناوين IP مؤقتًا يقلل من الاستخدام الضار والمتكرر للنظام.
استجابات واضحة للعميل: توفير الـ Headers المناسبة في استجابات 429 يساعد العملاء على فهم متى يمكنهم إعادة المحاولة.
كفاءة الأداء: استخدام Redis يضمن أن تكون عملية تحديد المعدل سريعة وفعالة، مما لا يؤثر سلبًا على أداء التطبيق.
هذه الخطة توفر تفاصيل شاملة لهيكل وتنفيذ خدمة قوية وفعالة لتحديد المعدل وحظر IP في تطبيقات NestJS.