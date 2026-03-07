Arch-Core-03 Environment Verification ⚡
مقدمة:
يعد التحقق من متغيرات البيئة خطوة حاسمة في تطوير ونشر التطبيقات، خاصة في بيئات الميكروسيرفيس والـ Monorepo. يهدف مشروع Arch-Core-03 إلى بناء نظام قوي للتحقق من صحة متغيرات البيئة باستخدام Zod، مدمجًا بشكل سلس مع تطبيقات NestJS. هذا يضمن أن التطبيقات لا تبدأ إلا إذا كانت جميع متغيرات البيئة المطلوبة والمنسقة بشكل صحيح موجودة، مما يمنع الأخطاء غير المتوقعة في وقت التشغيل ويحسن استقرار النظام.

1. هيكل ومكونات (Structure and Components)
1.1. حزمة @apex/config:

الموقع: سيتم إنشاء حزمة npm جديدة داخل مجلد packages/config في الـ Monorepo. هذا يتيح مشاركة تعريفات متغيرات البيئة (Zod Schemas) بسهولة عبر جميع التطبيقات (NestJS APIs، Workers، إلخ) داخل Monorepo.
الغرض: ستكون هذه الحزمة هي المصدر الوحيد للحقيقة (Single Source of Truth) لجميع تكوينات البيئة. ستحتوي بشكل أساسي على ملفات Zod Schemas لتعريف البنية المتوقعة لمتغيرات البيئة.
1.2. Zod (Schema Validation):
Zod هي مكتبة لإنشاء Schemas (مخططات) قوية وموثوقة للتحقق من صحة البيانات (validation) والاستدلال على أنواع TypeScript (type inference). ستستخدم لتحديد أنواع البيانات، الأنماط، الأطوال، والقيم الافتراضية لمتغيرات البيئة.

1.3. @nestjs/config (NestJS Config Module):
هذه المكتبة هي الموصل بين بيئة NestJS ومتغيرات البيئة. ستستخدم لتحميل متغيرات البيئة (عادةً من ملف .env) وتوفيرها للتطبيق. سيتم دمجها مع Zod للتحقق من صحة هذه المتغيرات.

2. استراتيجية التهيئة والتكوين (Initialization and Configuration Strategy)
2.1. إنشاء حزمة @apex/config:

الخطوة 1: إنشاء مجلد الحزمة:
mkdir packages/config
cd packages/config
الخطوة 2: تهيئة package.json للحزمة:
bun init
(تأكد من أن اسم الحزمة هو @apex/config).
الخطوة 3: تثبيت Zod:
bun add zod
الخطوة 4: تكوين TypeScript (tsconfig.json):
إنشاء ملف tsconfig.json مناسب للحزمة لتمكين بناء TypeScript.
// packages/config/tsconfig.json
{
  "extends": "../../tsconfig.json", // يمكن أن يرث من tsconfig الجذر
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src",
    "lib": ["es2020"],
    "module": "commonjs"
  },
  "include": ["src"],
  "exclude": ["node_modules", "dist"]
}
الخطوة 5: إضافة سكربتات بناء:
في packages/config/package.json:
{
  "name": "@apex/config",
  // ...
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "scripts": {
    "build": "bun tsc",
    "dev": "bun tsc -w"
  },
  "devDependencies": {
    "zod": "^3.x.x" // تأكد من الإصدار
  }
}
2.2. تعريف Zod Schemas في @apex/config:
سنقوم بإنشاء ملفات داخل packages/config/src لتعريف Schemas المختلفة.

مثال على DatabaseConfigSchema (packages/config/src/database.schema.ts):

import { z } from 'zod';

export const DatabaseConfigSchema = z.object({
  DATABASE_URL: z.string().url({ message: "Invalid DATABASE_URL format. Must be a valid URL." }),
  DATABASE_HOST: z.string().min(1, { message: "DATABASE_HOST cannot be empty." }),
  DATABASE_PORT: z.preprocess(
    (val) => Number(val),
    z.number().int().min(1).max(65535, { message: "DATABASE_PORT must be between 1 and 65535." })
  ),
  DATABASE_USER: z.string().min(1, { message: "DATABASE_USER cannot be empty." }),
  DATABASE_PASSWORD: z.string().min(1, { message: "DATABASE_PASSWORD cannot be empty." }),
  DATABASE_NAME: z.string().min(1, { message: "DATABASE_NAME cannot be empty." }),
});

