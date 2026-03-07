تحليل تفصيلي و خطة تنفيذ مشروع Arch-Core-01 Turborepo Monorepo Setup 🧱
مقدمة:
يهدف هذا المستند إلى تقديم تحليل شامل وخطة تنفيذية مفصلة لإعداد Monorepo باستخدام Turborepo كـ "Build System" و Bun كمدير حزم ووقت تشغيل أساسي، مع التركيز على جودة الكود والأتمتة عبر Git Hooks (Husky). الهدف هو بناء بيئة تطوير موحدة، سريعة، وفعالة لمجموعة من التطبيقات والخدمات المشتركة.

1. هيكل المشروع الأساسي (Project Structure - Arch-Core-01 Monorepo)
1.1. مفهوم Monorepo:
Monorepo هو مستودع Git واحد يحتوي على كود مصدر للعديد من المشاريع المتميزة (التطبيقات، المكتبات، الخدمات) التي قد تكون ذات صلة ببعضها البعض. يوفر هذا النهج فوائد مثل سهولة مشاركة الكود، إدارة تبعيات موحدة، وتطبيق سياسات بناء واختبار موحدة عبر المشاريع.

1.2. مكونات الهيكل الأساسية:
سيتم تنظيم Monorepo في مجلدات رئيسية، كل منها يمثل نوعًا معينًا من المشاريع:

apps/: يحتوي على التطبيقات الأمامية (Front-end applications) مثل Next.js، React، أو تطبيقات الخلفية (Back-end applications) مثل Express.js. كل مجلد فرعي هنا يمثل تطبيقاً مستقلاً قابلاً للنشر.
packages/: يحتوي على المكتبات المشتركة (shared libraries) أو المكونات (components) أو الأدوات المساعدة (utilities) التي يمكن استخدامها من قبل تطبيقات متعددة داخل الـ Monorepo. هذه الـ packages عادة ما تكون قابلة لإعادة الاستخدام.
services/: يمكن أن يحتوي على خدمات خلفية محددة (microservices) أو وظائف بدون خادم (serverless functions) أو أي خدمة مستقلة أخرى.
config/: يحتوي على ملفات التكوين المشتركة (shared configurations) مثل إعدادات eslint، prettier، tsconfig.json، jest.config.js، لضمان الاتساق عبر جميع المشاريع.
tools/ (اختياري): قد يحتوي على أدوات مساعدة خاصة بالـ Monorepo أو سكربتات أتمتة.
1.3. ملف root package.json وتكوينه:
هذا الملف هو قلب الـ Monorepo في الجذر. سيحتوي على التبعيات المشتركة التي تحتاجها جميع المشاريع، وسيعرف الـ workspaces لـ Bun و npm (إن وجد) لتحديد مكان مشاريع الـ Monorepo.

مثال على package.json في الجذر:

{
  "name": "arch-core-01",
  "version": "1.0.0",
  "private": true,
  "description": "Monorepo for Arch-Core-01 projects",
  "scripts": {
    "build": "bun turbo run build",
    "test": "bun turbo run test",
    "lint": "bun turbo run lint",
    "dev": "bun turbo run dev",
    "format": "bun turbo run format",
    "clean": "bun turbo run clean",
    "pre-commit": "lint-staged"
  },
  "workspaces": [
    "apps/*",
    "packages/*",
    "services/*",
    "config/*"
  ],
  "devDependencies": {
    "bun": "^1.0.0",
    "eslint": "^8.0.0",
    "husky": "^9.0.0",
    "lint-staged": "^15.0.0",
    "prettier": "^3.0.0",
    "turbo": "^2.0.0",
    "dotenv-cli": "^7.0.0"
  }
}
2. استراتيجية التهيئة والتكوين (Initialization and Configuration Strategy)
2.1. تهيئة Monorepo:

الخطوة 1: إنشاء مجلد المشروع:
mkdir arch-core-01 && cd arch-core-01
الخطوة 2: تهيئة ملف package.json في الجذر:
bun init
(قم بتعديل الملف يدوياً ليطابق المثال أعلاه مع إضافة private: true و workspaces).
الخطوة 3: إنشاء المجلدات الرئيسية للـ workspaces:
mkdir apps packages services config
الخطوة 4: تثبيت Turborepo كـ devDependency في الجذر:
bun add turbo --dev
الخطوة 5: إنشاء ملف turbo.json في الجذر (سيتم تفصيله لاحقاً).
الخطوة 6: إنشاء ملف .gitignore في الجذر:
node_modules
.DS_Store
.env
dist
build
.turbo
2.2. مدير الحزم ووقت التشغيل (Bun ⚡):

