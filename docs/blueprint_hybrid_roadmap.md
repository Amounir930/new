Blueprint JSON

السوبر أدمن مش "بيكريت متاجر"، هو "بيصمم الأنظمة".

المهمة: بيستخدم الـ Blueprint JSON كأداة هندسية عشان يحدد القواعد (The Rules).

الناتج: * بيحدد الـ 4 Plans (مثلاً: Basic, Pro, Business, Enterprise).

بيوزع الـ 7 Modules على الخطط دي (مين ياخد المخازن؟ مين ياخد الـ POS؟).

الاستخدام: بمجرد ما يسيف الـ JSON، دوره بينتهي. الـ JSON ده بيبقى هو "المرجع" (Single Source of Truth) اللي السيستم بيمشي عليه.

2. دور المستأجر (The Consumer)
المستأجر ميعرفش يعني إيه JSON ولا بيشوفه أصلاً. هو بيتعامل مع واجهة (UI) ذكية بتسحب بياناتها من الـ Blueprint اللي السوبر أدمن عمله.

الطريقة الأولى (الذكاء الاصطناعي): يكتب "عاوز مطعم بيتزا"، السيستم يروح للـ Blueprint بتاع الـ food ويولد له البيانات.

الطريقة الثانية (القوالب): يختار "قالب البرنس"، السيستم يسحب الـ blueprintId الجاهز وينفذه.

الطريقة الثالثة (الـ Wizard): يمشي خطوات (اسم المتجر -> اختار المجال -> اختار الخطة)، والـ UI يجمع الاختيارات دي ويحولها لطلب provision نضيف.




# 🗺️ Advanced Blueprint Engine (Hybrid Model) - Execution Roadmap

This roadmap outlines the transformation of the current provisioning system into a **Hybrid Blueprint Engine** capable of Modular, Template-based, and AI-driven store generation.

**Objective**: Deliver a robust, S2-compliant, high-performance (<1000ms) engine that drives Web and Mobile (SDUI) experiences.

---

## 📅 Sprint 1: The Modular Core (Architecture & Choice)
**Goal**: Move from "Hardcoded Seeder" to "Dynamic Module Injection". Enable Feature Gating.

### 🏗️ Architecture Changes
1.  **Refactor `packages/provisioning`**:
    -   Split `seeder.ts` into granular **Seed Modules**:
        -   `core.seeder.ts` (Users, Settings)
        -   `catalog.seeder.ts` (Products, Categories)
        -   `inventory.seeder.ts` (Stock, Warehouses) - *Optional*
        -   `payment.seeder.ts` (Gateways, Tax) - *Optional*
    -   Implement `BlueprintExecutor` that accepts a `BlueprintConfig` object to orchestrate these seeders.

2.  **Database Extensions**:
    -   Add `features` (JSONB) column to `tenant_config` table.
    -   **S2 Compliance**: Ensure all modules strictly use the `tenant_{id}` schema context.

### 🛠️ Deliverables
-   [ ] `BlueprintExecutor` class (The "Brain").
-   [ ] Feature Flags Logic (`is_inventory_enabled`, `is_blog_enabled`).
-   [ ] API Endpoint: `POST /api/v1/provision` accepts `{ modules: ['inventory', 'blog'] }`.

---

## 📅 Sprint 2: The Template Engine (Cloning & Snapshots)
**Goal**: "Write Once, Replicate Many". Enable Super Admin to crate templates via UI.

### 🏗️ Architecture Changes
1.  **Snapshot Service**:
    -   Create `TenantSnapshotService` to reverse-engineer a live tenant into a JSON Blueprint.
    -   *Logic*: `Dump DB (Selected Tables)` -> `Anonymize PII` -> `Serialize to JSON`.
    
2.  **Onboarding Blueprint Editor (Super-#21)**:
    -   **Frontend**: JSON Editor with visual previews for `onboarding_blueprints`.
    -   **Backend**: CRUD for Blueprints with "Clone from Tenant" capability.

3.  **Optimization**:
    -   Store "Heavy" Blueprints (images/assets) in S3/MinIO to keep DB light.

### 🛠️ Deliverables
-   [ ] `snapshot-manager.ts`: The reverse-seeder.
-   [ ] Admin UI: "Save Tenant as Template" button.
-   [ ] Provisioning: Support `blueprintId` input to load specific snapshots.

---

## 📅 Sprint 3: The Smart Path (AI & SDUI)
**Goal**: "Prompt to Store". Automate content generation and cross-platform styling.

### 🏗️ Architecture Changes
1.  **AI Content Writer (Admin-#34)**:
    -   Integrate LLM (OpenAI/Anthropic) to generate `products`, `categories`, and `banner_text` based on a niche prompt (e.g., "Vegan Bakery").
    -   Output directly to `BlueprintConfig` JSON format.

2.  **SDUI Engine (Mobile-First)**:
    -   Define `UI_Config` schema (JSON) in `tenant_config`:
        -   `theme`: Colors, Fonts (mapped to Design Tokens).
        -   `layout`: Widget order (Bento Grid positions).
    -   **Mobile/Web Sync**: Ensure the Registry API (`/api/v1/config`) serves this SDUI JSON to both Flutter and Next.js.

### 🛠️ Deliverables
-   [ ] `AIBlueprintGenerator` Service.
-   [ ] `SDUI` Schema Definition types.
-   [ ] `POST /api/v1/ai/generate` endpoint.

---

## 📅 Sprint 4: Performance & Production Readiness
**Goal**: Guarantee <1000ms Provisioning Time at Scale.

### 🏗️ Architecture Changes
1.  **Parallel Execution**:
    -   Run independent seeders (e.g., Catalog and Blog) in parallel using `Promise.all`.
    
2.  **Caching Strategy**:
    -   Cache "Default Blueprint" JSON in Redis to avoid DB reads on hot paths.
    -   Pre-warm `runner` connections.

3.  **Observability**:
    -   Add detailed Tracing (OpenTelemetry) to every seeder module to visualize bottlenecks.

### 🛠️ Deliverables
-   [ ] **1000ms SLA Verified** via load testing (`k6`).
-   [ ] Production-grade logging and error handling.

---

## 🚦 Execution Strategy (Immediate Next Step)
We will begin **Sprint 1** immediately by refactoring the `seeder.ts` you verified today into a modular `BlueprintExecutor`.
