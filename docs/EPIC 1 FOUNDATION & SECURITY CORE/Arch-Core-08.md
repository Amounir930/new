{\rtf1}Arch-Core-08: Distributed Tracing (OpenTelemetry) 👁️
مقدمة:
في الأنظمة الموزعة (Distributed Systems) التي تتكون من خدمات متعددة تتفاعل مع بعضها البعض (مثل Monorepo الذي يحتوي على API، Worker، وقواعد بيانات، و Redis، وخدمات أخرى)، يصبح تتبع تدفق الطلب الواحد عبر هذه الخدمات تحديًا كبيرًا. يهدف هذا المشروع إلى تنفيذ نظام تتبع موزع شامل باستخدام OpenTelemetry، مما يوفر رؤية عميقة لتدفق الطلبات، ويساعد في تحديد bottlenecks، وتحسين الأداء، وتصحيح الأخطاء في بيئة معقدة.

1. مفهوم التتبع الموزع (Distributed Tracing Concepts)
Trace: يمثل مسار طلب واحد (مثل طلب HTTP أو مهمة في قائمة انتظار) عبر جميع الخدمات التي يمر بها. يتكون الـ Trace من مجموعة من الـ Spans.
Span: يمثل وحدة عمل منطقية واحدة داخل الـ Trace (مثل استدعاء دالة، طلب HTTP خارجي، استعلام قاعدة بيانات). يحتوي الـ Span على معلومات مثل اسم العملية، وقت البدء والانتهاء، السمات (attributes)، والـ Span الأب (parent Span).
Context Propagation: هي عملية تمرير معلومات الـ Trace (مثل trace_id و span_id) بين الخدمات المختلفة. هذا يسمح بربط الـ Spans معًا لتشكيل Trace كامل.
Instrumentation: هي عملية إضافة الكود اللازم لإنشاء الـ Spans وجمع بيانات الـ Trace. يمكن أن تكون يدوية (Manual Instrumentation) أو تلقائية (Auto-instrumentation).
OpenTelemetry: مشروع مفتوح المصدر يوفر مجموعة من الأدوات، واجهات برمجة التطبيقات (APIs)، و SDKs لجمع بيانات الـ Telemetry (Traces, Metrics, Logs) وتصديرها إلى أي backend.
Otel Collector: مكون من OpenTelemetry يعمل كـ "وسيط" لجمع، معالجة، وتصدير بيانات الـ Telemetry من الخدمات إلى الـ backends المختلفة (مثل Jaeger، Tempo، Google Cloud Trace).
2. الأدوات المستخدمة (Tools Utilized)
OpenTelemetry: SDKs و Instrumentation libraries.
Otel Collector: لجمع وتصدير الـ Traces (من Arch-Core-02).
Jaeger/Tempo: أدوات لتصور وتحليل الـ Traces (backend).
NestJS: لتطبيقات الـ API والـ Worker.
Drizzle ORM: (من Arch-Core-04).
ioredis: (من Arch-Core-07).
BullMQ: (من Arch-Core-07).
3. استراتيجية التنفيذ والتكوين التفصيلي (Detailed Execution Strategy & Configuration)
3.1. دمج Otel Collector:

الغرض: توفير نقطة مركزية لجمع بيانات الـ Traces من جميع الخدمات قبل إرسالها إلى backend التتبع. هذا يقلل من العبء على الخدمات الفردية ويوفر مرونة في التصدير.
الخطة التنفيذية:
في compose.yaml (من Arch-Core-02): تم بالفعل تعريف otel-collector كخدمة. سيتم تكوينه لاستقبال الـ Traces عبر بروتوكول OTLP.
# جزء من compose.yaml (من Arch-Core-02)
services:
  otel-collector:
    image: otel/opentelemetry-collector-contrib:0.95.0
    command: ["--config=/etc/otel-collector-config.yaml"]
    ports:
      - "4317:4317" # gRPC for OTLP (المنفذ الافتراضي)
      - "4318:4318" # HTTP for OTLP
      - "13133:13133" # health_check extension (للمراقبة)
    volumes:
      - ./otel-collector/config.yaml:/etc/otel-collector-config.yaml:ro # ربط ملف التكوين
    networks:
      - apex-network # ضمن نفس الشبكة لجميع الخدمات
    restart: unless-stopped
