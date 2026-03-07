Arch-Core-06: Connection Pooler (PgBouncer) 🚀
مقدمة:
تُعد اتصالات قاعدة البيانات من أكثر الموارد تكلفة وتشغيلاً في التطبيقات. مع تزايد عدد المستخدمين أو الخدمات التي تتصل بقاعدة البيانات، يمكن أن يصبح الحمل الناتج عن إنشاء وإغلاق هذه الاتصالات مشكلة أداء خطيرة. يهدف هذا المشروع إلى دمج PgBouncer كـ "Connection Pooler" لـ PostgreSQL، مما يقلل من هذا الحمل، ويحسن الاستقرار، ويزيد من قابلية التوسع عن طريق إعادة استخدام الاتصالات بدلاً من إنشاء اتصالات جديدة لكل طلب. هذا سيبني على إعداد Docker Compose Stack من Arch-Core-02.

1. مفهوم Connection Pooling و PgBouncer
مشكلة الاتصالات المباشرة: كل اتصال جديد إلى PostgreSQL يتطلب تخصيص موارد من الخادم (الذاكرة، العمليات)، ومع زيادة عدد الاتصالات، يزداد الحمل على الخادم، مما قد يؤدي إلى تباطؤ الأداء وحتى رفض الاتصالات بـ "too many clients" أخطاء.
الحل - Connection Pooling: Connection Pooler مثل PgBouncer يجلس بين التطبيقات وقاعدة البيانات. بدلاً من أن تفتح التطبيقات اتصالًا جديدًا لكل طلب، فإنها تتصل بـ PgBouncer. يقوم PgBouncer بدوره بالحفاظ على مجموعة (pool) من الاتصالات النشطة إلى قاعدة بيانات PostgreSQL الفعلية وإعادة استخدامها بين الطلبات الواردة من التطبيقات.
فوائد PgBouncer:
تقليل الحمل: يقلل بشكل كبير من استهلاك الموارد على خادم PostgreSQL.
تحسين الاستجابة: يسرّع عملية الحصول على اتصال جديد حيث يتم سحبه من الـ pool بدلاً من إنشائه من الصفر.
زيادة قابلية التوسع: يسمح لعدد كبير من التطبيقات بالاتصال بقاعدة البيانات باستخدام عدد محدود من الاتصالات الفعلية.
عزل الأعطال: يمكن أن يعمل كطبقة عزل إضافية.
pool_mode (أوضاع التجميع): PgBouncer يدعم أوضاع تجميع مختلفة:
session: الاتصال يُخصّص لعميل واحد طوال مدة جلسة العميل.
transaction: الاتصال يُخصّص لعميل واحد لمدة معاملة واحدة (Transaction). بعد انتهاء المعاملة، يُعاد الاتصال إلى الـ pool. (هو الأكثر كفاءة لمعظم تطبيقات الويب).
statement: الاتصال يُخصّص لعميل واحد لمدة استعلام واحد (Statement). (نادراً ما يستخدم).
2. الأدوات المستخدمة (Tools Utilized)
PgBouncer: أداة تجميع الاتصالات.
PostgreSQL: قاعدة البيانات المستهدفة.
Docker Compose: لنشر PgBouncer كخدمة (من Arch-Core-02).
NestJS: لتعديل سلاسل الاتصال في التطبيقات (من Arch-Core-03, Arch-Core-04).
OpenTelemetry Collector (Otel-Collector): (من Arch-Core-02) للمراقبة.
3. استراتيجية التنفيذ والتكوين التفصيلي (Detailed Execution Strategy & Configuration)
3.1. توزيع PgBouncer كـ Sidecar في Docker Compose:

الغرض: ضمان أن PgBouncer يعمل كخدمة مستقلة وقريبة من PostgreSQL داخل نفس بيئة Docker.
الخطة التنفيذية:
تكوين compose.yaml: تم تعريف PgBouncer بالفعل كخدمة في Arch-Core-02 Docker Compose Stack. هذا يضمن أنه يتم تشغيله كحاوية منفصلة.
# جزء من compose.yaml (من Arch-Core-02)
services:
  postgres:
    # ... تكوين Postgres
    networks:
      - apex-network
  pgbouncer:
    image: pgbouncer:latest
    environment:
      DB_HOST: postgres # اسم خدمة Postgres داخل شبكة Docker
      DB_PORT: 5432
      DB_USER: ${POSTGRES_USER:-user}
      DB_PASSWORD: ${POSTGRES_PASSWORD:-password}
      DB_NAME: ${POSTGRES_DB:-mydb}
      PGBOUNCER_PORT: 6432
    ports:
      - "6432:6432" # لربط منفذ pgbouncer بالمضيف
    volumes:
      - ./pgbouncer/pgbouncer.ini:/etc/pgbouncer/pgbouncer.ini:ro # ملف تكوين مخصص
      - ./pgbouncer/userlist.txt:/etc/pgbouncer/userlist.txt:ro # ملف المستخدمين
    depends_on:
      postgres:
        condition: service_healthy # انتظر حتى تكون Postgres جاهزة
    networks:
      - apex-network
    healthcheck:
      test: ["CMD-SHELL", "pgbouncer -v || exit 1"]
      interval: 10s
      timeout: 5s
      retries: 3
    restart: unless-stopped
التأكد من الشبكة: يجب أن تكون كل من pgbouncer و postgres في نفس شبكة Docker (مثلاً apex-network) حتى يتمكن PgBouncer من الوصول إلى PostgreSQL باستخدام اسمه (host: postgres).
3.2. تكوين pgbouncer.ini:

الغرض: تحديد سلوك PgBouncer، بما في ذلك وضع التجميع، حدود الاتصال، وطرق المصادقة.
الخطة التنفيذية:
إنشاء أو تحديث ملف pgbouncer/pgbouncer.ini: (المشار إليه في Arch-Core-02 و Arch-Core-04 الضمني)
# pgbouncer/pgbouncer.ini

[databases]
# تعريف قاعدة البيانات التي سيتصل بها pgbouncer
# mydb = host=<POSTGRES_SERVICE_NAME> port=<POSTGRES_PORT> dbname=<DB_NAME> user=<DB_USER> password=<DB_PASSWORD>
# ملاحظة: يتم استبدال هذه القيم بمتغيرات البيئة بواسطة Docker في وقت التشغيل.
# هنا، اسم خدمة Postgres داخل Docker هو 'postgres'.
mydb = host=postgres port=5432 dbname=${DB_NAME} user=${DB_USER} password=${DB_PASSWORD}

[pgbouncer]
listen_addr = 0.0.0.0            ; عنوان IP الذي سيستمع عليه pgbouncer
listen_port = 6432               ; المنفذ الذي سيستمع عليه pgbouncer
auth_type = md5                  ; نوع المصادقة للعملاء (md5 هي الأكثر شيوعاً)
auth_file = /etc/pgbouncer/userlist.txt ; مسار ملف المستخدمين

pool_mode = transaction          ; وضع التجميع (transaction هو الأكثر كفاءة لتطبيقات الويب)
max_client_conn = 5000           ; أقصى عدد من الاتصالات من التطبيقات إلى pgbouncer
default_pool_size = 100          ; عدد الاتصالات النشطة التي يحتفظ بها pgbouncer لكل DB/user. (حجم الـ pool الفعلي لـ Postgres)
reserve_pool_size = 5            ; عدد الاتصالات الاحتياطية
reserve_pool_timeout = 5         ; المهلة الزمنية لـ reserve pool

server_reset_query = DISCARD ALL ; مهم جداً لـ transaction pooling لتنظيف حالة الاتصال
server_check_delay = 10          ; الفاصل الزمني للتحقق من الاتصالات.
server_lifetime = 3600           ; أقصى عمر لاتصال الخادم (بالثواني).
server_idle_timeout = 600        ; مهلة عدم نشاط اتصال الخادم (بالثواني).

