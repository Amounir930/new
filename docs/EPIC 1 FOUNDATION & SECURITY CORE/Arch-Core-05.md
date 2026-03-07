مقدمة:
يُعد التحقق من صحة المدخلات (Input Validation) أحد أهم جوانب أمان التطبيقات وجودتها. فبدون التحقق المناسب، يمكن أن تؤدي المدخلات غير الصالحة إلى أخطاء في التطبيق، أو ثغرات أمنية (مثل SQL Injection أو Cross-Site Scripting)، أو سلوك غير متوقع. يهدف هذا المشروع إلى تنفيذ نظام شامل للتحقق من صحة المدخلات في تطبيقات NestJS باستخدام Zod و nestjs-zod، مما يضمن أن جميع البيانات الواردة تتوافق مع التوقعات المحددة، ويُطبق هذا التحقق بشكل تلقائي وعالمي.

1. مفهوم التحقق من المدخلات (Input Validation Concepts)
Data Transfer Objects (DTOs): كائنات تُستخدم لتحديد بنية البيانات التي يتم إرسالها بين العمليات أو عبر الشبكة. في NestJS، تُستخدم DTOs لتحديد شكل الـ Request Body، Query Parameters، و Path Parameters.
Schema Validation: عملية التحقق من أن البيانات تتوافق مع مخطط (Schema) محدد مسبقًا يصف البنية، الأنواع، والقواعد الخاصة بالبيانات.
Mass Assignment: ثغرة أمنية تحدث عندما يقوم المهاجم بإرسال خصائص إضافية (غير متوقعة) في بيانات الطلب، ويقوم التطبيق بتعيين هذه الخصائص تلقائيًا إلى كائن (مثل نموذج قاعدة بيانات) دون التحقق من صلاحية هذه الخصائص، مما قد يؤدي إلى تغيير خصائص حساسة (مثل isAdmin: true).
Global Pipe: في NestJS، الـ Pipes هي فئات توفر تحويلاً للبيانات أو التحقق من صحتها. يمكن تطبيق الـ Pipes عالميًا (Global) لتطبيق منطق معين على جميع الطلبات الواردة، مما يقلل من تكرار الكود.
2. الأدوات المستخدمة (Tools Utilized)
Zod: مكتبة قوية ومرنة لإنشاء Schemas والتحقق من صحة البيانات في TypeScript. توفر Type Safety ممتازة وتستنتج أنواع TypeScript تلقائيًا من المخططات.
nestjs-zod: مكتبة تكامل لـ NestJS تسمح باستخدام Zod Schemas مع نظام الـ Pipes الخاص بـ NestJS، مما يوفر ZodValidationPipe ويجعل عملية التحقق سلسة.
3. استراتيجية التنفيذ والتكوين التفصيلي (Detailed Execution Strategy & Configuration)
3.1. Global ZodValidationPipe:

الغرض: تطبيق التحقق من صحة المدخلات تلقائيًا على جميع الـ DTOs في جميع الـ Endpoints في تطبيق NestJS، مما يقلل من الكود المتكرر ويضمن الاتساق عبر الـ API بالكامل.
الخطة التنفيذية:
تثبيت التبعيات: في كل تطبيق NestJS يتطلب هذا التحقق (مثلاً apps/api):
cd apps/api
bun add zod nestjs-zod
تطبيق ZodValidationPipe عالميًا في main.ts:
// apps/api/src/main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ZodValidationPipe } from 'nestjs-zod'; // استيراد ZodValidationPipe

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // تطبيق ZodValidationPipe عالميًا لجميع الطلبات
  app.useGlobalPipes(new ZodValidationPipe({
    transform: true, // مهم: يقوم بتحويل المدخلات إلى النوع الصحيح (مثلاً، "123" إلى 123).
    forbidUnknownValues: true, // مهم: يمنع خصائص غير معرفة في الـ DTO (حماية ضد Mass Assignment).
    // خيارات إضافية يمكن تفعيلها حسب بيئة التشغيل:
    // disableErrorMessages: process.env.NODE_ENV === 'production', // إخفاء تفاصيل الأخطاء في الإنتاج
  }));

  // ... (باقي تكوين التطبيق مثل الاستماع إلى Port)
  await app.listen(3000);
}
bootstrap();
transform: true: هذا الخيار حيوي. يقوم تلقائيًا بتحويل قيم المدخلات من نوع string (الذي غالباً ما يأتي من Request Body/Query/Params) إلى النوع المتوقع في Zod Schema (مثلاً، إلى number أو boolean). هذا يقلل من الحاجة إلى التحويل اليدوي في الـ Controllers أو الخدمات.
forbidUnknownValues: true: هذا الخيار هو آلية الدفاع الرئيسية ضد هجمات Mass Assignment. إذا تم إرسال خاصية في الـ Request Body (أو Query/Params) غير معرفة صراحة في Zod Schema الخاص بالـ DTO، فإن الطلب سيُرفض تلقائيًا بـ 400 Bad Request.
3.2. تعريف DTOs بـ Zod:

