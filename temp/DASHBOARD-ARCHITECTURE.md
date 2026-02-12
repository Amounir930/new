# المخطط المعماري للوحة التحكم والنظام الخلفي (StyleGrove)

## 1. مقدمة

هذا المستند هو المخطط الهندسي لبناء النظام الخلفي (Backend API) ولوحة التحكم (Admin Dashboard) لتطبيق التجارة الإلكترونية StyleGrove. الواجهة الأمامية للقالب قد تم بناؤها بالفعل، وهذا الدليل يشرح كيفية بناء "العقل" الذي سيدير كل شيء من منتجات وعملاء وطلبات ومحتوى.

## 2. المفاهيم الأساسية

- **النظام الخلفي (Backend API):** هو الخادم الذي يتعامل مع منطق العمل ويتصل بقاعدة البيانات. سيكون مسؤولاً عن توفير البيانات للواجهة الأمامية (القالب) ولوحة التحكم.
- **قاعدة البيانات (Database):** هي المكان الذي يتم فيه تخزين جميع البيانات بشكل دائم. الخيارات الموصى بها هي **Firestore** (للتكامل السلس مع Firebase) أو **PostgreSQL** (للقوة والمرونة).
- **لوحة التحكم (Admin Dashboard):** هي واجهة ويب منفصلة (تطبيق React أو Vue آخر) يستخدمها مديرو المتجر للتفاعل مع النظام الخلفي وإدارة المتجر.

## 3. تصميم قاعدة البيانات (Database Schema)

هذا هو الهيكل المقترح لجداول/مجموعات قاعدة البيانات.

---

### أ. المستخدمون والمصادقة

**User (المستخدم)**
- `id` (Primary Key)
- `name` (String)
- `email` (String, Unique)
- `password_hash` (String)
- `role` (Enum: 'customer', 'admin', 'editor')
- `created_at` (Timestamp)

**Profile (الملف الشخصي للعميل)**
- `user_id` (Foreign Key to User)
- `shipping_addresses` (JSON/Array of Objects)
- `billing_addresses` (JSON/Array of Objects)
- `phone_number` (String)
- `wishlist_id` (Foreign Key to Wishlist)

---

### ب. المنتجات والمخزون

**Product (المنتج)**
- `id` (PK)
- `name` (String)
- `slug` (String, Unique) - لروابط URL
- `description` (Text)
- `price` (Decimal)
- `original_price` (Decimal, Optional) - للسعر قبل الخصم
- `sku` (String, Unique) - رمز المنتج
- `stock_quantity` (Integer) - الكمية الإجمالية للمنتج الأساسي
- `category_id` (FK to Category)
- `brand_id` (FK to Brand, Optional)
- `images` (Array of Strings/URLs)
- `videos` (Array of Strings/URLs, Optional)
- `tags` (Array of Strings: 'new-arrival', 'best-seller', etc.)
- `is_active` (Boolean) - لتفعيل أو إخفاء المنتج
- `created_at` (Timestamp)
- `updated_at` (Timestamp)

**ProductVariant (متغير المنتج)**
- `id` (PK)
- `product_id` (FK to Product)
- `attributes` (JSON, e.g., `{"size": "M", "color": "Blue"}`)
- `sku` (String, Unique)
- `stock_quantity` (Integer)
- `price_override` (Decimal, Optional) - إذا كان سعر المتغير مختلفًا

**Category (الفئة)**
- `id` (PK)
- `name` (String)
- `slug` (String, Unique)
- `parent_id` (FK to Category, Optional) - لإنشاء فئات فرعية
- `image_url` (String, Optional)
- `description` (Text, Optional)

**Brand (العلامة التجارية)**
- `id` (PK)
- `name` (String)
- `slug` (String, Unique)
- `logo_url` (String, Optional)

---

### ج. الطلبات والمدفوعات

**Order (الطلب)**
- `id` (PK, e.g., `ORD-12345`)
- `customer_id` (FK to User, Nullable for guests)
- `status` (Enum: 'pending', 'processing', 'shipped', 'delivered', 'cancelled', 'failed')
- `subtotal` (Decimal)
- `shipping_cost` (Decimal)
- `tax` (Decimal)
- `discount_amount` (Decimal)
- `total` (Decimal)
- `shipping_address` (JSON)
- `billing_address` (JSON)
- `payment_method` (String)
- `payment_status` (Enum: 'paid', 'unpaid', 'refunded')
- `tracking_number` (String, Optional)
- `notes` (Text, Optional) - ملاحظات العميل
- `created_at` (Timestamp)

**OrderItem (عنصر في الطلب)**
- `id` (PK)
- `order_id` (FK to Order)
- `product_id` (FK to Product)
- `variant_id` (FK to ProductVariant)
- `quantity` (Integer)
- `price_at_purchase` (Decimal) - سعر الوحدة عند الشراء