client_connection_timeout = 60   ; مهلة اتصال العميل.
log_connections = 1              ; تسجيل الاتصالات الجديدة.
log_disconnections = 1           ; تسجيل قطع الاتصالات.
log_pooler_errors = 1            ; تسجيل أخطاء الـ pooler.

# Admin Console (اختياري، لأغراض المراقبة والإدارة المباشرة)
admin_users = pgbouncer          ; المستخدمين الذين يمكنهم الوصول إلى وحدة التحكم
stats_users = pgbouncer          ; المستخدمين الذين يمكنهم رؤية الإحصائيات
تكوين pgbouncer/userlist.txt:
"user" "md5PASSWORD_HASH"
(استبدل user و PASSWORD_HASH ببيانات اعتماد المستخدم الذي سيستخدمه التطبيق للاتصال بـ PgBouncer، والذي يجب أن يتطابق مع بيانات اعتماد Postgres. يمكنك توليد md5PASSWORD_HASH باستخدام echo -n "password" | md5sum ثم إضافة md5 قبل الهاش).
ملاحظة أمان: يجب أن يتم توليد الهاش خارجياً وعدم تخزين كلمة المرور plaintext.
3.3. تحديث التطبيقات لسلاسل الاتصال:

الغرض: توجيه جميع تطبيقات Monorepo (API، Worker، إلخ) للاتصال بـ PgBouncer بدلاً من PostgreSQL مباشرة.
الخطة التنفيذية:
تعديل DATABASE_URL: في ملفات .env لكل تطبيق (أو في EnvironmentSchema في @apex/config إذا كنت تستخدمها لتوليد الـ URL)، قم بتغيير جزء host:port من postgres:5432 إلى pgbouncer:6432.
مثال: DATABASE_URL=postgresql://user:password@pgbouncer:6432/mydb
تحديث DbService في NestJS (اعتبارات مهمة لـ RLS):
بما أننا نستخدم pool_mode = transaction، فإن أي متغيرات SET LOCAL (مثل app.current_tenant المستخدمة في Arch-Core-04) لن تستمر عبر حدود المعاملات.
هذا يعني أن DbService في NestJS يجب أن يكون REQUEST-SCOPED لضمان أن كل طلب HTTP يحصل على اتصال خاص به من PgBouncer، ويتم تطبيق SET LOCAL على هذا الاتصال عند بدء الطلب، ويتم إعادته وتنظيفه (بواسطة DISCARD ALL) عند انتهاء الطلب.
تعديل DbService (من Arch-Core-04):
// apps/api/src/db/db.service.ts
import { Injectable, Scope, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { NodePgDatabase, drizzle } from 'drizzle-orm/node-postgres';
import { Client } from 'pg';
import * as schema from '@apex/db/src/schema';
import { ConfigService } from '@nestjs/config';

// يجب أن تكون DbService request-scoped لضمان اتصال خاص لكل طلب
@Injectable({ scope: Scope.REQUEST })
export class DbService implements OnModuleInit, OnModuleDestroy {
  public db: NodePgDatabase<typeof schema>;
  private pgClient: Client;

  constructor(private configService: ConfigService) {
    // إنشاء PgClient لكل طلب
    this.pgClient = new Client({
      connectionString: this.configService.get<string>('DATABASE_URL'), // ستشير إلى pgbouncer:6432
    });
    this.db = drizzle(this.pgClient, { schema });
  }

  async onModuleInit() {
    await this.pgClient.connect(); // افتح الاتصال عند بدء الطلب
  }

  async onModuleDestroy() {
    await this.pgClient.end(); // أغلق الاتصال عند انتهاء الطلب
  }

  async setTenantContext(tenantId: string): Promise<void> {
    // هذا الأمر يُنفذ على الاتصال الخاص بهذا الطلب
    await this.pgClient.query(`SET LOCAL app.current_tenant = '${tenantId}'`);
  }

  async getTenantBySubdomain(subdomain: string) {
    // ... (نفس المنطق من Arch-Core-04) ...
  }
}
التأثير على TenantMiddleware (من Arch-Core-04): الـ Middleware سيقوم بحقن DbService (الـ request-scoped) وتنفيذ setTenantContext عليها. بما أن DbService الآن request-scoped، فالاتصال الذي يتم فتح SET LOCAL عليه هو نفس الاتصال الذي ستستخدمه جميع الـ Repositories/Services الأخرى لنفس الطلب.
3.4. المراقبة (Monitoring):

الغرض: التأكد من أن PgBouncer يعمل بكفاءة، ويوفر الإحصائيات اللازمة لتقييم الأداء.
الخطة التنفيذية:
سجلات PgBouncer:
بما أن PgBouncer يعمل كحاوية Docker، فإنه يقوم بإرسال سجلاته إلى stdout/stderr. يمكن الوصول إليها عبر:
docker compose logs pgbouncer
دمج سجلاته مع otel-collector (إذا لزم الأمر):
لتكامل سجلات PgBouncer مباشرة مع otel-collector (الذي تم إعداده في Arch-Core-02 لاستقبال Traces/Metrics من التطبيقات)، سيتطلب ذلك تكوينًا إضافيًا لـ otel-collector ليتمكن من جمع السجلات من Docker (مثل استخدام filelog receiver أو hostmetrics مع مكونات مخصصة لمسح سجلات Docker). هذا يتجاوز نطاق إعداد Arch-Core-02 الحالي لـ otel-collector الذي يركز على OTLP receiver. للمرحلة الحالية، يمكن الاعتماد على docker compose logs لسهولة الوصول.
واجهة تحكم PgBouncer (SHOW STATS):
يمكن الاتصال بواجهة تحكم PgBouncer الإدارية عبر psql لمشاهدة إحصائيات الـ pool.
الخطوات:
أولاً، تأكد من إعداد admin_users و stats_users في pgbouncer.ini.
من داخل حاوية pgbouncer، أو من المضيف إذا كان المنفذ الإداري مكشوفًا:
# للدخول إلى حاوية pgbouncer
docker exec -it <pgbouncer-container-id> bash

# ثم داخل الحاوية، أو مباشرة من المضيف إذا كانت psql متاحة وتتصل بالمنفذ 6432
psql -h localhost -p 6432 -U pgbouncer -d pgbouncer

# داخل موجه psql
SHOW STATS;           -- إحصائيات عامة
SHOW POOLS;           -- حالة الـ pools الحالية
SHOW CLIENTS;         -- العملاء المتصلون بـ pgbouncer
SHOW SERVERS;         -- اتصالات pgbouncer بالخادم الحقيقي (Postgres)
4. تحقيق الأهداف والتحقق (Achieving Objectives & Verification)
4.1. عدد اتصالات DB ثابت (Stable DB Connections):

الخطة التنفيذية:
بدء تشغيل كامل لـ Docker Compose Stack.
تأكد من أن جميع التطبيقات تتصل بـ pgbouncer:6432.
تنفيذ اختبار تحميل (Load test) على API (مثلاً، باستخدام K6 أو Apache JMeter) يولد 5000 اتصال متزامن أو أكثر، ويستهدف endpoint يقوم بالوصول إلى قاعدة البيانات.
أثناء اختبار التحميل، راقب عدد الاتصالات النشطة في PostgreSQL.
الهدف والمتوقع: التحقق من pg_stat_activity في PostgreSQL يظهر أن عدد الاتصالات النشطة لا يتجاوز default_pool_size (مثال: لا يزيد عن 100).
التحقق:
احصل على container-id لخدمة postgres: docker compose ps -q postgres.
نفذ الأمر التالي لرصد الاتصالات:
docker exec -it <postgres-container-id> psql -U ${POSTGRES_USER} -d ${POSTGRES_DB} -c "SELECT count(*) FROM pg_stat_activity WHERE datname = '${POSTGRES_DB}' AND state = 'active';"
يجب أن تظل القيمة المعادة ثابتة وقريبة من default_pool_size (100 في هذا المثال)، حتى عندما يكون هناك 5000 اتصال من التطبيق إلى PgBouncer.
4.2. لا يوجد أخطاء "too many clients" (No "Too Many Clients" Errors):

الخطة التنفيذية:
نفذ اختبار تحميل مكثف على API.
راقب سجلات PostgreSQL أثناء وبعد اختبار التحميل.
الهدف والمتوقع: سجلات PostgreSQL لا تحتوي على أي أخطاء too many clients.
التحقق:
docker compose logs postgres (أثناء وبعد اختبار التحميل).
البحث عن رسائل مثل FATAL: remaining connection slots are reserved for non-replication superuser connections أو FATAL: too many connections for role "user". يجب ألا تظهر هذه الرسائل.
4.3. وقت استجابة ثابت (Consistent Response Time):

الخطة التنفيذية:
نفذ اختبار تحميل (Load test) مع رصد أوقات الاستجابة للـ API.
الهدف والمتوقع: أوقات استجابة الـ API تظل ثابتة ومستقرة تحت الحمل، ولا تتأثر بشكل كبير بزيادة عدد المستخدمين.
التحقق:
تحليل تقارير أداة اختبار التحميل (K6, JMeter, إلخ).
مراقبة مقاييس مثل متوسط وقت الاستجابة (Average Response Time)، و P90، و P99. يجب أن تظل هذه المقاييس مستقرة وغير متزايدة بشكل حاد مع زيادة الحمل.
4.4. وصول ناجح (Successful Application Access):

الخطة التنفيذية:
بدء تشغيل جميع تطبيقات Monorepo (API، Worker، إلخ).
اختبار الوظائف الأساسية لكل تطبيق التي تتفاعل مع قاعدة البيانات.
الهدف والمتوقع: جميع التطبيقات تتصل بنجاح بقاعدة البيانات عبر PgBouncer وتقوم بعملياتها بشكل طبيعي.
التحقق:
فحص سجلات التطبيقات لعدم وجود أخطاء في الاتصال بقاعدة البيانات.
التحقق من أن جميع الوظائف المتعلقة بالـ DB تعمل بشكل صحيح.
docker compose logs pgbouncer لعرض سجلات PgBouncer، يجب أن تظهر اتصالات نشطة من التطبيقات.
4.5. ملف pgbouncer.ini موثق (Documented pgbouncer.ini):

الخطة التنفيذية:
مراجعة ملف pgbouncer/pgbouncer.ini بعد الانتهاء من التكوين.
الهدف والمتوقع: ملف pgbouncer.ini موثق بشكل كامل مع تعليقات تشرح كل إعداد مهم.
التحقق:
فتح الملف والتأكد من وجود تعليقات واضحة لكل قسم وإعداد، تشرح الغرض والقيمة.
5. ملخص وفوائد (Summary and Benefits)
بتطبيق Arch-Core-06 Connection Pooler (PgBouncer) 🚀، سيتم تحقيق ما يلي:

أداء محسن لقاعدة البيانات: تقليل الحمل على PostgreSQL بشكل كبير، مما يؤدي إلى استجابة أسرع للطلبات.
استقرار أعلى: منع أخطاء "too many clients" وتحسين استقرار قاعدة البيانات تحت الحمل.
قابلية التوسع: دعم عدد أكبر من الاتصالات من التطبيقات دون الحاجة لزيادة موارد قاعدة البيانات بشكل كبير.
تحكم دقيق: القدرة على ضبط إعدادات الـ pool لتناسب احتياجات التطبيق المحددة.
تكامل مع RLS Multi-tenancy: ضمان أن تكوين pool_mode = transaction يعمل بشكل متناغم مع REQUEST-SCOPED DbService و SET LOCAL لتطبيق Row-Level Security بشكل آمن وفعال لكل مستأجر.
هذه الخطة توفر تفاصيل شاملة لهيكل وتنفيذ PgBouncer، مما يضمن إدارة فعالة وموثوقة لاتصالات قاعدة البيانات.