export type DatabaseConfig = z.infer<typeof DatabaseConfigSchema>;
مثال على AuthConfigSchema (packages/config/src/auth.schema.ts):

import { z } from 'zod';

export const AuthConfigSchema = z.object({
  JWT_SECRET: z.string().length(32, { message: "JWT_SECRET must be exactly 32 characters long." }),
  JWT_EXPIRATION_TIME: z.string().regex(/^\d+[smhd]$/, { message: "JWT_EXPIRATION_TIME must be a string like '1h' or '30m'." }),
  AUTH_STRATEGY: z.enum(['jwt', 'oauth', 'api_key']).default('jwt'), // التعامل مع القيم الافتراضية
});

export type AuthConfig = z.infer<typeof AuthConfigSchema>;
مثال على AppConfigSchema (packages/config/src/app.schema.ts):

import { z } from 'zod';

export const AppConfigSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.preprocess(
    (val) => Number(val),
    z.number().int().min(1024).max(65535).default(3000), // قيمة افتراضية
  ),
  API_PREFIX: z.string().startsWith('/').optional(), // متغير اختياري
});

export type AppConfig = z.infer<typeof AppConfigSchema>;
الـ Schema الرئيسي المدمج (packages/config/src/index.ts):
سيتم دمج جميع الـ Schemas الفرعية في Schema واحد رئيسي:

import { z } from 'zod';
import { AppConfigSchema } from './app.schema';
import { DatabaseConfigSchema } from './database.schema';
import { AuthConfigSchema } from './auth.schema';

// دمج جميع الـ Schemas
export const EnvironmentSchema = z.object({
  ...AppConfigSchema.shape,
  ...DatabaseConfigSchema.shape,
  ...AuthConfigSchema.shape,
  // أي متغيرات بيئة عامة أخرى
});

// استخدام z.infer للحصول على النوع المدمج لمتغيرات البيئة
export type EnvironmentVariables = z.infer<typeof EnvironmentSchema>;
2.3. دمج NestJS (main.ts):

الخطوة 1: تثبيت التبعيات في تطبيق NestJS:
cd apps/my-nest-app # أو أي تطبيق NestJS
bun add @nestjs/config @apex/config
bun add -D @types/node # لـ process.env
الخطوة 2: تعديل main.ts لتطبيق NestJS:
// apps/my-nest-app/src/main.ts
import { NestFactory } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { AppModule } from './app.module';
import { EnvironmentSchema } from '@apex/config'; // استيراد الـ Schema الرئيسي

async function bootstrap() {
  // تحميل متغيرات البيئة والتحقق منها
  ConfigModule.forRoot({
    isGlobal: true, // لجعل ConfigModule متاحًا في جميع أنحاء التطبيق
    // استخدام دالة validate لتحقق Zod
    validate: (config: Record<string, unknown>) => {
      try {
        // التحقق من صحة متغيرات البيئة باستخدام EnvironmentSchema
        // `strict()` يضمن عدم وجود متغيرات بيئة غير معرفة في الـ Schema
        // `parse()` تلقي خطأ إذا فشل التحقق
        const parsedConfig = EnvironmentSchema.parse(config);
        console.log('Environment variables validated successfully.');
        return parsedConfig; // إرجاع الكائن المحقق
      } catch (error) {
        // الخطوة 4: إطلاق خطأ واضح
        console.error('======================================================================');
        console.error('❌ Invalid environment variables configuration:');
        if (error instanceof Error) {
            console.error(error.message);
            // لإظهار تفاصيل أخطاء Zod بشكل أكثر وضوحًا
            if ('issues' in error && Array.isArray(error.issues)) {
                error.issues.forEach((issue: any) => {
                    console.error(`- Field: ${issue.path.join('.')}, Message: ${issue.message}, Received: ${config[issue.path.join('.')]}`);
                });
            }
        } else {
            console.error(JSON.stringify(error, null, 2));
        }
        console.error('======================================================================');
        process.exit(1); // إيقاف التطبيق على الفور
      }
    },
    envFilePath: '.env', // تحديد مسار ملف .env
  });

  const app = await NestFactory.create(AppModule);
  // ... تكوين تطبيق NestJS الآخر ...
  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT');
  await app.listen(port);
  console.log(`Application is running on: ${await app.getUrl()}`);
}
bootstrap();
2.4. خطأ واضح (Clear Error Handling):
كما هو موضح في main.ts أعلاه:

إذا فشل EnvironmentSchema.parse(config)، فإنه سيطلق استثناء (throw an error).
سيتم التقاط هذا الاستثناء في catch block داخل دالة validate.
سيتم طباعة رسالة خطأ مفصلة وواضحة إلى وحدة التحكم (console) تشرح المتغيرات غير الصالحة والسبب، ثم يتم إنهاء عملية التطبيق باستخدام process.exit(1). هذا يضمن أن التطبيق لا يبدأ في حالة التكوين غير الصحيح.
2.5. ملف .env.example:

الغرض: يوفر هذا الملف قالبًا لمتغيرات البيئة المطلوبة، مع قيم افتراضية أو أمثلة لمساعدة المطورين الجدد على إعداد بيئتهم المحلية.
الإنشاء: يمكن إنشاء هذا الملف يدويًا بناءً على تعريفات Zod Schemas. من الممكن أيضًا كتابة سكربت بسيط (في الـ Monorepo، مثلاً في tools/generate-env-example.ts) يقوم بتحليل EnvironmentSchema وتوليد ملف .env.example تلقائيًا.
المحتوى (مثال):
# .env.example
# --- App Configuration ---
NODE_ENV=development
PORT=3000
# API_PREFIX=/api # Optional

# --- Database Configuration ---
DATABASE_URL=postgresql://user:password@localhost:5432/mydb
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=user
DATABASE_PASSWORD=password
DATABASE_NAME=mydb

# --- Auth Configuration ---
JWT_SECRET=your_32_character_secret_key_here
JWT_EXPIRATION_TIME=1h
# AUTH_STRATEGY=jwt # default
3. الخطة التنفيذية وتحقيق الأهداف (Execution Plan and Objective Achievement)
3.1. فشل عند خطأ (Failure on Error):

الخطة التنفيذية:
قم بتغيير ملف .env الخاص بتطبيق NestJS عمدًا لإحداث خطأ في التحقق، مثلاً:
تغيير JWT_SECRET ليكون أقصر من 32 حرفًا: JWT_SECRET=short_key
حذف DATABASE_USER تمامًا.
تعيين DATABASE_PORT لقيمة غير صالحة: DATABASE_PORT=invalid
حفظ ملف .env.
حاول بدء تشغيل تطبيق NestJS:
bun run dev # أو bun start
الهدف والمتوقع: يفشل التطبيق في البدء ويطبع رسالة خطأ واضحة مثل "Invalid environment variable: JWT_SECRET - Expected length 32, got 5." أو "Invalid environment variable: DATABASE_USER - Cannot be empty.".
التحقق:
ملاحظة فشل عملية تشغيل التطبيق (العملية تخرج برمز خطأ غير صفري).
قراءة رسالة الخطأ في الطرفية. يجب أن تكون دقيقة وواضحة، تحدد المتغير المعني ونوع الخطأ (مثلاً، طول خاطئ، مفقود، نوع بيانات غير صحيح).
3.2. نجاح عند الصحة (Success on Valid Config):

الخطة التنفيذية:
تأكد من أن جميع متغيرات البيئة في ملف .env (أو البيئة الفعلية حيث يتم تشغيل التطبيق) تتوافق تمامًا مع EnvironmentSchema (على سبيل المثال، JWT_SECRET بطول 32 حرفًا، DATABASE_USER موجود).
حاول بدء تشغيل تطبيق NestJS:
bun run dev # أو bun start
الهدف والمتوقع: بدء تشغيل جميع التطبيقات مع متغيرات بيئة صالحة يتم بشكل طبيعي، ويظهر التطبيق رسالة بدء التشغيل العادية (مثل "Application is running on: http://localhost:3000").
التحقق:
ملاحظة نجاح عملية تشغيل التطبيق (العملية لا تخرج برمز خطأ).
رؤية رسالة "Environment variables validated successfully." تتبعها رسالة بدء تشغيل التطبيق.
التأكد من أن التطبيق يعمل بشكل صحيح ويمكن الوصول إليه (إذا كان API، حاول إجراء طلب بسيط).
3.3. تغطية 100% (100% Coverage):