---

### د. المحتوى والتسويق

**Review (تقييم المنتج)**
- `id` (PK)
- `customer_id` (FK to User)
- `product_id` (FK to Product)
- `rating` (Integer, 1-5)
- `comment` (Text, Optional)
- `is_approved` (Boolean) - للموافقة على التقييم قبل عرضه
- `created_at` (Timestamp)

**Coupon (كوبون خصم)**
- `id` (PK)
- `code` (String, Unique)
- `type` (Enum: 'percentage', 'fixed_amount')
- `value` (Decimal)
- `start_date` (Timestamp)
- `end_date` (Timestamp)
- `usage_limit` (Integer)
- `is_active` (Boolean)

**BlogPost (مقالة مدونة)**
- `id` (PK)
- `title` (String)
- `slug` (String, Unique)
- `content` (Text)
- `excerpt` (String) - ملخص قصير
- `author_id` (FK to User where role is 'admin' or 'editor')
- `image_url` (String)
- `status` (Enum: 'draft', 'published')
- `created_at` (Timestamp)

**Page (صفحة ثابتة)**
- `id` (PK)
- `title` (String)
- `slug` (String, Unique) - e.g., 'about-us', 'privacy-policy'
- `content` (Text)

**StoreLocation (موقع المتجر)**
- `id` (PK)
- `name` (String)
- `address` (String)
- `phone` (String)
- `hours` (JSON)
- `coordinates` (JSON: `{lat, lng}`)

## 4. واجهات برمجة التطبيقات (API Endpoints) المقترحة

يجب على النظام الخلفي توفير نقاط نهاية (Endpoints) لإدارة كل نموذج بيانات. مثال:

- **Products:**
  - `GET /api/products` (مع فلاتر للبحث والتصنيف)
  - `GET /api/products/{id}`
  - `POST /api/products` (للإنشاء)
  - `PUT /api/products/{id}` (للتحديث)
  - `DELETE /api/products/{id}`
- **Orders:**
  - `GET /api/orders`
  - `GET /api/orders/{id}`
  - `PUT /api/orders/{id}` (لتحديث الحالة، إضافة رقم تتبع، إلخ)
- **Users (Customers):**
  - `GET /api/users`
  - `GET /api/users/{id}`
- **Auth:**
  - `POST /api/auth/login`
  - `POST /api/auth/register`
- **... وهكذا لجميع النماذج الأخرى.**

## 5. وحدات لوحة التحكم (Dashboard Features)

يجب أن تحتوي لوحة التحكم على الأقسام التالية:

1.  **لوحة التحكم الرئيسية (Dashboard):** عرض سريع للإحصائيات (إجمالي المبيعات، الطلبات الجديدة، العملاء الجدد).
2.  **إدارة المنتجات:**
    - عرض، إضافة، تعديل، حذف المنتجات.
    - إدارة الفئات والعلامات التجارية.
    - إدارة المخزون للمنتجات ومتغيراتها.
3.  **إدارة الطلبات:**
    - عرض قائمة بجميع الطلبات مع إمكانية الفلترة.
    - عرض تفاصيل كل طلب.
    - تحديث حالة الطلب (من "قيد المعالجة" إلى "تم الشحن").
    - طباعة الفواتير.
4.  **إدارة العملاء:**
    - عرض قائمة بجميع العملاء.
    - عرض تفاصيل العميل وتاريخ طلباته.
5.  **إدارة المحتوى:**
    - إضافة وتعديل مقالات المدونة.
    - تعديل محتوى الصفحات الثابتة (من نحن، اتصل بنا، إلخ).
6.  **التسويق:**
    - إنشاء وإدارة كوبونات الخصم.
    - إدارة العروض والتخفيضات.
7.  **التقييمات:**
    - عرض جميع تقييمات المنتجات والموافقة عليها أو حذفها.
8.  **الإعدادات:**
    - إعدادات المتجر العامة (الاسم، العملة).
    - إعدادات الشحن والضرائب.
    - ربط بوابات الدفع.

## 6. الخلاصة

هذا المخطط يوفر أساسًا قويًا لبناء نظام خلفي متكامل. الخطوة التالية هي أن يقوم فريق المطورين باختيار التقنيات المناسبة (مثل Node.js + Express + PostgreSQL، أو Firebase) والبدء في تنفيذ نماذج قاعدة البيانات وواجهات برمجة التطبيقات (APIs) بناءً على هذا التصميم. بعد ذلك، يتم بناء واجهة لوحة التحكم التي تستهلك هذه الـ APIs، وأخيرًا يتم تحديث القالب الأمامي (الذي قمنا ببنائه) ليقوم بجلب البيانات من هذه الـ APIs بدلاً من البيانات المؤقتة.