الغرض: استخدام Zod Schemas لتحديد بنية وقواعد التحقق لجميع المدخلات بشكل واضح وآمن من حيث النوع (type-safe).
الخطة التنفيذية:
إنشاء Zod Schema: لكل DTO (لكل Request Body، Query Parameters، Path Parameters)، قم بإنشاء Zod Schema المقابل.
// apps/api/src/products/dto/create-product.dto.ts
import { z } from 'zod';
import { createZodDto } from 'nestjs-zod'; // وظيفة مساعدة من nestjs-zod

// تعريف Zod Schema للـ Request Body
export const CreateProductSchema = z.object({
  name: z.string().min(3, { message: "Product name must be at least 3 characters long." }),
  description: z.string().optional(), // حقل اختياري
  price: z.number().positive({ message: "Price must be a positive number." }),
  currency: z.enum(['USD', 'EUR', 'GBP']).default('USD'), // قيمة افتراضية
  tags: z.array(z.string()).max(5, { message: "Maximum 5 tags allowed." }).optional(),
})
// .strict(); // يمكن استخدام .strict() هنا أيضًا لضمان عدم وجود خصائص إضافية،
              // ولكنه اختياري طالما أن forbidUnknownValues: true مُفعل في الـ Pipe.

// إنشاء DTO (Data Transfer Object) من Zod Schema باستخدام createZodDto
export class CreateProductDto extends createZodDto(CreateProductSchema) {}
استخدام DTO في Controller:
// apps/api/src/products/products.controller.ts
import { Controller, Post, Body, Get, Query, Param } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { ProductsService } from './products.service';
import { GetProductsQueryDto } from './dto/get-products-query.dto';
import { GetProductParamsDto } from './dto/get-product-params.dto';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  async createProduct(@Body() createProductDto: CreateProductDto) {
    // هنا، 'createProductDto' مضمونة لتكون صالحة ومتوافقة مع 'CreateProductSchema'.
    // تم التحقق منها وتحويل أنواعها بواسطة ZodValidationPipe.
    return this.productsService.createProduct(createProductDto);
  }

  // مثال للتعامل مع Query Parameters
  @Get()
  async getProducts(@Query() query: GetProductsQueryDto) {
    // 'query.limit' و 'query.offset' و 'query.search' ستكون من الأنواع الصحيحة
    // وسيتم تطبيق القيم الافتراضية إذا لم يتم توفيرها.
    return this.productsService.findAll(query);
  }

  // مثال للتعامل مع Path Parameters
  @Get(':id')
  async getProductById(@Param() params: GetProductParamsDto) {
    // 'params.id' سيكون مضمونًا ليكون UUID صالحًا.
    return this.productsService.findById(params.id);
  }
}
أمثلة لـ Query و Path Parameters DTOs:
// apps/api/src/products/dto/get-products-query.dto.ts
import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

export const GetProductsQuerySchema = z.object({
  limit: z.preprocess(val => Number(val), z.number().int().min(1).max(100).default(10)),
  offset: z.preprocess(val => Number(val), z.number().int().min(0).default(0)),
  search: z.string().optional(),
});
export class GetProductsQueryDto extends createZodDto(GetProductsQuerySchema) {}
// apps/api/src/products/dto/get-product-params.dto.ts
import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

