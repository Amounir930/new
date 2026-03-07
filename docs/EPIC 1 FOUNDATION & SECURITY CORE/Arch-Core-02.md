Arch-Core-02 Docker Compose Stack 🧱
مقدمة:
يهدف هذا المستند إلى توفير تحليل شامل وخطة تنفيذية مفصلة لإعداد بيئة تطوير محلية قوية ومتكاملة باستخدام Docker Compose. ستتضمن هذه البيئة مجموعة من الخدمات الأساسية (قواعد بيانات، وسيط رسائل، تخزين كائنات، محرك بحث، إلخ) التي تتواصل فيما بينها عبر شبكة داخلية ويتم توجيه حركة المرور الخارجية إليها عبر Traefik كـ Reverse Proxy. الهدف هو توفير بيئة متكاملة يمكن للمطورين الاعتماد عليها لجميع احتياجات مشاريعهم.

1. مفهوم Docker Compose و compose.yaml:
Docker Compose هي أداة لتعريف وتشغيل تطبيقات Docker متعددة الحاويات. باستخدام ملف compose.yaml (المعروف سابقًا بـ docker-compose.yml)، يمكنك تكوين جميع خدمات تطبيقك. ثم، باستخدام أمر واحد، يمكنك إنشاء وبدء جميع الخدمات من التكوين الخاص بك. هذا يبسط عملية إدارة البيئات المعقدة ذات الخدمات المتعددة.

البنية العامة لملف compose.yaml:

version: '3.8' # أو '3.9' للإصدارات الأحدث
services:
  خدمة_1:
    # تكوين الخدمة
  خدمة_2:
    # تكوين الخدمة
  # ...
networks:
  apex-network:
    driver: bridge # الشبكة الداخلية للتواصل بين الخدمات
volumes:
  # تعريف الـ Persistent Volumes
2. تحديد الخدمات والغرض منها (Services Identification and Purpose):
لإنشاء بيئة تطوير متكاملة، سيتم إعداد الخدمات التالية:

postgres:16-alpine: قاعدة البيانات الرئيسية. لتخزين بيانات التطبيق العلائقية. الإصدار alpine يوفر صورة Docker صغيرة الحجم.
redis:7-alpine: وسيط الرسائل (BullMQ) والتخزين المؤقت. يُستخدم لـ Job Queues (مثل BullMQ) و Cache لتسريع استجابة التطبيق.
minio:latest: تخزين الكائنات المتوافق مع S3. يوفر حلاً محليًا للتخزين السحابي متوافقًا مع Amazon S3، مثالي لتخزين الملفات والصور.
traefik:v2.10: Reverse Proxy، Load Balancer، وإنهاء SSL. يعمل كبوابة وصول لجميع الخدمات الخارجية، يقوم بتوجيه الطلبات إلى الخدمات المناسبة، ويدعم شهادات SSL.
mailpit/mailpit:latest: خادم SMTP وهمي لتطوير البريد الإلكتروني. يسمح باختبار إرسال رسائل البريد الإلكتروني محليًا دون إرسالها فعليًا، مع واجهة مستخدم لمشاهدة الرسائل.
pgbouncer:latest: Connection Pooler لقاعدة البيانات. يساعد في تحسين أداء قاعدة بيانات PostgreSQL عن طريق إدارة تجمعات الاتصال (connection pools)، مما يقلل العبء على PostgreSQL.
meilisearch/meilisearch:latest: محرك بحث. يوفر إمكانات بحث سريعة وذات صلة لتطبيقك، مع واجهة RESTful API سهلة الاستخدام.
darthsim/imgproxy:latest: محسن الصور (Image Optimizer). خدمة لإنشاء صور مصغرة (thumbnails)، تحويل وتعديل الصور ديناميكيًا، مما يحسن من أداء تحميل الصور.
otel/opentelemetry-collector-contrib:0.95.0: لتجميع الـ Traces (OpenTelemetry Collector). أداة لجمع وتصدير الـ traces و metrics و logs من التطبيقات لمراقبة الأداء وتتبع الأخطاء.
3. التكوين التفصيلي لكل خدمة في compose.yaml:
سنبني ملف compose.yaml خطوة بخطوة، مع شرح كل جزء.