تكوين otel-collector/config.yaml: هذا الملف يحدد كيفية استقبال الـ Collector للبيانات، معالجتها، وتصديرها.
# otel-collector/config.yaml
receivers:
  otlp: # يستقبل بيانات OTLP (OpenTelemetry Protocol)
    protocols:
      grpc: # تمكين استقبال OTLP عبر gRPC
      http: # تمكين استقبال OTLP عبر HTTP
processors:
  batch: # تجميع الـ Traces لدفعات قبل التصدير لتحسين الكفاءة
    send_batch_size: 1000
    timeout: 10s
exporters:
  jaeger: # تصدير الـ Traces إلى Jaeger
    endpoint: jaeger:14250 # اسم خدمة Jaeger في Docker Compose ومنفذها gRPC
    tls:
      insecure: true # (لبيئات التطوير فقط)
  # googlecloud: # مثال على التصدير إلى Google Cloud Trace
  #   project: qwiklabs-gcp-00-33356a5f3f04 # استبدل بـ Project ID الخاص بك
  #   trace:
  #     compression: gzip
  logging: # تصدير الـ Traces إلى سجلات الـ Collector (للتصحيح)
    verbosity: detailed
service:
  pipelines:
    traces: # تعريف pipeline لمعالجة الـ Traces
      receivers: [otlp]
      processors: [batch]
      exporters: [jaeger, logging] # تصدير إلى Jaeger وللسجلات
    # يمكن تعريف pipelines أخرى للمقاييس (metrics) والسجلات (logs) هنا
  extensions: [health_check]
extensions:
  health_check: # لتمكين فحص الحالة الصحية للـ Collector
نشر Jaeger (كمثال لـ Trace Visualizer): إذا كنت تستخدم Jaeger لتصور الـ Traces في بيئة التطوير، أضفه إلى compose.yaml.
# جزء من compose.yaml
services:
  # ... otel-collector ...
  jaeger:
    image: jaegertracing/all-in-one:latest # نسخة Jaeger المتكاملة
    ports:
      - "16686:16686" # واجهة مستخدم Jaeger (UI)
      - "14268:14268" # منفذ استقبال HTTP لـ Jaeger Collector
      - "14250:14250" # منفذ استقبال gRPC لـ Jaeger Collector (يستخدمه otel-collector)
    networks:
      - apex-network
    restart: unless-stopped
3.2. Instrumentation في كل خدمة Node.js:

الغرض: تجهيز تطبيقات NestJS (API و Worker) لإنشاء Spans وجمع بيانات الـ Traces تلقائيًا من العمليات الداخلية والمكتبات المستخدمة.
الخطة التنفيذية:
تثبيت التبعيات: في كل تطبيق NestJS (مثلاً apps/api و apps/worker)، قم بتثبيت حزم OpenTelemetry SDK وحزم الـ Instrumentation للمكتبات التي تستخدمها.
cd apps/api # أو apps/worker
bun add @opentelemetry/sdk-node \
        @opentelemetry/api \
        @opentelemetry/sdk-trace-base \
        @opentelemetry/sdk-trace-node \
        @opentelemetry/exporter-trace-otlp-grpc \
        @opentelemetry/instrumentation-http \
        @opentelemetry/instrumentation-express \
        @opentelemetry/instrumentation-nestjs-core \
        @opentelemetry/instrumentation-pg \
        @opentelemetry/instrumentation-redis-4 \
        @opentelemetry/instrumentation-bullmq \
        @opentelemetry/semantic-conventions