export const GetProductParamsSchema = z.object({
  id: z.string().uuid({ message: "Product ID must be a valid UUID." }), // تحقق من أن id هو UUID صالح
});
export class GetProductParamsDto extends createZodDto(GetProductParamsSchema) {}
ملاحظة على preprocess: يتم استخدام z.preprocess لتحويل القيمة قبل التحقق منها. هذا ضروري لأن Query و Path parameters يتم استقبالها دائمًا كسلاسل نصية (string)، بينما قد نتوقعها كـ number أو boolean.
3.3. تخصيص رسائل الخطأ:

الغرض: توفير رسائل خطأ واضحة ومفهومة للمستخدم النهائي بدلاً من رسائل Zod الافتراضية التي قد تكون تقنية جداً.
الخطة التنفيذية:
يمكن تخصيص رسائل الخطأ مباشرة داخل Zod Schema باستخدام الخاصية message في كل دالة تحقق (validator) أو في z.object().refine() للتحقق المعقد.
يقوم ZodValidationPipe تلقائيًا بتحويل أخطاء Zod إلى استجابة 400 Bad Request مع بنية خطأ قياسية (عادةً مصفوفة من كائنات الخطأ، كل منها يصف مشكلة).
مثال:
name: z.string().min(3, { message: "Product name must be at least 3 characters long." }),
price: z.number().positive({ message: "Price must be a positive number." }),
id: z.string().uuid({ message: "Product ID must be a valid UUID." }),
هذه الرسائل ستظهر مباشرة في حقل message في استجابة الخطأ JSON.
3.4. منع Mass Assignment (forbidUnknownValues: true):

الغرض: حماية التطبيق من هجمات Mass Assignment عن طريق رفض أي خصائص غير معرفة (غير متوقعة) في المدخلات.
الخطة التنفيذية:
تم تفعيل هذا الخيار مسبقًا في ZodValidationPipe في main.ts.
عندما يتم إرسال خاصية غير معرفة في الـ DTO (على سبيل المثال، isAdmin: true في DTO لتعديل المستخدم حيث لا يُتوقع هذا الحقل)، سيقوم الـ Pipe بإلقاء خطأ 400 Bad Request مع رسالة توضح أن هناك خصائص غير معروفة، مما يمنع تمرير هذه البيانات غير المرغوب فيها إلى منطق العمل أو قاعدة البيانات.
4. تحقيق الأهداف والتحقق (Achieving Objectives & Verification)
4.1. فشل عند إدخال غير صالح (Failure on Invalid Input):

الخطة التنفيذية:
تشغيل تطبيق NestJS (مثلاً apps/api).
إرسال طلب POST /products إلى الـ API مع payload غير صالح:
{
  "name": "ab",             // أقل من 3 أحرف
  "price": "invalid_price", // ليس رقمًا
  "currency": "XYZ"         // ليس قيمة صالحة في enum
}
الهدف والمتوقع: يعود الطلب بـ 400 Bad Request مع رسالة خطأ محددة ومفصلة تتضمن جميع الأخطاء.
{
  "statusCode": 400,
  "message": [
    {
      "validation": "too_small",
      "code": "too_small",
      "minimum": 3,
      "type": "string",
      "inclusive": true,
      "message": "Product name must be at least 3 characters long.",
      "path": ["name"]
    },
    {
      "validation": "invalid_type",
      "code": "invalid_type",
      "expected": "number",
      "received": "string",
      "message": "Expected number, received string",
      "path": ["price"]
    },
    {
      "validation": "invalid_enum_value",
      "code": "invalid_enum_value",
      "options": ["USD", "EUR", "GBP"],
      "received": "XYZ",
      "message": "Invalid enum value. Expected 'USD' | 'EUR' | 'GBP', received 'XYZ'",
      "path": ["currency"]
    }
  ],
  "error": "Bad Request"
}
التحقق: مراجعة استجابة الـ API للتأكد من أن statusCode هو 400 وأن حقل message يحتوي على الأخطاء المتوقعة مع الرسائل المخصصة.
4.2. فشل عند خصائص غير معروفة (Failure on Unknown Properties):

