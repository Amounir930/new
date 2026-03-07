مقدمة:
تُعد الصور عنصرًا أساسيًا في معظم تطبيقات الويب الحديثة، ولكن حجمها يمكن أن يؤثر سلبًا على أداء التحميل وتجربة المستخدم. يهدف هذا المشروع إلى دمج Imgproxy، وهو خادم وكيل (proxy server) عالي الأداء لتحويل الصور، لتقديم صور محسّنة ديناميكيًا من MinIO (خدمة تخزين الكائنات المحلية التي تم إعدادها في Arch-Core-02). هذا يضمن أن يتم عرض الصور بالحجم والشكل الأمثل لكل جهاز ونوع اتصال، مع تحسين سرعة تحميل الصفحات وتقليل استهلاك النطاق الترددي.

1. مفهوم تحسين الصور و Imgproxy
مشكلة الصور الكبيرة: الصور ذات الأحجام الكبيرة (في الأبعاد أو الميغابايت) تبطئ تحميل الصفحات، وتستهلك نطاقًا تردديًا إضافيًا، وتضر بتجربة المستخدم، خاصة على الأجهزة المحمولة أو الاتصالات البطيئة.
الحل - تحسين الصور ديناميكيًا: بدلًا من تخزين إصدارات متعددة من الصورة (مثل مصغرة، متوسطة، كبيرة)، تقوم خدمة مثل Imgproxy بمعالجة الصورة الأصلية "عند الطلب" (on-the-fly) وتحويلها إلى التنسيق والحجم والجودة المطلوبين.
Imgproxy: هو خادم وكيل لتحويل الصور مصمم لتسريع مواقع الويب والخدمات. يأخذ Imgproxy عنوان URL للصورة الأصلية، ويقوم بتطبيق تحويلات (مثل تغيير الحجم، الاقتصاص، تغيير الجودة، التحويل إلى WebP/AVIF)، ثم يقوم بتقديم الصورة المحسّنة. يمكنه أيضًا توقيع الـ URLs لمنع الاستخدام غير المصرح به.
تخزين الكاش (Caching): يقوم Imgproxy بتخزين الصور المحولة مؤقتًا (caching) لتقديمها بسرعة في الطلبات اللاحقة دون الحاجة إلى إعادة معالجتها.
2. الأدوات المستخدمة (Tools Utilized)
Imgproxy: خادم وكيل لتحويل الصور (darthsim/imgproxy:latest).
MinIO: تخزين الكائنات المتوافق مع S3 (من Arch-Core-02)، كمصدر للصور الأصلية.
Docker Compose: لنشر Imgproxy (من Arch-Core-02).
NestJS API: لتوليد عناوين URL لـ Imgproxy الموقعة.
3. استراتيجية التنفيذ والتكوين التفصيلي (Detailed Execution Strategy & Configuration)
3.1. نشر Imgproxy (ضمن Arch-Core-02):

الغرض: تشغيل Imgproxy كخدمة Docker داخل نفس بيئة Compose، مما يسهل الاتصال بـ MinIO وتقديم الصور.
الخطة التنفيذية: تم بالفعل تعريف imgproxy كخدمة في compose.yaml (من Arch-Core-02). سنقوم بتأكيد وتوسيع تكوينها:
# جزء من compose.yaml (من Arch-Core-02)
services:
  # ... minio service ...
  imgproxy:
    image: darthsim/imgproxy:latest
    environment:
      IMGPROXY_BIND: 0.0.0.0:8080 # ربط على جميع الواجهات
      IMGPROXY_KEY: ${IMGPROXY_KEY:-imgproxy-key} # مفتاح توقيع URL (يجب أن يكون قويًا في الإنتاج)
      IMGPROXY_SALT: ${IMGPROXY_SALT:-imgproxy-salt} # ملح توقيع URL (يجب أن يكون قويًا في الإنتاج)
      IMGPROXY_URLS: "http://minio:9000/apex-bucket" # المصادر المسموح بها (MinIO)
      IMGPROXY_LOCAL_FILES_PATH: "/imgproxy_cache" # مجلد لتخزين الكاش
      IMGPROXY_LOCAL_FILES_TTL: "24h" # مدة صلاحية الكاش المحلي
      IMGPROXY_TTL: "24h" # HTTP Cache TTL للصور المقدمة
      IMGPROXY_ENABLE_WEBP_DETECTION: "true" # لتفعيل WebP تلقائياً للمتصفحات المدعومة
      IMGPROXY_ENABLE_AVIF_DETECTION: "true" # لتفعيل AVIF تلقائياً للمتصفحات المدعومة
      IMGPROXY_FALLBACK_URL: "" # إذا فشلت معالجة الصورة الأصلية
    ports:
      - "8080:8080" # منفذ خدمة Imgproxy
    volumes:
      - imgproxy_cache:/imgproxy_cache #Persistent volume للكاش المحلي
    depends_on:
      minio: # تأكد من أن MinIO يبدأ أولاً
        condition: service_healthy
    networks:
      - apex-network # ضمن نفس الشبكة للسماح بالوصول إلى MinIO
    labels: # لتكامل Traefik (من Arch-Core-02)
      - "traefik.enable=true"
      - "traefik.http.routers.imgproxy.rule=Host(`imgproxy.apex.localhost`)" # subdomain للوصول العام
      - "traefik.http.routers.imgproxy.entrypoints=web"
      - "traefik.http.services.imgproxy.loadbalancer.server.port=8080"
    healthcheck: # (من Arch-Core-02)
      test: ["CMD-SHELL", "curl -f http://localhost:8080/health || exit 1"]
      interval: 10s
      timeout: 5s
      retries: 3
      start_period: 5s
    restart: unless-stopped
  # ...