@opentelemetry/sdk-node: SDK الرئيسي لـ Node.js.
@opentelemetry/exporter-trace-otlp-grpc: المصدّر الذي يرسل الـ Traces إلى Otel Collector عبر gRPC (OTLP).
opentelemetry-instrumentation-*: حزم لتمكين الـ Auto-instrumentation للمكتبات الشائعة (HTTP، Express، NestJS، PostgreSQL لـ Drizzle، Redis لـ ioredis، BullMQ).
إنشاء ملف تهيئة OpenTelemetry (opentelemetry.ts): يجب أن يكون هذا الملف هو أول ملف يتم استيراده في التطبيق لضمان تفعيل الـ Instrumentation قبل بدء أي عمليات.
// apps/api/src/opentelemetry.ts (أو apps/worker/src/opentelemetry.ts)
import { NodeSDK } from '@opentelemetry/sdk-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-grpc'; // أو http، حسب تكوين Collector
import { Resource } from '@opentelemetry/resources';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions'; // لتعريف السمات القياسية
// حزم الـ Instrumentation للمكتبات المختلفة:
import { HttpInstrumentation } from '@opentelemetry/instrumentation-http';
import { ExpressInstrumentation } from '@opentelemetry/instrumentation-express';
import { NestInstrumentation } from '@opentelemetry/instrumentation-nestjs-core';
import { PgInstrumentation } from '@opentelemetry/instrumentation-pg'; // لـ node-postgres المستخدم مع Drizzle ORM
import { RedisInstrumentation } from '@opentelemetry/instrumentation-redis-4'; // لـ ioredis المستخدم مع Redis و BullMQ
import { BullMQInstrumentation } from '@opentelemetry/instrumentation-bullmq';
// import { ConsoleSpanExporter } from '@opentelemetry/sdk-trace-base'; // لأغراض تصحيح الأخطاء المحلية (اختياري)

const serviceName = process.env.OTEL_SERVICE_NAME || 'unknown-service'; // اسم فريد لكل خدمة (مثلاً 'api-service', 'worker-service')
const collectorEndpoint = process.env.OTEL_COLLECTOR_ENDPOINT || 'http://otel-collector:4317'; // عنوان Otel Collector (اسم الخدمة في Docker Compose)

const sdk = new NodeSDK({
  resource: new Resource({
    [SemanticResourceAttributes.SERVICE_NAME]: serviceName, // تعريف اسم الخدمة
  }),
  traceExporter: new OTLPTraceExporter({
    url: collectorEndpoint, // عنوان إرسال الـ Traces إلى Otel Collector
  }),
  // traceExporter: new ConsoleSpanExporter(), // يمكن استخدام هذا لتصحيح الأخطاء لرؤية الـ Traces في الـ console
  instrumentations: [ // تفعيل الـ Auto-instrumentation للمكتبات
    new HttpInstrumentation(),
    new ExpressInstrumentation(),
    new NestInstrumentation(),
    new PgInstrumentation(),
    new RedisInstrumentation(),
    new BullMQInstrumentation(),
  ],
});

sdk.start(); // بدء OpenTelemetry SDK

// إغلاق الـ SDK بأمان عند إيقاف تشغيل التطبيق
process.on('SIGTERM', () => {
  sdk.shutdown()
    .then(() => console.log('OpenTelemetry tracing terminated'))
    .catch((error) => console.log('Error terminating OpenTelemetry tracing', error))
    .finally(() => process.exit(0));
});
استيراد ملف التهيئة في main.ts:
// apps/api/src/main.ts (أو apps/worker/src/main.ts)
import './opentelemetry'; // يجب أن يكون السطر الأول في main.ts لتفعيل الـ instrumentation مبكراً
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
// ... (باقي الـ imports)
async function bootstrap() {
  // ...
}
bootstrap();
متغيرات البيئة: يجب تعريف متغيرات البيئة OTEL_SERVICE_NAME و OTEL_COLLECTOR_ENDPOINT في ملف .env لكل تطبيق، أو عبر @apex/config (من Arch-Core-03).
# apps/api/.env
OTEL_SERVICE_NAME=api-service
OTEL_COLLECTOR_ENDPOINT=http://otel-collector:4317

# apps/worker/.env
OTEL_SERVICE_NAME=worker-service
OTEL_COLLECTOR_ENDPOINT=http://otel-collector:4317
3.3. Context Propagation:

الغرض: التأكد من أن trace_id و span_id يتم تمريرهما بشكل صحيح عبر حدود الخدمات والمهام غير المتزامنة لربط جميع الـ Spans في Trace واحد ومتكامل.
الخطة التنفيذية:
traceparent HTTP header:
بفضل HttpInstrumentation و ExpressInstrumentation، يتم تلقائيًا حقن traceparent HTTP header في الطلبات الخارجية الصادرة واستخراجه من الطلبات الواردة. هذا يضمن أن الـ Traces تستمر عبر طلبات HTTP بين الخدمات (مثل Traefik → API Gateway → NestJS API) بشكل سلس.
بيانات المهام في BullMQ:
BullMQInstrumentation (الذي تم تفعيله) يتعامل تلقائيًا مع حقن واستخراج الـ Trace Context (trace_id, span_id) في بيانات مهام BullMQ.
الآلية: عندما يقوم الـ API بإضافة مهمة إلى BullMQ، سيتم تضمين الـ Trace Context في بيانات المهمة (عادة في خصائص مخفية أو meta-data). وعندما يقوم الـ Worker بمعالجة هذه المهمة، سيتم استخراج هذه المعلومات تلقائيًا، وسيتم ربط الـ Spans التي ينشئها الـ Worker بالـ Trace الأصلي الذي بدأ في الـ API. لا يلزم تعديل يدوي للكود هنا إذا كانت الـ Instrumentation مفعلة بشكل صحيح.
3.4. Backend للتخزين (Trace Visualizer):

الغرض: توفير واجهة رسومية لتصور وتحليل الـ Traces المجمعة من Otel Collector.
الخطة التنفيذية:
Jaeger: إذا تم نشر Jaeger (كما هو موضح في 3.1)، يمكن الوصول إلى واجهة المستخدم الخاصة به عبر http://localhost:16686. سيتمكن المستخدمون من البحث عن Traces بناءً على اسم الخدمة، العمليات، أو السمات.
Google Cloud Trace: إذا تم تكوين otel-collector للتصدير إلى Google Cloud Trace (عبر googlecloud exporter)، فستظهر الـ Traces في Google Cloud Console ضمن قسم "Trace" لمشروعك. يتطلب هذا إعداد مصادقة (service account) لـ Otel Collector للوصول إلى Google Cloud.
Tempo (Grafana): يمكن تكوين otel-collector للتصدير إلى Tempo إذا كنت تستخدم Grafana كمنصة مراقبة مركزية.
4. تحقيق الأهداف والتحقق (Achieving Objectives & Verification)
4.1. تتبع كامل (Full Trace):