الخطة التنفيذية:
تشغيل تطبيق NestJS.
إرسال طلب POST /products مع خاصية غير معرفة في CreateProductDto:
{
  "name": "Valid Product",
  "price": 100,
  "currency": "USD",
  "extraField": "some_value" // خاصية غير متوقعة
}
الهدف والمتوقع: يعود الطلب بـ 400 Bad Request مع رسالة خطأ تشير إلى الخاصية غير المعروفة.
{
  "statusCode": 400,
  "message": "Unrecognized key(s) in object: 'extraField'",
  "error": "Bad Request"
}
التحقق: مراجعة استجابة الـ API للتأكد من أن statusCode هو 400 وأن رسالة الخطأ تشير إلى الخاصية غير المعروفة (extraField).
4.3. نجاح عند إدخال صالح (Success on Valid Input):

الخطة التنفيذية:
تشغيل تطبيق NestJS.
إرسال طلب POST /products مع payload صالح:
{
  "name": "New Awesome Product",
  "description": "A very good product.",
  "price": 150.75,
  "currency": "EUR",
  "tags": ["awesome", "new"]
}
الهدف والمتوقع: يتم معالجة الطلب بنجاح (مثلاً، يعود بـ 201 Created مع الكائن الذي تم إنشاؤه)، مما يدل على أن جميع عمليات التحقق قد نجحت.
التحقق: مراجعة استجابة الـ API للتأكد من أن statusCode هو 201 (أو 200) وأن البيانات تم معالجتها بشكل صحيح بواسطة منطق العمل.
4.4. تغطية DTOs (DTOs Coverage):

الخطة التنفيذية:
مراجعة شاملة لجميع الـ Controllers (وحدات التحكم) في تطبيق NestJS (أو تطبيقات الـ API المختلفة في الـ Monorepo).
التأكد من أن كل endpoint يستقبل Body أو Query أو Param يستخدم DTO معرفًا باستخدام createZodDto من nestjs-zod، والذي بدوره يعتمد على Zod Schema.
التأكد من أن جميع Zod Schemas تغطي جميع الحقول المتوقعة بشكل كامل وتطبق قواعد التحقق المناسبة (مثل min(), max(), uuid(), email(), enum(), url(), regex()).
الهدف والمتوقع: جميع الـ DTOs المستخدمة في الـ API لها Zod Schemas مقابلة ومكتملة، مما يضمن التحقق الشامل من المدخلات. [100% COMPLETED]
التحقق:
إجراء مراجعة يدوية للكود للتأكد من استخدام DTOs المستندة إلى Zod في كل مكان تتوقع فيه المدخلات.
يمكن تطوير أدوات تحليل الكود (مثل ESLint rules مخصصة) لفرض استخدام هذه الأنماط.
التأكد من أن جميع المسارات (routes) الحساسة تتطلب DTO للتحقق من المدخلات.
5. ملخص وفوائد (Summary and Benefits)
بتطبيق Arch-Core-05 Global Input Validation ⚡، سيتم تحقيق ما يلي:

أمان مُحسن: حماية قوية ضد ثغرات أمنية شائعة مثل Mass Assignment والمدخلات الضارة أو غير المتوقعة.
جودة بيانات عالية: ضمان أن جميع البيانات التي تدخل التطبيق تتوافق دائمًا مع التوقعات والبنية المحددة، مما يقلل من الأخطاء في المراحل اللاحقة.
Type Safety كاملة: الاستفادة من قوة TypeScript و Zod لتوفير Type Safety ممتازة للمدخلات، مما يجعل الكود أكثر موثوقية وأسهل في الصيانة.
تجربة تطوير مبسطة (DX): تقليل الكود المتكرر للتحقق من صحة المدخلات بشكل كبير، حيث يتم تطبيق الـ Pipe عالميًا.
رسائل خطأ واضحة: توفير رسائل خطأ مفيدة وغنية بالمعلومات للمستهلكين (client)، مما يسهل عليهم تصحيح طلباتهم.
توثيق ذاتي: تعمل Zod Schemas كتوثيق حي ودقيق لبنية المدخلات المتوقعة لجميع الـ Endpoints.
هذه الخطة توفر كل التفاصيل اللازمة لتصميم وتنفيذ نظام قوي وشامل للتحقق من صحة المدخلات في تطبيقات NestJS.