مقدمة:
تُعد معالجة الأخطاء جزءًا حيويًا من بناء تطبيقات الويب القوية والموثوقة. يهدف هذا التصميم إلى توفير آلية مركزية وشاملة للتعامل مع جميع الاستثناءات (Exceptions) التي قد تحدث في تطبيق NestJS. يضمن هذا النهج استجابات موحدة وواضحة للعملاء، ويحمي التفاصيل الداخلية للنظام، ويوفر مراقبة فعالة للأخطاء في بيئات الإنتاج من خلال التكامل مع أدوات مثل GlitchTip/Sentry.

1. مفهوم مُصفّي الاستثناءات الشامل وسياق الأخطاء (Global Exception Filter & Error Context Concepts)
Global Exception Filter (مُصفّي الاستثناءات الشامل):

هو مكون برمجي في NestJS (أو أي إطار عمل آخر) مصمم لاعتراض جميع الاستثناءات غير المعالجة (unhandled exceptions) التي تحدث في التطبيق.
بدلاً من السماح لهذه الاستثناءات بإيقاف التطبيق أو إرجاع استجابات غير متناسقة، يقوم المُصفّي بالتقاطها ومعالجتها بطريقة موحدة.
يُطبق عالميًا لضمان تغطية جميع نقاط النهاية (endpoints) في التطبيق.
Operational Errors (أخطاء تشغيلية - 4xx):

هي أخطاء متوقعة ومنطقية، تنشأ عادةً بسبب إدخال غير صالح من العميل، طلب لمورد غير موجود، أو عدم وجود صلاحيات.
يمكن للعميل معالجتها أو تصحيحها (مثل BadRequestException, NotFoundException, ForbiddenException).
الهدف هو إرجاع رسالة خطأ واضحة ومحددة تساعد العميل على فهم المشكلة وتصحيحها.
System Errors (أخطاء نظام - 5xx):

هي أخطاء غير متوقعة، تشير عادةً إلى مشكلات داخلية في الخادم لا يستطيع العميل إصلاحها.
أمثلة: فشل في قاعدة البيانات، خطأ في التكامل مع خدمة خارجية، أخطاء برمجية غير متوقعة.
الهدف هو إخفاء التفاصيل الداخلية الحساسة عن العميل وإرجاع رسالة عامة (مثل "Internal Server Error") مع تسجيل الخطأ داخليًا للمطورين.
Stack Traces (تتبع مكدس الأخطاء):

سلسلة من استدعاءات الدوال التي توضح المسار الذي أدى إلى حدوث الخطأ.
مفيدة جدًا للمطورين لتحديد موقع المشكلة.
خطيرة في بيئة الإنتاج إذا تم عرضها للعميل، لأنها قد تكشف عن معلومات حساسة حول بنية التطبيق أو مسارات الملفات.
Error Monitoring (مراقبة الأخطاء):

العملية المنظمة لتتبع، جمع، وتحليل الأخطاء التي تحدث في التطبيق في الوقت الفعلي.
أدوات مثل GlitchTip (أو Sentry) تساعد في اكتشاف الأخطاء فور حدوثها، وتجميع معلومات السياق، وتنبيه فرق التطوير.
2. الأدوات المستخدمة (Tools Utilized)
GlitchTip 🚨 (Error Monitoring): نظام مفتوح المصدر لمراقبة الأخطاء، متوافق مع بروتوكول Sentry.
@nestjs/common (Exception Handling): مكتبة NestJS الأساسية التي توفر فئات للتعامل مع الاستثناءات (مثل HttpException) وواجهات لتطبيق مُصفّيات الاستثناءات (ExceptionFilter).
@sentry/node: حزمة SDK الرسمية لـ Sentry/GlitchTip لبيئة Node.js، تُستخدم لإرسال تقارير الأخطاء.
@nestjs/sentry (اختياري): حزمة تكامل لـ NestJS تسهل إعداد Sentry/GlitchTip.
3. استراتيجية التنفيذ والتكوين التفصيلي (Detailed Execution Strategy & Configuration)
3.1. تصميم وتنفيذ AllExceptionsFilter:
الغرض: التقاط جميع الاستثناءات، تصنيفها، وتنسيق الاستجابة بشكل موحد.
الخطة التنفيذية:
إنشاء الملف:
// packages/common/filters/all-exceptions.filter.ts
import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { Logger } from '@nestjs/common';
import * as Sentry from '@sentry/node'; // أو @nestjs/sentry