الخطة التنفيذية:
مراجعة جميع أجزاء الكود في التطبيقات والخدمات التي تستخدم متغيرات بيئة.
مقارنة هذه المتغيرات مع EnvironmentSchema في حزمة @apex/config.
التأكد من أن كل متغير بيئة مستخدم في أي مكان في Monorepo له إدخال مقابل في EnvironmentSchema، مع تحديد نوعه الصحيح (string, number, boolean, enum)، وتحديد ما إذا كان اختياريًا (.optional()) أو له قيمة افتراضية (.default()).
التأكد من عدم وجود متغيرات بيئة في .env أو process.env يتم استخدامها في التطبيق ولكنها غير معرفة في الـ Schema (يمكن لـ strict() في EnvironmentSchema.strict().parse(config) أن يساعد في اكتشاف ذلك).
الهدف والمتوقع: جميع متغيرات البيئة المستخدمة في المشروع مغطاة بـ Zod Schema.
التحقق:
إجراء مراجعة يدوية أو آلية للكود لمطابقة الاستخدامات الفعلية لـ process.env مع تعريفات الـ Schema.
تشغيل التطبيقات في بيئة test مع Schema صارم (strict()) لاكتشاف أي متغيرات غير معرّفة.
3.4. تواجد .env.example (Presence of .env.example):

الخطة التنفيذية:
إنشاء ملف monorepo.md (المشار إليه في Arch-Core-01) يتضمن قسمًا عن إعداد البيئة المحلية، ويوجه المطورين إلى ملف packages/config/.env.example (أو .env.example في الجذر إذا تم وضعه هناك).
التأكد من أن ملف packages/config/.env.example (أو /.env.example) موجود في جذر Monorepo أو في حزمة config.
مراجعة محتوى env.example يدويًا للتأكد من أنه يعكس بدقة جميع المتغيرات المطلوبة في EnvironmentSchema، بما في ذلك القيم الافتراضية أو أمثلة للقيم.
الهدف والمتوقع: وجود ملف env.example محدث يطابق الـ Schemas، ويوفر مرجعًا واضحًا للمتغيرات البيئية المطلوبة.
التحقق:
فحص وجود الملف في الموقع المتوقع.
فتح الملف ومقارنة محتواه مع EnvironmentSchema للتأكد من شموله ودقته.
4. ملخص وفوائد (Summary and Benefits)
بتنفيذ Arch-Core-03 Environment Verification ⚡، سيتم تحقيق ما يلي:

استقرار محسن: منع التطبيقات من البدء بتكوينات بيئية غير صحيحة، مما يقلل من أخطاء وقت التشغيل.
تحديد سريع للأخطاء: رسائل خطأ واضحة ومفصلة تسمح للمطورين بتحديد مشكلات التكوين وإصلاحها بسرعة.
توثيق ذاتي: تعمل Zod Schemas كتوثيق حي ودقيق لجميع متغيرات البيئة.
سهولة الإعداد للمطورين الجدد: يوفر ملف .env.example نقطة بداية واضحة للمطورين، مما يقلل من منحنى التعلم.
الاتساق عبر التطبيقات: تضمن حزمة @apex/config المشتركة أن جميع التطبيقات داخل Monorepo تلتزم بنفس معايير متغيرات البيئة.
تجربة تطوير أفضل: تقليل الوقت الضائع في استكشاف أخطاء التكوين وإصلاحها.
هذه الخطة توفر تفاصيل شاملة لهيكل وتنفيذ Arch-Core-03 Environment Verification ⚡، مما يضمن بيئة تطوير مستقرة وموثوقة.