الخطة التنفيذية:
بدء تشغيل جميع الخدمات في Docker Compose (traefik, api-service, postgres, redis, otel-collector, jaeger).
إرسال طلب GET /products إلى الـ API عبر Traefik (مثلاً curl http://alpha.apex.localhost/products).
الهدف والمتوقع: في Jaeger/Tempo، يتم عرض Trace كامل يوضح تدفق الطلب عبر جميع الخدمات المتأثرة: Traefik → API Gateway → NestJS Controller → Service Layer → Drizzle ORM → PostgreSQL → Redis.
التحقق:
افتح Jaeger UI (http://localhost:16686).
اختر api-service من قائمة الخدمات.
ابحث عن الـ Traces. يجب أن ترى Trace واحدًا يمثل طلب GET /products.
انقر على الـ Trace. يجب أن تظهر شجرة Spans:
Span لـ HTTP GET /products في api-service (من NestJS/Express instrumentation).
Spans فرعية لاستدعاءات Drizzle ORM (مثلاً، pg.query) داخل api-service.
Spans فرعية لاستعلامات PostgreSQL الفعلية (من PgInstrumentation).
Spans لاستدعاءات Redis (إذا كان الـ API يستخدم Redis)، مع تفاصيل الأمر المنفذ.
إذا تم تكوين Traefik بشكل صحيح لتوليد Spans، فقد يظهر Span أب (parent span) لـ Traefik قبل Span الـ API.
4.2. ربط المهام (Job Linking):

الخطة التنفيذية:
بدء تشغيل جميع الخدمات (بما في ذلك worker-service).
إرسال طلب API يقوم بإنشاء مهمة BullMQ (مثلاً، POST /emails الذي يضيف مهمة sendEmail إلى emailQueue).
الهدف والمتوقع: يتم عرض Trace الذي يربط الطلب الأصلي (في الـ API) بتنفيذ المهمة في خدمة Worker، مما يدل على نجاح Context Propagation عبر BullMQ.
التحقق:
في Jaeger UI، ابحث عن الـ Trace الذي بدأ بطلب الـ API (POST /emails).
انقر على الـ Trace. يجب أن ترى:
Span في api-service يشير إلى إضافة مهمة إلى BullMQ (من BullMQInstrumentation).
Span جديد في worker-service يمثل معالجة مهمة BullMQ (مثلاً، BullMQ Process emailQueue:sendEmail). هذا الـ Span يجب أن يكون جزءًا من نفس الـ Trace الأصلي، وليس Trace جديدًا.
أي Spans فرعية يتم إنشاؤها داخل worker-service أثناء معالجة المهمة (مثل استدعاءات خارجية، قراءات من DB) ستكون جزءًا من هذا الـ Trace.
4.3. أداء التأثر (Performance Impact):

الخطة التنفيذية:
قم بإجراء اختبارات أداء (Load tests) على الـ API والـ Worker بدون تفعيل OpenTelemetry (عن طريق إزالة import './opentelemetry' مؤقتًا أو تعطيل البيئة). سجل أوقات الاستجابة واستهلاك الموارد (CPU, Memory).
قم بإجراء نفس اختبارات الأداء مع تفعيل OpenTelemetry.
الهدف والمتوقع: لا يوجد تأثر ملحوظ على أداء الـ API أو Worker بسبب إضافة OpenTelemetry (يجب أن يكون أقل من 5% زيادة في زمن الاستجابة).
التحقق:
مقارنة نتائج اختبارات الأداء (متوسط زمن الاستجابة، P90، P99، استهلاك الموارد).
OpenTelemetry مصمم ليكون منخفض التكلفة (low overhead)، لذا فإن أي تأثير كبير يشير إلى مشكلة في التكوين أو الـ Instrumentation، ويجب مراجعتها.
4.4. تكوين موثق (Documented Configuration):

الخطة التنفيذية:
التأكد من أن ملف opentelemetry.ts في كل خدمة يحتوي على تعليقات واضحة تشرح الغرض من كل جزء من التكوين (مثل serviceName, collectorEndpoint, instrumentations).
إضافة قسم في docs/architecture.md (أو ملف توثيق عام للمشروع) يشرح كيفية عمل التتبع الموزع، وكيفية الوصول إلى Jaeger UI، وكيفية استخدام الـ Traces لتصحيح الأخطاء.
الهدف والمتوقع: ملف opentelemetry.ts موثق بشكل كامل وواضح في كل خدمة، وهناك توثيق عام شامل لكيفية استخدام OpenTelemetry في المشروع.
التحقق:
مراجعة ملف opentelemetry.ts في apps/api و apps/worker للتأكد من وضوح وسهولة فهم التعليقات.
التحقق من وجود التوثيق العام، وشموله لشرح الأهداف، الأدوات، وكيفية استخدام نظام التتبع بفعالية للمطورين الجدد.
5. ملخص وفوائد (Summary and Benefits)
بتطبيق Arch-Core-08 Distributed Tracing (OpenTelemetry) 👁️، سيتم تحقيق ما يلي:

رؤية عميقة للنظام: فهم كامل لتدفق الطلبات عبر الخدمات المتعددة، مما يسهل تحديد المشكلات المعقدة.
تصحيح أخطاء فعال: تحديد سريع ودقيق لمصدر الأخطاء و bottlenecks في الأنظمة الموزعة.
تحسين الأداء: القدرة على تحليل أوقات الاستجابة لكل مكون وتحديد المجالات التي تحتاج إلى تحسين.
مراقبة شاملة: تكامل مع أدوات المراقبة مثل Jaeger/Tempo لتصور البيانات بشكل جذاب.
معيار مفتوح: استخدام OpenTelemetry يضمن المرونة في اختيار backends التتبع في المستقبل دون الحاجة إلى إعادة Instrumentation.
تحسين تجربة المطور: يقلل من الوقت المستغرق في فهم سلوك النظام المعقد وتتبع المشكلات.
هذه الخطة توفر تفاصيل شاملة لهيكل وتنفيذ نظام تتبع موزع قوي وفعال باستخدام OpenTelemetry.