version: '3.8'

services:

  # 1. Traefik - Reverse Proxy & Load Balancer
  traefik:
    image: traefik:v2.10
    command:
      - --api.dashboard=true # تفعيل لوحة التحكم
      - --api.insecure=true  # للوصول إلى لوحة التحكم بدون SSL في التطوير
      - --providers.docker=true # تفعيل Docker provider
      - --providers.docker.exposedbydefault=false # عدم كشف الخدمات تلقائيًا
      - --entrypoints.web.address=:80 # نقطة الدخول HTTP
      - --entrypoints.websecure.address=:443 # نقطة الدخول HTTPS (إذا لزم الأمر)
      # - --certificatesresolvers.myresolver.acme.tlschallenge=true # لتفعيل Let's Encrypt
      # - --certificatesresolvers.myresolver.acme.email=your@email.com
      # - --certificatesresolvers.myresolver.acme.storage=/letsencrypt/acme.json
    ports:
      - "80:80"
      - "443:443" # إذا تم استخدام HTTPS
      - "8080:8080" # لوحة تحكم Traefik
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock:ro # للسماح لـ Traefik بقراءة تكوينات Docker
      # - ./letsencrypt:/letsencrypt # لـ Let's Encrypt
    networks:
      - apex-network
    labels:
      - "traefik.enable=true"
      # توجيه الطلبات للوحة تحكم Traefik نفسها
      - "traefik.http.routers.traefik-dashboard.rule=Host(`traefik.localhost`)"
      - "traefik.http.routers.traefik-dashboard.service=api@internal"
      - "traefik.http.routers.traefik-dashboard.entrypoints=web"
    healthcheck:
      test: ["CMD", "traefik", "healthcheck", "--ping"]
      interval: 10s
      timeout: 5s
      retries: 3
    restart: unless-stopped

  # 2. Postgres Database
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: ${POSTGRES_DB:-mydb}
      POSTGRES_USER: ${POSTGRES_USER:-user}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-password}
    volumes:
      - pgdata:/var/lib/postgresql/data # لضمان استمرارية البيانات
    networks:
      - apex-network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U $$POSTGRES_USER -d $$POSTGRES_DB"]
      interval: 10s
      timeout: 5s
      retries: 5
      start_period: 10s # انتظر 10 ثواني قبل بدء الفحص
    restart: unless-stopped

  # 3. PgBouncer - PostgreSQL Connection Pooler
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
      test: ["CMD-SHELL", "pgbouncer -v || exit 1"] # تحقق بسيط من تشغيل pgbouncer
      interval: 10s
      timeout: 5s
      retries: 3
    restart: unless-stopped

  # 4. Redis - Cache & Message Broker
  redis:
    image: redis:7-alpine
    command: redis-server --appendonly yes # تفعيل AOF لضمان استمرارية البيانات
    volumes:
      - redisdata:/data # لضمان استمرارية البيانات
    networks:
      - apex-network
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 3
    restart: unless-stopped

  # 5. MinIO - S3 Compatible Object Storage
  minio:
    image: minio/minio:latest
    command: server /data --console-address ":9001" # تشغيل MinIO وتفعيل Console
    environment:
      MINIO_ROOT_USER: ${MINIO_ROOT_USER:-minioadmin}
      MINIO_ROOT_PASSWORD: ${MINIO_ROOT_PASSWORD:-minioadmin}
    ports:
      - "9000:9000" # API Port
      - "9001:9001" # Console Port
    volumes:
      - miniodata:/data # لضمان استمرارية البيانات
    networks:
      - apex-network
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:9000/minio/health/live"]
      interval: 30s
      timeout: 20s
      retries: 3
      start_period: 10s
    restart: unless-stopped

  # 6. Mailpit - Development Email Server
  mailpit:
    image: mailpit/mailpit:latest
    ports:
      - "1025:1025" # SMTP Port
      - "8025:8025" # Web UI Port
    networks:
      - apex-network
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.mailpit.rule=Host(`mailpit.localhost`)"
      - "traefik.http.routers.mailpit.entrypoints=web"
      - "traefik.http.services.mailpit.loadbalancer.server.port=8025" # توجيه لـ Web UI
    healthcheck:
      test: ["CMD-SHELL", "curl -f http://localhost:8025 || exit 1"]
      interval: 10s
      timeout: 5s
      retries: 3
    restart: unless-stopped

  # 7. Meilisearch - Search Engine
  meilisearch:
    image: meilisearch/meilisearch:latest
    environment:
      MEILI_MASTER_KEY: ${MEILI_MASTER_KEY:-masterKey}
      MEILI_HTTP_PAYLOAD_SIZE_LIMIT: "100000000" # مثال لزيادة حجم الحمولة
    ports:
      - "7700:7700"
    volumes:
      - meilidata:/meili_data # لضمان استمرارية البيانات
    networks:
      - apex-network
    healthcheck:
      test: ["CMD-SHELL", "curl -f http://localhost:7700/health || exit 1"]
      interval: 10s
      timeout: 5s
      retries: 3
      start_period: 5s
    restart: unless-stopped

  # 8. Imgproxy - Image Optimization
  imgproxy:
    image: darthsim/imgproxy:latest
    environment:
      IMGPROXY_BIND: 0.0.0.0:8080 # ربط على جميع الواجهات
      IMGPROXY_KEY: ${IMGPROXY_KEY:-imgproxy-key} # مفتاح توقيع URL
      IMGPROXY_SALT: ${IMGPROXY_SALT:-imgproxy-salt} # ملح توقيع URL
      # IMGPROXY_BASE_URL: "http://localhost:8080" # Base URL للخدمة
      # IMGPROXY_DEFAULT_URL_OPTIONS: "quality:80/format:webp" # خيارات افتراضية
    ports:
      - "8080:8080" # منفذ الخدمة
    networks:
      - apex-network
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.imgproxy.rule=Host(`imgproxy.localhost`)"
      - "traefik.http.routers.imgproxy.entrypoints=web"
      - "traefik.http.services.imgproxy.loadbalancer.server.port=8080"
    healthcheck:
      test: ["CMD-SHELL", "curl -f http://localhost:8080/health || exit 1"]
      interval: 10s
      timeout: 5s
      retries: 3
      start_period: 5s
    restart: unless-stopped

  # 9. OpenTelemetry Collector (Contrib)
  otel-collector:
    image: otel/opentelemetry-collector-contrib:0.95.0
    command: ["--config=/etc/otel-collector-config.yaml"] # تحديد ملف التكوين
    ports:
      - "4317:4317" # gRPC for OTLP
      - "4318:4318" # HTTP for OTLP
      - "13133:13133" # health_check extension
    volumes:
      - ./otel-collector/config.yaml:/etc/otel-collector-config.yaml:ro # ملف التكوين
    networks:
      - apex-network
    healthcheck:
      test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://localhost:13133"]
      interval: 10s
      timeout: 5s
      retries: 3
      start_period: 5s
    restart: unless-stopped