volumes:
  imgproxy_cache: # تعريف الـ volume الدائم
3.2. تكوين متغيرات البيئة:

IMGPROXY_KEY و IMGPROXY_SALT: يجب أن تكون هذه القيم سرية وتستخدم لتوقيع عناوين URL. بدون توقيع صحيح، لن يقوم Imgproxy بمعالجة الطلب، مما يمنع توليد صور غير مصرح بها ويحمي من هجمات الحرمان من الخدمة (DoS).
الخطة: توليد قيم عشوائية قوية لهذه المتغيرات وتخزينها في ملف .env الجذري.
# .env
# ...
IMGPROXY_KEY=your_very_secret_imgproxy_key_here_at_least_32_chars
IMGPROXY_SALT=your_very_secret_imgproxy_salt_here_at_least_32_chars
(يمكن توليدها باستخدام openssl rand -hex 32).
IMGPROXY_URLS: تحدد المصادر الموثوقة التي يمكن لـ Imgproxy جلب الصور منها. هذا ضروري لمنع Imgproxy من العمل كوكيل مفتوح (open proxy) يمكن استخدامه لجلب صور من أي مكان على الإنترنت.
الخطة: تعيينها لتشير إلى MinIO على شبكة Docker الداخلية: http://minio:9000/apex-bucket (حيث minio هو اسم خدمة MinIO في Docker Compose، و apex-bucket هو اسم الـ bucket الذي تخزن فيه الصور).
IMGPROXY_LOCAL_FILES_PATH: مسار المجلد الذي سيستخدمه Imgproxy لتخزين الكاش المحلي للصور المعالجة.
الخطة: تعيينه إلى /imgproxy_cache وربطه بـ Persistent Volume (imgproxy_cache) في compose.yaml لضمان بقاء الكاش عبر إعادة تشغيل الحاوية.
3.3. تعديل الـ API لإنشاء Signed Imgproxy URLs:

الغرض: السماح للـ API بتقديم روابط صور محسّنة ديناميكيًا مع حماية أمنية.
الخطة التنفيذية:
تثبيت مكتبة imgproxy-url-builder:
cd apps/api # أو أي خدمة تحتاج لتوليد روابط صور
bun add imgproxy-url-builder
إنشاء خدمة مساعدة لتوليد الـ URLs في NestJS API:
// apps/api/src/imgproxy/imgproxy.service.ts
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { buildUrl } from 'imgproxy-url-builder'; // استيراد الدالة

@Injectable()
export class ImgproxyService {
  private readonly imgproxyHost: string;
  private readonly imgproxyKey: string;
  private readonly imgproxySalt: string;
  private readonly minioHost: string; // MinIO internal host

  constructor(private configService: ConfigService) {
    // متغيرات Imgproxy العامة التي تم تعريفها في .env
    this.imgproxyHost = this.configService.get<string>('IMGPROXY_PUBLIC_HOST'); // مثال: imgproxy.apex.localhost
    this.imgproxyKey = this.configService.get<string>('IMGPROXY_KEY');
    this.imgproxySalt = this.configService.get<string>('IMGPROXY_SALT');
    this.minioHost = this.configService.get<string>('MINIO_INTERNAL_HOST') || 'http://minio:9000'; // Host الداخلي لـ MinIO
  }