@Catch() // Catch all exceptions
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    let message: string;
    let errorDetails: any = {};

    if (exception instanceof HttpException) {
      const errorResponse = exception.getResponse();
      if (typeof errorResponse === 'string') {
        message = errorResponse;
      } else if (typeof errorResponse === 'object' && errorResponse !== null && 'message' in errorResponse) {
        message = (errorResponse as any).message;
        // إذا كان هناك تفاصيل أخرى في HttpException
        if ('error' in errorResponse) {
          errorDetails = { error: (errorResponse as any).error };
        }
        if ('statusCode' in errorResponse) { // لتجنب تكرار statusCode في رسالة الخطأ
            delete (errorResponse as any).statusCode;
        }
      } else {
        message = exception.message || 'An unexpected error occurred';
      }
    } else if (exception instanceof Error) {
      message = 'Internal Server Error'; // رسالة عامة لأخطاء 5xx غير المتوقعة
      // في بيئة الإنتاج، لا نرسل details.stack للعميل
      if (process.env.NODE_ENV !== 'production') {
         errorDetails = { stack: exception.stack };
      }
    } else {
      message = 'An unknown error occurred';
    }

    const errorResponse = {
      statusCode: status,
      message: Array.isArray(message) ? message.join(', ') : message,
      ...errorDetails,
      timestamp: new Date().toISOString(),
      path: request.url,
    };

    // الإبلاغ عن أخطاء 5xx إلى GlitchTip/Sentry
    if (status >= HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(`Unhandled error: ${exception}`, (exception instanceof Error ? exception.stack : 'No stack'), request.url);

      // إثراء تقارير الأخطاء
      Sentry.withScope((scope) => {
        scope.setTag('statusCode', status.toString());
        scope.setContext('request', {
          method: request.method,
          url: request.url,
          headers: request.headers,
          body: request.body,
          query: request.query,
          params: request.params,
        });

        // مثال لإضافة معرف المستخدم والمستأجر إذا كان متاحًا من سياق الطلب (مثلاً من Middleware)
        // scope.setUser({ id: (request as any).user?.id, username: (request as any).user?.username });
        // scope.setExtra('tenantId', (request as any).tenantId);
        // scope.setExtra('traceId', (request as any).traceId); // من OpenTelemetry

        Sentry.captureException(exception);
      });
    } else {
      this.logger.warn(`Client error: ${status} - ${message}`, request.url);
    }

    response.status(status).json(errorResponse);
  }
}
تطبيق المُصفّي عالميًا:
// apps/api/src/main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from '../packages/common/filters/all-exceptions.filter'; // تأكد من المسار الصحيح
import * as Sentry from '@sentry/node'; // تهيئة Sentry/GlitchTip

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // تهيئة Sentry/GlitchTip
  Sentry.init({
    dsn: process.env.SENTRY_DSN, // يجب تعيين هذا المتغير البيئي
    environment: process.env.NODE_ENV,
    release: process.env.APP_VERSION,
    // ... إعدادات أخرى مثل integrations
  });

  // تطبيق Global Exception Filter
  app.useGlobalFilters(new AllExceptionsFilter());

  // ... (باقي التكوين)
  await app.listen(3000);
}
bootstrap();
3.2. تصنيف الأخطاء (Operational vs. System Errors):
الغرض: تقديم استجابات مختلفة للعميل بناءً على نوع الخطأ.
الخطة التنفيذية:
أخطاء 4xx (Operational):
سيقوم AllExceptionsFilter بالتقاط HttpException (أو مشتقاتها مثل BadRequestException, NotFoundException, UnauthorizedException).
سيتم استخراج statusCode و message الأصليين من الـ HttpException وإرجاعهما مباشرة للعميل.
مثال: throw new NotFoundException("User with ID X not found."); سيؤدي إلى استجابة {"statusCode": 404, "message": "User with ID X not found.", ...}.
أخطاء 5xx (System):
عند حدوث أي خطأ غير HttpException (مثل خطأ قاعدة بيانات، TypeError, ReferenceError)، سيقوم المُصفّي بتعيين statusCode إلى 500 وتغيير message إلى "Internal Server Error" أو ما شابه ذلك.
مثال: عند حدوث new Error("DB connection failed")، ستكون الاستجابة {"statusCode": 500, "message": "Internal Server Error", ...}.
3.3. الإبلاغ عن الأخطاء (GlitchTip/Sentry Integration):
الغرض: إرسال تقارير مفصلة عن أخطاء 5xx إلى GlitchTip للمراقبة والتحليل.
الخطة التنفيذية:
دمج @sentry/node: تم تضمينه في main.ts لتهيئة Sentry/GlitchTip وفي AllExceptionsFilter لالتقاط الاستثناءات.
إثراء تقارير الأخطاء: داخل AllExceptionsFilter، يتم استخدام Sentry.withScope لإضافة بيانات سياقية قيمة إلى تقرير الخطأ قبل إرساله.
scope.setTag('statusCode', status.toString());
scope.setContext('request', { ... }); لتضمين تفاصيل الطلب (method, URL, headers, body).
إضافة معرف المستخدم (user ID)، معرف المستأجر (tenant ID)، ومعرف التتبع (trace ID) إذا كانت متاحة من كائن الطلب (request object)، والتي يمكن حقنها بواسطة Middleware أو Interceptors أخرى.
3.4. منع تسرب Stack Traces:
الغرض: حماية التفاصيل الداخلية للنظام في بيئة الإنتاج.
الخطة التنفيذية:
داخل AllExceptionsFilter، يتم فحص process.env.NODE_ENV.
إذا كانت البيئة production، فلن يتم تضمين خاصية stack من كائن الخطأ في استجابة JSON المرسلة إلى العميل.
سيظل stack trace متاحًا في سجلات الخادم وفي تقرير GlitchTip.
4. تحقيق الأهداف والتحقق (Achieving Objectives & Verification)
4.1. استجابات خطأ موحدة (Unified Error Responses):
الخطة التنفيذية:
إجراء طلبات API متعمدة تؤدي إلى أخطاء 4xx (مثلاً، طلب مورد غير موجود GET /non-existent-resource).
إجراء طلبات API متعمدة تؤدي إلى أخطاء 5xx (مثلاً، endpoint يقوم throw new Error('Simulated DB failure');).
الهدف والمتوقع: جميع الاستجابات يجب أن تتبع التنسيق JSON الموحد: {"statusCode": number, "message": string, "error"?: string, "timestamp": string, "path": string}.
التحقق:
استخدام أداة مثل Postman أو Insomnia لإرسال الطلبات.
فحص بنية استجابات الخطأ والتأكد من تطابقها مع التنسيق المحدد.
4.2. إخفاء Stack Traces في بيئة الإنتاج (Hiding Stack Traces in Production):
الخطة التنفيذية:
ضبط NODE_ENV=production وتشغيل التطبيق.
إرسال طلب API يؤدي إلى خطأ 5xx (مثل throw new Error('Critical failure');).
الهدف والمتوقع: استجابة الخطأ 5xx للعميل يجب ألا تحتوي على تفاصيل stack trace.
التحقق:
فحص استجابة JSON من الـ API، والتأكد من عدم وجود حقل stack.
التأكد من أن سجلات الخادم وتقارير GlitchTip تحتوي على stack trace كامل.
4.3. إبلاغ فعال عن الأخطاء إلى GlitchTip (Effective GlitchTip Reporting):
الخطة التنفيذية:
ضبط SENTRY_DSN بشكل صحيح في المتغيرات البيئية.
إرسال طلب API يؤدي إلى خطأ 5xx (مثلاً: throw new Error("DB Connection Lost")).
الهدف والمتوقع: ظهور تقرير مفصل للخطأ في واجهة GlitchTip خلال 30 ثانية (يعتمد على سرعة الشبكة وإعدادات Sentry/GlitchTip). يجب أن يحتوي التقرير على جميع بيانات السياق المطلوبة (trace ID, user ID, request URL, payload).
التحقق:
فتح لوحة تحكم GlitchTip/Sentry.
التأكد من ظهور الحدث الجديد للخطأ.
فحص تفاصيل الحدث للتأكد من وجود statusCode, request context, و stack trace، وأي بيانات سياقية أخرى (user ID, tenant ID, trace ID) تم إثراؤها.
4.4. تكوين GlitchTip موثق (Documented GlitchTip Configuration):
الخطة التنفيذية:
إنشاء ملف sentry.config.ts (أو توثيق الإعدادات مباشرة في main.ts إذا كانت بسيطة).
الهدف والمتوقع: وجود ملف تكوين (أو قسم تكوين) واضح يحدد DSN، environment، release، وأي integrations أو options أخرى لـ Sentry/GlitchTip.
التحقق:
مراجعة الملف أو الكود للتأكد من اكتمال التوثيق ووضوحه.
5. ملخص وفوائد (Summary and Benefits)
بتطبيق Arch-S5 Global Exception Filter 🛡️، سيتم تحقيق ما يلي:

استقرار محسن: منع الاستثناءات غير المعالجة من تعطيل التطبيق وتقديم تجربة مستخدم أكثر سلاسة.
تجربة عميل أفضل: استجابات أخطاء واضحة وموحدة تساعد العملاء (وخاصة تطبيقات الواجهة الأمامية) على فهم الأخطاء والتعامل معها بشكل فعال.
أمان معزز: حماية التفاصيل الداخلية الحساسة للنظام (مثل Stack Traces) من الكشف عنها للعملاء في بيئات الإنتاج.
قابلية صيانة محسنة: فصل منطق معالجة الأخطاء عن منطق العمل الأساسي، مما يجعل الكود أنظف وأسهل في الصيانة.
رؤية شاملة للأخطاء: من خلال التكامل مع GlitchTip/Sentry، يمكن لفرق التطوير اكتشاف الأخطاء وتصحيحها بسرعة، مما يقلل من وقت التوقف عن العمل (downtime).
بيانات غنية لتحليل الأخطاء: إثراء تقارير الأخطاء ببيانات سياقية مهمة يسهل عملية تصحيح الأخطاء وتحديد الأسباب الجذرية للمشكلات.
هذه الخطة توفر تفاصيل شاملة لهيكل وتنفيذ نظام شامل لمعالجة الاستثناءات في تطبيقات NestJS.