networks:
  apex-network:
    driver: bridge # شبكة داخلية لجميع الخدمات

volumes:
  pgdata: # Persistent volume لـ Postgres
  redisdata: # Persistent volume لـ Redis
  miniodata: # Persistent volume لـ MinIO
  meilidata: # Persistent volume لـ Meilisearch
  # letsencrypt: # لتخزين شهادات Let's Encrypt (إذا تم استخدامها)
شرح مفصل للتكوين لكل خدمة:

image: يحدد صورة Docker واسم الإصدار. استخدام إصدارات محددة (مثلاً 16-alpine, v2.10) بدلاً من latest يضمن الاستقرار وقابلية التكرار.
ports: يعيّن المنافذ من حاوية Docker إلى المضيف. host_port:container_port.
volumes:
named_volume:/path/in/container: هذا يضمن استمرارية البيانات. البيانات لا تضيع عند إزالة أو إعادة إنشاء الحاوية.
./host_path:/path/in/container:ro: لربط ملفات التكوين من المضيف (read-only) إلى الحاوية.
environment: يحدد متغيرات البيئة داخل الحاوية. ${VARIABLE:-default_value} يسمح بتحديد قيمة افتراضية إذا لم يتم تعريف متغير البيئة في ملف .env الخاص بالمشروع.
networks: يربط الخدمة بالشبكة الداخلية apex-network للسماح بالاتصال بين الخدمات.
restart: unless-stopped: يضمن إعادة تشغيل الحاوية تلقائيًا إذا توقفت لأي سبب، إلا إذا تم إيقافها يدويًا.
labels: تستخدمها Traefik لاكتشاف وتكوين الـ Routers والـ Services تلقائيًا للخدمات التي تريد كشفها للعالم الخارجي.
traefik.enable=true: يخبر Traefik أن هذه الخدمة يجب أن يتم إدارتها.
traefik.http.routers.service_name.rule=Host(\subdomain.localhost`): يحدد القاعدة التي بموجبها ستقومTraefikبتوجيه الطلبات (مثلاً، إذا كان اسم النطاقmailpit.localhost`).
traefik.http.routers.service_name.entrypoints=web: يحدد نقطة الدخول (المنفذ) التي يجب أن يستقبل Traefik الطلبات عليها لهذه الخدمة.
traefik.http.services.service_name.loadbalancer.server.port=container_port: يخبر Traefik بالمنفذ داخل الحاوية الذي يجب أن يوجه إليه الطلبات.
healthcheck:
test: الأمر الذي يتم تنفيذه للتحقق من صحة الخدمة.
interval: المدة الزمنية بين كل فحص صحي وآخر.
timeout: المدة القصوى التي يسمح بها للفحص للاستجابة.
retries: عدد مرات الفشل المتتالية قبل اعتبار الخدمة غير صحية.
start_period: مدة الانتظار بعد بدء تشغيل الحاوية قبل بدء الفحوصات الصحية (لإعطاء الخدمة وقتًا للبدء).
أمثلة على أوامر Health Check:
postgres: pg_isready -U $$POSTGRES_USER -d $$POSTGRES_DB تتحقق مما إذا كانت قاعدة البيانات جاهزة لاستقبال الاتصالات. (نستخدم $$ لتهريب متغيرات البيئة من docker compose).
redis: redis-cli ping تتحقق من أن Redis يستجيب.
minio: curl -f http://localhost:9000/minio/health/live تتحقق من نقطة نهاية الصحة الخاصة بـ MinIO.
imgproxy: curl -f http://localhost:8080/health تتحقق من نقطة نهاية الصحة الخاصة بـ Imgproxy.
otel-collector: wget --no-verbose --tries=1 --spider http://localhost:13133 تتحقق من نقطة نهاية الصحة الخاصة بـ OpenTelemetry.
4. شبكة Docker (apex-network):
التعريف: يتم تعريف شبكة تسمى apex-network في قسم networks في compose.yaml.
الغرض: توفر هذه الشبكة عزلًا للخدمات وتسمح لها بالتواصل مع بعضها البعض باستخدام أسمائها (على سبيل المثال، يمكن لخدمة التطبيق الاتصال بـ postgres بدلاً من عنوان IP). هذا يبسط التكوين ويجعل البيئة أكثر مرونة.
driver: bridge: هو النوع الافتراضي والأكثر شيوعًا لشبكات Docker، وهو مناسب للاتصالات الداخلية بين الحاويات على نفس المضيف.
5. تكوينات إضافية (Additional Configurations):
./pgbouncer/: ستحتاج إلى إنشاء مجلد pgbouncer في جذر مشروعك، يحتوي على:
pgbouncer.ini: ملف تكوين PgBouncer.
userlist.txt: ملف يحتوي على بيانات اعتماد المستخدمين المسموح لهم بالاتصال عبر PgBouncer.
مثال لـ pgbouncer/pgbouncer.ini:
[databases]
mydb = host=postgres port=5432 dbname=mydb user=${DB_USER} password=${DB_PASSWORD}