  /**
   * Generates a signed Imgproxy URL for an image.
   * @param minioPath The path to the image in MinIO (e.g., 'apex-bucket/products/image.jpg').
   * @param options Transformation options.
   * @returns The signed Imgproxy URL.
   */
  generateSignedUrl(
    minioPath: string,
    options: {
      resize?: 'fit' | 'fill' | 'auto';
      width?: number;
      height?: number;
      quality?: number;
      format?: string; // مثلاً 'webp'
      dpr?: number; // Device Pixel Ratio
    } = {}
  ): string {
    // بناء URL الصورة الأصلية في MinIO (يمكن الوصول إليها داخلياً بواسطة Imgproxy)
    const imageUrl = `${this.minioHost}/${minioPath}`;

    // بناء URL لـ Imgproxy مع التوقيع
    const signedUrl = buildUrl({
      baseUrl: this.imgproxyHost, // العنوان العام لـ Imgproxy (الذي يتم الوصول إليه من المتصفح)
      key: this.imgproxyKey,
      salt: this.imgproxySalt,
      url: imageUrl, // الصورة الأصلية التي سيجلبها Imgproxy
      options: {
        ...options,
        // إعدادات افتراضية يمكن تجاوزها
        resize: options.resize || 'fit',
        quality: options.quality || 80,
        format: options.format || 'webp',
      },
    });

    return signedUrl;
  }
}
تعديل DTOs و Controller لتقديم الـ URLs:
عند عرض قائمة المنتجات أو تفاصيل منتج، بدلًا من إرجاع URL MinIO المباشر، ستقوم الـ API بإرجاع URL Imgproxy المُوقّع.
// apps/api/src/products/products.controller.ts
import { Controller, Get, Param } from '@nestjs/common';
import { ProductsService } from './products.service';
import { ImgproxyService } from '../imgproxy/imgproxy.service';
import { GetProductParamsDto } from './dto/get-product-params.dto';

@Controller('products')
export class ProductsController {
  constructor(
    private readonly productsService: ProductsService,
    private readonly imgproxyService: ImgproxyService,
  ) {}

  @Get(':id')
  async getProduct(@Param() params: GetProductParamsDto) {
    const product = await this.productsService.getProductById(params.id);
    if (!product) {
      return null;
    }

    // مثال: إذا كان product.imageUrl يخزن 'products/image.jpg'
    const originalMinioPath = product.imageUrl;

    // توليد URL Imgproxy المحسّن
    const optimizedImageUrl = this.imgproxyService.generateSignedUrl(
      originalMinioPath,
      {
        width: 500,
        height: 0, // الحفاظ على نسبة العرض إلى الارتفاع
        quality: 75,
        format: 'webp',
      }
    );

    return {
      ...product,
      optimizedImageUrl, // إضافة الـ URL المحسّن إلى الاستجابة
      // imageUrl: originalMinioPath, // يمكن إزالة الرابط الأصلي
    };
  }
}
تحديث IMGPROXY_PUBLIC_HOST في apps/api/.env:
# apps/api/.env
# ...
IMGPROXY_PUBLIC_HOST=http://imgproxy.apex.localhost:8080 # أو فقط http://imgproxy.apex.localhost إذا تم استخدام Traefik بدون منفذ
3.4. التكامل مع MinIO:

الغرض: ضمان قدرة Imgproxy على جلب الصور الأصلية من MinIO.
الخطة التنفيذية:
شبكة Docker الداخلية: بما أن كلا الخدمتين (MinIO و Imgproxy) ضمن نفس شبكة Docker (apex-network) في compose.yaml، يمكنهما التواصل باستخدام اسم الخدمة الخاص بكل منهما (أي http://minio:9000 لـ Imgproxy).
تكوين IMGPROXY_URLS: هذا المتغير (الموضح في 3.2) يحدد أن MinIO هو مصدر موثوق.
التأكد من الـ Bucket: تأكد من أن الصور موجودة في الـ bucket المحدد (apex-bucket) في MinIO.
4. تحقيق الأهداف والتحقق (Achieving Objectives & Verification)
4.1. صور محسّنة (Optimized Images):

الخطة التنفيذية:
تأكد من بدء تشغيل جميع خدمات Docker Compose.
استخدم لوحة تحكم Admin Panel (أو أي واجهة تسمح برفع الصور) لرفع صورة PNG كبيرة (مثلاً، 5MB) إلى MinIO.
قم بإنشاء منتج أو أي كائن آخر يرتبط بهذه الصورة في قاعدة البيانات.
افتح واجهة المستخدم الأمامية (Storefront) التي تعرض هذه الصورة (ويجب أن تطلبها عبر URL Imgproxy).
الهدف والمتوقع: عند عرضها في Storefront، يتم تحميلها كصورة WebP محسّنة (مثال: 50KB) عبر Imgproxy URL.
التحقق:
Network tab في المتصفح (Developer Tools):
افتح Developer Tools (F12) في المتصفح.
انتقل إلى Network tab.
أعد تحميل الصفحة.
ابحث عن طلب الصورة. يجب أن يكون URL للطلب هو Imgproxy URL (مثلاً http://imgproxy.apex.localhost/unsafe/500x0/…/products/image.jpg).
افحص تفاصيل الطلب:
Type/Content-Type: يجب أن يكون image/webp.
Size: يجب أن يكون أصغر بكثير من الصورة الأصلية (مثلاً 50KB بدلاً من 5MB).
Status Code: يجب أن يكون 200 OK.
4.2. حماية التوقيع (Signature Protection):

الخطة التنفيذية:
احصل على Imgproxy URL لـصورة صالحة (مثلاً، من خلال استعراض Storefront ونسخ URL الصورة).
حاول تعديل هذا URL (مثلاً، تغيير عرض الصورة من 500 إلى 600، أو حذف جزء من التوقيع).
حاول الوصول إلى URL المعدل في المتصفح أو باستخدام curl.
الهدف والمتوقع: محاولة الوصول إلى Imgproxy باستخدام URL غير موقع أو موقع بشكل خاطئ ينتج عنه 403 Forbidden.
التحقق:
يجب أن تعود الاستجابة بـ 403 Forbidden من Imgproxy، مع رسالة خطأ مثل "Signature mismatch" أو "Invalid signature".
4.3. الكاش فعال (Effective Caching):

الخطة التنفيذية:
بعد التحميل الأول للصورة المحسّنة (كما في 4.1).
أعد تحميل الصفحة في المتصفح عدة مرات، أو أعد إجراء نفس طلب الصورة باستخدام curl.
الهدف والمتوقع: بعد التحميل الأول للصورة، التحميلات اللاحقة لنفس الصورة المحسّنة تكون فورية (HTTP 304 Not Modified أو من كاش Imgproxy).
التحقق:
Network tab في المتصفح:
في التحميلات اللاحقة، يجب أن ترى أن الصورة تُقدم بسرعة كبيرة جدًا.
قد يكون Status Code لطلب الصورة 304 Not Modified (مما يعني أن المتصفح استخدم الكاش الخاص به)، أو قد ترى (from disk cache) أو (from memory cache).
حتى لو لم يكن 304، يجب أن يكون زمن الاستجابة (Latency) من Imgproxy (وليس المتصفح) منخفضًا جدًا (بضع مللي ثانية) بعد التحميل الأول، مما يدل على استخدام Imgproxy لكاشه المحلي.
سجلات Imgproxy: قد تظهر السجلات أن الصورة تُقدم من الكاش بدلاً من إعادة معالجتها.
4.4. مراقبة Imgproxy (Imgproxy Monitoring):

الخطة التنفيذية:
قم بإرسال عدة طلبات لصور مختلفة وبتحويلات مختلفة.
راقب سجلات خدمة imgproxy.
الهدف والمتوقع: سجلات Imgproxy تظهر معالجة الصور وخدمتها بنجاح، مع معلومات عن المصدر والتحويلات.
التحقق:
docker compose logs imgproxy
البحث عن رسائل تشير إلى [INFO] لمعالجة الصور الناجحة، أو [CACHE] لتقديم الصور من الكاش.
مراقبة أي رسائل [ERROR] قد تشير إلى مشاكل في جلب الصور من MinIO أو مشكلات في التكوين.
5. ملخص وفوائد (Summary and Benefits)
بتطبيق Arch-Core-09 Image Optimization (Imgproxy) 🚀، سيتم تحقيق ما يلي:

تحسين أداء التحميل: تحميل أسرع للصور، مما يحسن من تجربة المستخدم ويسرع تحميل الصفحات.
توفير النطاق الترددي: تقليل حجم الصور يعني استهلاكًا أقل للبيانات، مما يوفر تكاليف النطاق الترددي.
تقديم صور ديناميكية: القدرة على تقديم الصور بأحجام وجودات وتنسيقات مختلفة لكل سياق استخدام.
أمان محسن: حماية ضد الاستخدام غير المصرح به لـ Imgproxy وDoS من خلال توقيع عناوين URL.
تخزين كاش فعال: تقليل الحمل على MinIO ومعالجة الصور من خلال التخزين المؤقت للصور المحولة.
تكامل سلس: يندمج Imgproxy بسلاسة مع بيئة Docker Compose و MinIO.
هذه الخطة توفر تفاصيل شاملة لهيكل وتنفيذ نظام تحسين صور قوي وفعال باستخدام Imgproxy.