لماذا Bun؟
السرعة الفائقة: Bun معروف بسرعته العالية في تثبيت الحزم، تشغيل السكربتات، وأداء الـ runtime مقارنة بـ npm و Yarn و Node.js. هذا يقلل بشكل كبير من أوقات البناء والاختبار في Monorepo.
كل شيء في واحد: يعمل Bun كمدير حزم (package manager)، وقت تشغيل (runtime)، حزمة بناء (bundler)، ومختبر (test runner)، مما يبسط سلسلة الأدوات (toolchain).
توافق Node.js: يتوافق Bun بشكل كبير مع واجهات برمجة تطبيقات Node.js (APIs) الحالية ومعظم حزم npm، مما يسهل الانتقال.
الخطة التنفيذية لاستخدام Bun:
التثبيت (الإصدار 1.0.x+): التأكد من تثبيت Bun على جميع بيئات التطوير والخوادم.
curl -fsSL https://bun.sh/install | bash # أو عبر npm/Homebrew
bun --version # التأكد من الإصدار 1.0.x أو أحدث
مدير الحزم الافتراضي: سيتم استخدام bun لجميع عمليات إدارة الحزم (تثبيت، إضافة، إزالة) بدلاً من npm أو yarn.
تثبيت التبعيات: bun install
إضافة حزمة: bun add [package-name]
إزالة حزمة: bun remove [package-name]
تشغيل سكربت: bun [script-name] أو bun run [script-name]
وقت التشغيل الافتراضي: سيتم تشغيل جميع التطبيقات والخدمات داخل Monorepo باستخدام bun كـ runtime.
2.3. تكوين Turborepo (📦 Build System):
Turborepo هو نظام بناء عالي الأداء محسّن لـ Monorepos. يتيح تشغيل المهام المتوازية، ويستخدم نظام Caching ذكي لتسريع عمليات البناء والاختبار والـ linting.

ملف turbo.json:
سيتم إنشاء ملف turbo.json في جذر المشروع لتكوين Turborepo. هذا الملف يحدد الـ pipelines (سلاسل المهام) وكيفية التعامل مع الـ Caching.
مثال على turbo.json:

{
  "$schema": "https://turbo.build/schema.json",
  "globalDependencies": [
    "**/.env"
  ],
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**", "build/**"],
      "cache": true
    },
    "test": {
      "dependsOn": ["^build"],
      "outputs": ["coverage/**"],
      "cache": true
    },
    "lint": {
      "cache": true
    },
    "dev": {
      "dependsOn": ["^build"],
      "cache": false,
      "persistent": true
    },
    "clean": {
      "cache": false
    }
  }
}
شرح تفصيلي لمكونات turbo.json:

"$schema": لتوفير إكمال تلقائي (autocompletion) والتحقق من صحة الملف.
"globalDependencies": يحدد الملفات التي إذا تم تغييرها، سيتم إبطال (invalidate) جميع caches. في هذه الحالة، أي تغيير في ملفات .env سيؤدي إلى إعادة بناء كل شيء يعتمد عليها.
"pipeline": هنا يتم تعريف المهام (tasks) وكيفية معالجتها.
build:
dependsOn: ["^build"]: هذا يعني أن مهمة build لأي مشروع تعتمد على إكمال مهمة build لجميع تبعياتها في الـ Monorepo. هذا يضمن أن يتم بناء الـ packages المشتركة أولاً قبل التطبيقات التي تستخدمها.
outputs: ["dist/**", "build/**"]: يحدد المجلدات والملفات الناتجة عن عملية البناء التي يجب تخزينها في الـ cache.
cache: true: تمكين الـ caching لهذه المهمة. إذا لم تتغير المدخلات، سيتم استخدام النسخة المخزنة مؤقتًا.
test:
dependsOn: ["^build"]: لضمان أن الاختبارات لا تُجرى إلا بعد بناء الكود.
outputs: ["coverage/**"]: لتخزين تقارير تغطية الكود (إذا تم إنشاؤها) في الـ cache.
cache: true: تمكين الـ caching.
lint:
cache: true: تمكين الـ caching. إذا لم تتغير ملفات الكود، لن يعيد Turborepo تشغيل الـ linting.
dev:
dependsOn: ["^build"]: لبناء التبعيات أولاً قبل بدء وضع التطوير.
cache: false: عادة لا يتم تخزين مهمة dev مؤقتاً لأنها تكون عملية مستمرة.
persistent: true: يخبر Turborepo بإبقاء هذه المهام قيد التشغيل (مثل خادم التطوير).
clean:
cache: false: مهمة تنظيف لا تحتاج للتخزين المؤقت.
استراتيجية الـ Caching:

localCache: سيكون مفعلاً بشكل افتراضي في Turborepo. هذا يعني أن نتائج المهام ستخزن محلياً على جهاز المطور أو خادم CI/CD. هذا ضروري لتسريع عمليات التطوير المحلية.
remoteCache (إذا تم استخدام Vercel): إذا تم نشر المشروع على Vercel أو تم استخدام Turborepo Remote Cache، يمكن تكوين Turborepo لاستخدام cache بعيد مشترك بين جميع أعضاء الفريق وخوادم CI/CD. يتطلب ذلك إعداد متغيرات بيئة مثل TURBO_TEAM و TURBO_TOKEN. في هذه الخطة، سنركز على localCache فقط ما لم يتم تحديد Vercel صراحة.
2.4. إدارة البيئة (Environment Management):
لضمان تحميل متغيرات البيئة بشكل صحيح لكل workspace، سيتم استخدام dotenv-cli أو cross-env.

dotenv-cli: يستخدم لتحميل متغيرات البيئة من ملفات .env في مساحات العمل المختلفة.
cross-env: يوفر طريقة لتحديد متغيرات البيئة بشكل متوافق عبر أنظمة التشغيل المختلفة (Windows, macOS, Linux).
الخطة التنفيذية لإدارة البيئة:

التثبيت:
bun add dotenv-cli cross-env --dev
الاستخدام في package.json Scripts:
في ملف package.json لكل تطبيق أو خدمة تحتاج لمتغيرات بيئة، يمكن استخدامها كالتالي:
// apps/my-app/package.json
{
  "name": "my-app",
  "version": "1.0.0",
  "scripts": {
    "dev": "dotenv -e .env -- bun run next dev", // استخدام dotenv-cli
    "build": "cross-env NODE_ENV=production bun run next build" // استخدام cross-env
  }
}
ملاحظة: يمكن دمج هذه الأوامر في سكربتات الجذر واستدعائها عبر bun turbo run dev --filter=my-app.
2.5. Git Hooks عبر Husky (Git Hooks with Husky):
Husky أداة قوية تسمح بتشغيل سكربتات قبل أو بعد أحداث Git معينة (مثل pre-commit، pre-push). هذا يضمن تطبيق معايير جودة الكود تلقائياً.

لماذا Husky؟

جودة الكود: يفرض قواعد الـ linting والتنسيق قبل الـ commit، مما يمنع إدخال كود غير متوافق.
الأتمتة: يوفر أتمتة لفحص الكود دون تدخل يدوي من المطور.
الخطة التنفيذية لـ Husky:

الخطوة 1: تثبيت Husky و lint-staged و prettier و eslint في الجذر:

bun add husky lint-staged prettier eslint --dev
الخطوة 2: تهيئة Husky:

bun husky init
هذا سيضيف مجلد .husky/ وملف pre-commit بسيط.

الخطوة 3: تعديل pre-commit hook:
قم بتعديل ملف .husky/pre-commit ليشغل lint-staged.

#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

bun run pre-commit
الخطوة 4: تكوين lint-staged في package.json الجذر:
lint-staged يسمح بتشغيل أوامر على الملفات المرحلية فقط (staged files)، مما يسرع العملية.

// package.json في الجذر
{
  "name": "arch-core-01",
  // ...
  "scripts": {
    // ...
    "pre-commit": "lint-staged"
  },
  "lint-staged": {
    "*.{js,jsx,ts,tsx}": [
      "bun run eslint --fix",
      "bun run prettier --write"
    ],
    "*.{json,css,md}": [
      "bun run prettier --write"
    ]
  }
}
الخطوة 5: تكوين Eslint و Prettier:

Eslint: إنشاء ملف eslint.config.js أو .eslintrc.json في مجلد config/ (أو في الجذر وتتم الإشارة إليه من الـ workspaces) مع القواعد المطلوبة. على سبيل المثال، يمكن استخدام eslint-config-turbo.
Prettier: إنشاء ملف .prettierrc في مجلد config/ أو في الجذر مع تفضيلات التنسيق.
مثال (في config/eslint-config-custom/index.js):

module.exports = {
  extends: ["turbo", "prettier"],
  rules: {
    "@next/next/no-html-link-for-pages": "off",
    "react/jsx-key": "off",
  },
  parserOptions: {
    babelOptions: {
      presets: [require.resolve("next/babel")],
    },
  },
};
مثال (في config/prettier-config-custom/index.js):

module.exports = {
  singleQuote: true,
  trailingComma: "all",
  printWidth: 100,
  plugins: ["prettier-plugin-tailwindcss"],
};
ثم في package.json لأي app أو package، يمكن الإشارة إليهما:

// apps/my-app/package.json
{
  "name": "my-app",
  // ...
  "eslintConfig": {
    "extends": ["custom"] // للإشارة إلى config/eslint-config-custom
  },
  "prettier": "custom" // للإشارة إلى config/prettier-config-custom
}
أو يمكن وضعها في ملفات eslintrc.json و prettierrc.json في جذر المشروع والـ workspaces.

3. الخطة التنفيذية وتحقيق الأهداف (Execution Plan and Objective Achievement)
3.1. بناء ناجح (Successful Build):

الخطة التنفيذية:
تطوير تطبيق بسيط (مثلاً، Next.js App) في apps/web ومكتبة (مثلاً، مكونات React) في packages/ui.
جعل تطبيق web يعتمد على مكتبة ui في package.json الخاص به.
تشغيل أمر البناء الشامل من جذر Monorepo:
bun turbo run build
الهدف والمتوقع: bun turbo run build يتم تنفيذه بنجاح لجميع الحزم والتطبيقات دون أي أخطاء.
التحقق:
ملاحظة مخرجات الطرفية (terminal output) للتأكد من عدم وجود رسائل خطأ.
التأكد من إنشاء مجلدات dist/ أو build/ (حسب إعدادات أدوات البناء مثل Webpack/Rollup/Next.js) داخل كل تطبيق أو حزمة في Monorepo.
اختبار تشغيل التطبيقات المبنية (إن أمكن).
3.2. اختبارات ناجحة وتغطية الكود (Successful Tests & Code Coverage):

الخطة التنفيذية:
كتابة اختبارات (باستخدام Jest أو Vitest) لكل من apps/web و packages/ui، مع تضمين اختبارات تغطية الكود.
تكوين أداة الاختبار لإنشاء تقارير تغطية الكود (مثلاً، C8 أو nyc).
تشغيل أمر الاختبار الشامل من جذر Monorepo:
bun turbo run test
الهدف والمتوقع: bun turbo run test يمرر جميع الاختبارات بنسبة تغطية كود لا تقل عن 80%.
التحقق:
مراجعة مخرجات الطرفية بعد تشغيل bun turbo run test للتأكد من مرور جميع الاختبارات.
فحص تقارير تغطية الكود التي يتم إنشاؤها (عادة في مجلد coverage/ داخل كل مشروع). يمكن استخدام أدوات مثل jest --coverage أو vitest --coverage. التأكد من أن النسبة الإجمالية لتغطية الكود (lines, statements, branches, functions) لا تقل عن 80%.
3.3. Linting و Formatting (Linting & Formatting):

الخطة التنفيذية:
تكوين eslint و prettier كما هو موضح في قسم Git Hooks أعلاه، مع قواعد محددة.
إحداث أخطاء linting متعمدة (مثلاً، استخدام متغير غير مستخدم) أو كود غير منسق في أحد الملفات.
تشغيل أوامر الـ linting و formatting الشاملة:
bun turbo run lint
bun turbo run format
الهدف والمتوقع: bun turbo run lint و bun turbo run format لا يبلغان عن أي انتهاكات أو أخطاء بعد التشغيل الأول لـ format.
التحقق:
تشغيل bun turbo run lint، والتأكد من عدم وجود أخطاء في المخرجات. إذا وجدت، يجب إصلاحها يدوياً أو باستخدام bun turbo run lint --fix.
تشغيل bun turbo run format، ومراجعة التغييرات في الملفات. بعد التشغيل، يجب أن تكون جميع الملفات منسقة.
إعادة تشغيل bun turbo run lint بعد format للتأكد من عدم وجود انتهاكات.
3.4. تفعيل Caching (Caching Activation):

الخطة التنفيذية:
تشغيل مهمة build لأول مرة:
bun turbo run build
دون إجراء أي تغييرات على الكود الذي تم بناؤه، أعد تشغيل مهمة build (يفضل مع dry-run=json للحصول على تقرير مفصل):
bun turbo run build --dry-run=json
الهدف والمتوقع: التحقق من فعالية الـ Caching. في المرة الثانية لتشغيل build (بدون تغييرات)، يجب أن تكون معظم المهام cache hit. تقرير bun turbo run build --dry-run=json يجب أن يوضح نسبة cache hit لأكثر من 90% من المهام المتكررة.
التحقق:
في المخرجات العادية لـ bun turbo run build، يجب ملاحظة رسائل مثل build:web: cached أو build:ui: cached.
تحليل مخرجات bun turbo run build --dry-run=json. هذا سيعطي تقريراً مفصلاً بصيغة JSON يوضح حالة كل مهمة (cache hit، cache miss). يجب أن تكون نسبة المهام التي تم تخزينها مؤقتاً (cache hit) عالية جداً (أكثر من 90%) للمهام المتكررة دون تغييرات.
3.5. فرض Git Hooks (Git Hooks Enforcement):

الخطة التنفيذية:
إحداث تغيير متعمد في أحد ملفات الكود (مثلاً، apps/web/src/index.js):
كود غير منسق (مسافات خاطئة، عدم استخدام الفواصل المنقوطة).
خطأ linting (متغير معلن لكن غير مستخدم).
حفظ الملف.
محاولة إضافة الملف وتثبيته:
git add apps/web/src/index.js
git commit -m "Attempting to commit bad code"
الهدف والمتوقع: محاولة git commit لكود غير منسق أو به أخطاء Linting تفشل بسبب Husky hook، مما يمنع الـ commit.
التحقق:
ملاحظة فشل عملية الـ commit في الطرفية.
ظهور رسائل خطأ من eslint و/أو prettier و/أو lint-staged تشرح سبب الفشل وتحدد الملفات المتأثرة.
إصلاح الأخطاء يدوياً أو تلقائياً (عبر bun turbo run format و bun turbo run lint --fix)، ثم إعادة محاولة الـ commit للتأكد من نجاحها بعد الإصلاح.
3.6. توثيق Monorepo (Monorepo Documentation):

الخطة التنفيذية:
إنشاء ملف monorepo.md في جذر المشروع.
كتابة المحتوى الذي يغطي:
بنية الـ Monorepo: شرح للمجلدات (apps/, packages/, services/, config/) والغرض من كل منها.
كيفية إضافة حزم جديدة: إرشادات خطوة بخطوة لإضافة تطبيق جديد أو مكتبة جديدة، بما في ذلك إنشاء مجلدات، package.json، وتكوينات tsconfig.json، ودمجها في Turborepo.
تشغيل الأوامر المشتركة: قائمة بأوامر bun turbo run الشائعة مع شرح بسيط لكل منها (مثلاً، build، test، lint، dev، clean).
إدارة التبعيات: كيفية إضافة تبعيات لمشروع معين أو تبعيات مشتركة في الجذر.
إدارة البيئة: شرح كيفية استخدام ملفات .env و dotenv-cli.
أدوات جودة الكود: شرح لدور eslint، prettier، و husky.
الهدف والمتوقع: ملف monorepo.md يوثق بنية الـ Monorepo، كيفية إضافة حزم جديدة، وتشغيل الأوامر المشتركة بشكل واضح ومفصل.
التحقق:
مراجعة محتوى الملف للتأكد من شموله ودقته ووضوحه.
اختبار الإرشادات المكتوبة (مثل إضافة حزمة جديدة) للتأكد من صحتها.
4. ملخص وفوائد (Summary and Benefits)
من خلال تطبيق هذه الخطة التنفيذية المفصلة، سيتم بناء Monorepo قوي وموثوق لـ Arch-Core-01 يتمتع بالفوائد التالية:

سرعة لا مثيل لها: بفضل Bun و Turborepo، ستكون عمليات البناء والاختبار سريعة بشكل استثنائي.
جودة كود عالية: تضمن Husky مع eslint و prettier تطبيق معايير الكود باستمرار.
إدارة مبسطة للتبعية: توحيد إدارة التبعيات عبر Bun في Monorepo.
قابلية إعادة الاستخدام: تعزيز مشاركة الكود بين التطبيقات والمكتبات.
تطوير فعال: تقليل الوقت الضائع في انتظار عمليات البناء والاختبار.
بيئة موحدة: ضمان الاتساق في الإعدادات والأدوات عبر جميع مشاريع الفريق.
هذه الخطة توفر كل التفاصيل اللازمة لبناء هذا الـ Monorepo بنجاح دون الحاجة إلى مزيد من التفكير أو التخطيط الإضافي.