[pgbouncer]
listen_addr = 0.0.0.0
listen_port = 6432
auth_type = md5
auth_file = /etc/pgbouncer/userlist.txt
pool_mode = session
server_reset_query = DISCARD ALL
max_client_conn = 100
default_pool_size = 20
مثال لـ pgbouncer/userlist.txt:
"user" "md5PASSWORD_HASH"
(يمكنك توليد md5PASSWORD_HASH باستخدام echo -n "password" | md5sum ثم إضافة md5 قبل الهاش).
./otel-collector/config.yaml: ستحتاج إلى إنشاء مجلد otel-collector في جذر مشروعك، يحتوي على:
config.yaml: ملف تكوين OpenTelemetry Collector.
مثال لـ otel-collector/config.yaml:
receivers:
  otlp:
    protocols:
      grpc:
      http:
processors:
  batch:
    send_batch_size: 1000
    timeout: 10s
exporters:
  logging:
    verbosity: detailed
  # يمكن إضافة مصدّر آخر مثل Jaeger, Prometheus, OTLP إلى خدمة أخرى
  # otlp:
  #   endpoint: "some-backend:4317"
  #   tls:
  #     insecure: true
service:
  pipelines:
    traces:
      receivers: [otlp]
      processors: [batch]
      exporters: [logging]
    metrics:
      receivers: [otlp]
      processors: [batch]
      exporters: [logging]
    logs:
      receivers: [otlp]
      processors: [batch]
      exporters: [logging]
  extensions: [health_check]
