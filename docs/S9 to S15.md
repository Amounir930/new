# 🛡️ Apex v2: Advanced Security Roadmap (S9-S15)

تفكيك وتحليل الطبقات الأمنية المتقدمة وفقاً لمعايير Apex v2 الثلاثية (تخطيط، تنفيذ، تحقق).

---

### **S9: Supply Chain Security (تأمين سلاسل الإمداد)**
#### **1. التنفيذ الفعلي (Actual Implementation)**
*   **المحلي:** تم دمج `bun audit` في الـ `pre-commit-check.sh`. لن يسمح الـ Git بعمل Commit إذا وجدت ثغرات أمنية في المكتبات.
*   **المستمر:** تفعيل Dependabot لمراقبة الثغرات.
*   **الـ CI:** توليد SBOM آلي لكل بناء (Build).

---

### **S10: Secret Detection (كشف التسريبات)**
#### **1. التنفيذ الفعلي (Actual Implementation)**
*   **الفحص الجراحي:** تم تطوير سكربت `scripts/pre-commit-check.sh` ليقوم بفحص دقيق للملفات المجهزة (Staged) بحثاً عن أنماط الأسرار حتى في غياب Docker.
*   **الحماية المركزية:** دمج Gitleaks في GitHub Actions كبوابة فحص نهائية.

---

### **S11: Bot Protection (حماية البوتات)**
#### **1. التنفيذ الفعلي (Actual Implementation)**
*   **برمجية الحماية:** تم إنشاء `BotProtectionMiddleware` في حزمة `@apex/middleware`.
*   **القواعد:** حظر الـ User-Agents المشبوهة (Curl, Python, Go) ومنع الوصول للملفات الحساسة مثل `.env`.
*   **الاستثناءات:** استثناء روابط الـ Health Check لضمان استقرار الـ Load Balancer.

---

### **S12: DDoS Mitigation (تأمين التوافر)**
#### **1. التنفيذ الفعلي (Actual Implementation)**
*   **الخوارزمية:** استخدام **Sliding Window Log** عبر Redis Sorted Sets لضمان دقة 100% في توزيع الحمل ومنع الـ Burst Attacks.
*   **الحظر الآلي:** إذا تجاوز مستخدم حدود الـ DDoS (5 أضعاف المسموح)، يتم حظر الـ IP الخاص به فوراً لمدة ساعة كاملة.

---

### **S13: Penetration Testing (الاختبار الاختراقي الآلي)**
#### **1. التنفيذ الفعلي (Actual Implementation)**
*   **السكربت المحلي:** إنشاء `scripts/security-grep-scan.sh` لفحص ثغرات RCE, XSS, JWT 'none' محلياً.
*   **الـ DAST:** تفعيل فحص OWASP ZAP في مسار الـ CI.

---

### **S14: Fraud Detection (كشف الاحتيال)**
#### **1. التنفيذ الفعلي (Actual Implementation)**
*   **التبصيم:** إنشاء `FingerprintMiddleware` لتوليد بصمة رقمية مشفرة (SHA-256) لكل طلب.
*   **التقييم:** خدمة `FraudScoringService` تقوم بتقييم المخاطر بناءً على سرعة الطلبات وإشارات الموقع الجغرافي.

---

### **S15: Active Defense (الدفاع النشط)**
#### **1. التنفيذ الفعلي (Actual Implementation)**
*   **الرؤوس المخادعة:** `ActiveDefenseMiddleware` يرسل إشارات مضللة (Server: Apache, X-Powered-By: PHP).
*   **الفخاخ:** أي محاولة للوصول إلى `/wp-admin` أو `/.env` تؤدي لحظر الـ IP المعني لمدة 24 ساعة فوراً.

---

### **⚠️ Deployment Nuances (ملاحظات النشر الهامة)**

1.  **Redis هي القلب:** جميع بروتوكولات S12, S14, S15 تعتمد كلياً على **Redis**. في بيئة الإنتاج، إذا تعطل Redis، سيتوقف النظام عن العمل (Fail-Closed) حمايةً للأمن.
2.  **رؤوس الوكيل (Proxy Headers):** يجب التأكد من ضبط Traefik لإرسال رؤوس `X-Forwarded-For` الأصلية، وإلا سيقوم النظام بحظر عنوان الـ IP الخاص بالـ Gateway بالخطأ.
3.  **ترتيب الـ Middleware:** يجب دائماً وضع `ActiveDefenseMiddleware` و `FingerprintMiddleware` في مقدمة السلسلة في `AppModule` لضمان رصد الهجمات قبل استهلاك موارد النظام.