extensions:
  health_check:
ملف .env في جذر المشروع: يجب إنشاء ملف .env لتحديد متغيرات البيئة الحساسة أو القابلة للتغيير، والتي سيتم استخدامها في compose.yaml.
POSTGRES_DB=mydb
POSTGRES_USER=user
POSTGRES_PASSWORD=password
MINIO_ROOT_USER=minioadmin
MINIO_ROOT_PASSWORD=minioadmin123
MEILI_MASTER_KEY=mySuperSecretMeiliKey
IMGPROXY_KEY=my-imgproxy-secret-key
IMGPROXY_SALT=my-imgproxy-secret-salt
ملاحظة أمان: لا تقم برفع ملف .env إلى Git.
6. الخطة التنفيذية وتحقيق الأهداف (Execution Plan and Objective Achievement):
6.1. إطلاق ناجح (Successful Launch):

الخطة التنفيذية:
إنشاء ملف compose.yaml وملف .env والمجلدات الفرعية (مثل pgbouncer, otel-collector) كما هو موضح أعلاه في جذر مشروعك.
التأكد من أن Docker Desktop (أو محرك Docker) قيد التشغيل.
فتح الطرفية (terminal) في جذر المشروع.
تشغيل أمر docker compose up -d.
الهدف والمتوقع: docker compose up -d يتم تنفيذه بدون أخطاء، وجميع الحاويات تبدأ في الخلفية.
التحقق:
مراجعة مخرجات الطرفية للتأكد من عدم وجود رسائل خطأ.
التأكد من أن جميع الخدمات بدأت عن طريق الأمر:
docker compose ps
يجب أن تظهر جميع الخدمات بحالة running.
6.2. حالة صحية (Healthy Status):

الخطة التنفيذية:
بعد إطلاق الخدمات، انتظر بضع لحظات حتى تقوم الفحوصات الصحية بعملها.
تشغيل الأمر docker compose ps مرة أخرى.
الهدف والمتوقع: docker compose ps يعرض جميع الخدمات بحالة healthy في عمود STATUS.
التحقق:
التأكد من أن عمود STATUS لكل خدمة يعرض Up (healthy). إذا كانت أي خدمة تعرض Up (unhealthy) أو Up (health: starting) لفترة طويلة، فهذا يعني وجود مشكلة في تكوين الخدمة أو فحص الصحة الخاص بها.
6.3. اتصال Traefik (Traefik Connectivity):

الخطة التنفيذية:
بعد تأكد من تشغيل Traefik وحالته healthy.
للوصول إلى لوحة تحكم Traefik، تأكد من إضافة 127.0.0.1 traefik.localhost إلى ملف hosts الخاص بك (عادةً /etc/hosts على Linux/macOS أو C:\Windows\System32\drivers\etc\hosts على Windows).
افتح المتصفح وانتقل إلى http://traefik.localhost:8080/dashboard/.
الهدف والمتوقع: لوحة تحكم Traefik تعرض جميع الـ Routers والـ Services نشطة وصحية.
التحقق:
يجب أن تكون قادرًا على رؤية واجهة مستخدم Traefik.
في لوحة التحكم، انتقل إلى قسم HTTP -> Routers و HTTP -> Services. يجب أن تشاهد traefik-dashboard و mailpit و imgproxy و أي خدمات أخرى تم تكوين labels لها. يجب أن تظهر جميعها بالحالة (OK) أو (Healthy).
جرّب الوصول إلى Mailpit عبر http://mailpit.localhost:8025/ (بعد إضافة 127.0.0.1 mailpit.localhost إلى ملف hosts).
6.4. وصول Imgproxy (Imgproxy Accessibility):

الخطة التنفيذية:
التأكد من تشغيل خدمة imgproxy وأن حالتها healthy.
تنفيذ الأمر curl للتحقق من نقطة نهاية الصحة الخاصة بها.
الهدف والمتوقع: curl -s http://localhost:8080/health يعود بـ OK. (إذا كنت تستخدم Traefik، يمكن اختبارها عبر http://imgproxy.localhost/health بعد إضافة 127.0.0.1 imgproxy.localhost لملف hosts).
التحقق:
تشغيل الأمر:
curl -s http://localhost:8080/health
# أو إذا كانت موجهة عبر Traefik
curl -s http://imgproxy.localhost/health
يجب أن تكون النتيجة هي OK بدون أي رسائل خطأ.
6.5. تسجيل Otel Collector (Otel Collector Logging):

الخطة التنفيذية:
التأكد من تشغيل خدمة otel-collector وأن حالتها healthy.
عرض سجلات خدمة otel-collector.
الهدف والمتوقع: سجلات otel-collector (يمكن عرضها عبر docker compose logs otel-collector) تظهر أنها تستقبل البيانات بدون أخطاء.
التحقق:
تشغيل الأمر:
docker compose logs otel-collector
البحث عن رسائل في السجلات تشير إلى استقبال traces أو metrics أو logs. إذا تم تكوينه بشكل صحيح، قد ترى رسائل مثل Exporter "logging" has started أو Data is being received by the collector. في بيئة اختبار، قد لا ترى بيانات فعلية إلا بعد أن تبدأ التطبيقات الأخرى في إرسالها. التأكد من عدم وجود أخطاء في تهيئة otel-collector هو الهدف الرئيسي.
6.6. ملف Compose موثق (Compose File Documentation):

الخطة التنفيذية:
مراجعة ملف compose.yaml بعد الانتهاء من جميع التكوينات.
إضافة تعليقات توضيحية لكل جزء رئيسي في الملف.
شرح الغرض من كل خدمة، وماذا يفعل كل إعداد مهم (مثل volumes، environment، labels).
الهدف والمتوقع: ملف compose.yaml موثق وشامل لجميع الخدمات المطلوبة، مما يجعله سهل الفهم والصيانة. [100% COMPLETED]
التحقق:
فتح ملف compose.yaml ومراجعة التعليقات. هل هي واضحة؟ هل تشرح كل شيء ضروري؟ هل يمكن لشخص جديد في المشروع فهم الغرض من كل إعداد؟
7. نصائح إضافية:
بيئة التطوير (.env): احتفظ بملف .env منفصل عن التحكم في الإصدار (Git) لبيانات الاعتماد الحساسة.
إدارة DNS (ملف hosts): لتسهيل الوصول إلى الخدمات عبر Traefik بأسماء نطاقات مخصصة (مثل mailpit.localhost، imgproxy.localhost)، قم بتعديل ملف hosts الخاص بك.
تنظيف البيئة: عند الانتهاء من العمل أو لإعادة تعيين البيئة، استخدم:
docker compose down # لإيقاف وإزالة الحاويات والشبكات
docker compose down -v # لإزالة الحاويات والشبكات و الـ volumes (حذف البيانات)
تحديث الصور: للتأكد من استخدام أحدث الصور المحددة، قم بتشغيل:
docker compose pull
ثم أعد تشغيل الخدمات.