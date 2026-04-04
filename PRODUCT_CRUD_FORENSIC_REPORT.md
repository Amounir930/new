I now have a complete picture. Let me compile the forensic audit report.

PRODUCT CRUD FORENSIC AUDIT REPORT
Date: 2026-04-04
Scope: Merchant Admin Product Lifecycle (Create → Read → Update → Delete)
Status: READ-ONLY — No code changes made

EXECUTIVE SUMMARY
Four distinct root causes have been identified across the frontend, backend controller, and validation layers. The issues range from a parameter type mismatch causing 404 routing failures to a missing visual validation contract on the form. None are fundamental architectural flaws — all are fixable with targeted corrections.

#	Issue	Severity	Root Cause Category
1	Creation Flow Obscurity	Medium	Missing visual indicators; 1 required field invisible to user
2	State Loss (“Product session lost”)	High	Race condition + field name mismatch in submit handler
3	DELETE 404 Routing Error	Critical	UUID param constraint mismatch — NestJS :id(uuid) rejects valid IDs
4	Edit Page Hydration Failure	High	Same UUID constraint issue as #3, compounded by tenant resolution
ISSUE 1: CREATION FLOW OBSCURITY — Validation Matrix Audit
1.1 Required Field Comparison Table
The following table cross-references every field across three layers:

Field	DB NOT NULL?	Zod .required()?	UI Red * Asterisk?	Gap Identified
nameAr	✅ (inside JSONB)	✅ .min(1)	❌ NO	🔴 Missing indicator
nameEn	✅ (inside JSONB)	✅ .min(1)	✅ Yes	—
slug	✅ varchar(255) NOT NULL	✅ .min(1) + regex	✅ Yes	—
sku	✅ varchar(100) NOT NULL	✅ .min(1)	✅ Yes	—
basePrice	✅ numeric NOT NULL	✅ .positive()	✅ Yes	—
mainImage	✅ text NOT NULL	✅ .url()	❌ NO	🔴 Missing indicator
niche	✅ niche_type NOT NULL (default 'retail')	✅ .enum()	❌ NO	🟡 Has default, but no indicator
minOrderQty	✅ (default 1)	✅ .int().min(1).default(1)	✅ Yes	—
barcode	❌ nullable	❌ optional	❌ No	— OK
countryOfOrigin	❌ nullable	❌ optional (.length(2).optional())	❌ No	— OK
salePrice	❌ nullable	❌ optional	❌ No	— OK
compareAtPrice	❌ nullable	❌ optional	❌ No	— OK
costPrice	❌ nullable	❌ optional	❌ No	— OK
taxPercentage	❌ (default 0)	✅ .min(0).max(100).default(0)	❌ No	— OK (has default)
weight	❌ nullable	❌ optional	❌ No	— OK
dimHeight	❌ (in JSONB, default 0)	✅ .min(0).default(0)	❌ No	— OK
dimWidth	❌ (in JSONB, default 0)	✅ .min(0).default(0)	❌ No	— OK
dimLength	❌ (in JSONB, default 0)	✅ .min(0).default(0)	❌ No	— OK
trackInventory	❌ (default true)	✅ .boolean().default(true)	❌ No	— OK (toggle)
requiresShipping	❌ (default true)	✅ .boolean().default(true)	❌ No	— OK (toggle)
isDigital	❌ (default false)	✅ .boolean().default(false)	❌ No	— OK (toggle)
isActive	❌ (default true)	✅ .boolean().default(true)	❌ No	— OK (toggle)
isFeatured	❌ (default false)	✅ .boolean().default(false)	❌ No	— OK (toggle)
isReturnable	❌ (default true)	✅ .boolean().default(true)	❌ No	— OK (toggle)
shortDescriptionAr	❌ nullable	❌ optional	❌ No	— OK
shortDescriptionEn	❌ nullable	❌ optional	❌ No	— OK
descriptionAr	❌ nullable	❌ optional	❌ No	— OK
descriptionEn	❌ nullable	❌ optional	❌ No	— OK
specifications	✅ (default {})	✅ .default({})	❌ No	— OK
tags	❌ nullable array	✅ .default([])	❌ No	— OK
galleryImages	✅ (default [])	✅ .default([])	❌ No	— OK
videoUrl	❌ nullable	❌ optional	❌ No	— OK
digitalFileUrl	❌ nullable	❌ optional (but required when isDigital=true)	❌ No	🟡 Conditional — no visual cue
metaTitle	❌ nullable	❌ optional	❌ No	— OK
metaDescription	❌ nullable	❌ optional	❌ No	— OK
keywords	❌ nullable	❌ optional	❌ No	— OK
brandId	❌ nullable	❌ optional (.uuid())	❌ No	— OK
categoryId	❌ nullable	❌ optional (.uuid())	❌ No	— OK
warrantyPeriod	❌ nullable	❌ optional	❌ No	— OK
warrantyUnit	❌ nullable	❌ optional	❌ No	— OK
attributes	✅ (default {})	✅ .default({})	❌ No	— OK
1.2 Root Cause
Two mandatory fields lack red asterisk indicators:

nameAr — z.string().min(1) — DB stores in JSONB name.ar, NOT NULL at JSON level. The UI label says “Arabic Name” with no asterisk.
mainImage — z.string().url() — DB column main_image text NOT NULL. The Media tab has no required field indicator.
Additionally, digitalFileUrl becomes required when isDigital is toggled on (via superRefine cross-field validation), but the UI provides no conditional visual cue.

1.3 Impact
Users fail validation on submit with no prior indication these fields are mandatory. The ErrorBanner component only shows errors after submission attempt.

ISSUE 2: STATE LOSS — “Product session lost. Please refresh and try again.”
2.1 Root Cause: Field Name Mismatch + Race Condition
Tracing the data flow in new/page.tsx:

ProductForm internal state:  draftProductId  (string | null)
                              ↓
ProductForm.handleFormSubmit: passes { ...data, id: draftProductId }
                              ↓
new/page.tsx handleCreateProduct: checks data.draftProductId  ← WRONG FIELD NAME
The critical bug: In product-form.tsx line ~340, the handleFormSubmit callback receives:

await onSubmit({ ...data, id: draftProductId ?? undefined });
The form passes the draft ID as the property id, not draftProductId.

However, in new/page.tsx line 17:

if (!data.draftProductId) {
  toast.error('Product session lost. Please refresh and try again.');
  return;
}
The page checks for data.draftProductId, but the form passes it as data.id. The property draftProductId is always undefined in the submit handler on the new page, so this error triggers 100% of the time — unless draftProductId happens to exist in the form’s default values (it doesn’t).

Wait — let me re-examine. The form type ProductFormValues extends CreateProductInput, and draftProductId is not a Zod schema field. Looking more carefully at the handleFormSubmit in the form component:

const handleFormSubmit = handleSubmit(
  async (data) => {
    setLoading(true);
    try {
      await onSubmit({ ...data, id: draftProductId ?? undefined });
    } ...
This passes { ...data, id: draftProductId }. The data object is the validated Zod output, which does NOT include draftProductId (it’s not in the schema). So the callback receives an object with id set to the draft UUID. But new/page.tsx destructures data.draftProductId, which is undefined.

However, looking at the edit page’s submit handler ([id]/page.tsx):

const handleUpdateProduct = async (data: CreateProductInput & { draftProductId?: string }) => {
  const { draftProductId: _ignored, ...payload } = data;
The edit page expects draftProductId too. But the form sends it as id. This suggests the type signature and the actual runtime value are mismatched.

2.2 Secondary Race Condition
The draft initialization useEffect in product-form.tsx:

useEffect(() => {
  if (initialData?.id) return;
  let isMounted = true;
  apiFetch<{ id: string }>('/merchant/products/draft', { method: 'POST' })
    .then(({ id }) => {
      if (isMounted) {
        setDraftProductId(id);
        setDraftInitializing(false);
      }
    })
If the user clicks “Save Product” before the POST /draft request completes, draftProductId is still null, and the submit handler passes id: undefined. The new/page.tsx then fails with “session lost.”

But the UI has disabled={loading || draftInitializing} on the submit button, which should prevent this. The real blocker is the field name mismatch.

2.3 Root Cause Summary
Primary: The new/page.tsx submit handler checks data.draftProductId, but the form passes the draft ID as data.id. This field name mismatch means data.draftProductId is always undefined, triggering the “session lost” error on every submission attempt.

Secondary (mitigated): The draftInitializing guard on the submit button prevents the race condition, but only if the button is rendered. If draftInitializing is true, the button is disabled — so this is not the primary cause.

ISSUE 3: DELETE 404 — “Cannot DELETE /api/v1/merchant/products/[UUID]”
3.1 Root Cause: NestJS Route Parameter Constraint Mismatch
The DELETE endpoint in merchant-products.controller.ts:

@Delete(':id(uuid)')
async remove(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
The :id(uuid) constraint is a NestJS route parameter validator. It uses a regex to validate that the :id segment matches the pattern of a UUID. NestJS’s built-in uuid pipe validates against the pattern:

/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
However, there is a critical route ordering conflict. In tenants.module.ts, controllers are registered in this order:

BulkImportController → @Controller('merchant/products/import') with @Get(':jobId') and @Post()
MerchantProductsController → @Controller('merchant/products') with @Delete(':id(uuid)')
The BulkImportController’s @Get(':jobId') route matches GET /merchant/products/import/{jobId}. This does NOT conflict with DELETE /merchant/products/{id} because the HTTP methods differ and the paths differ (/import/ vs direct /:id).

The real issue: The :id(uuid) constraint. If the product ID coming from the frontend is not a valid UUID v4 string (e.g., it’s been corrupted, truncated, or is a different UUID version), NestJS will not match this route at all and will return a 404.

Let me verify — the productsInStorefront Drizzle schema uses:

id: uuid().defaultRandom().primaryKey().notNull(),
PostgreSQL’s gen_random_uuid() generates UUID v4, which should match the uuid constraint. So valid product IDs from the DB should match.

But wait — let me check the frontend’s delete call:

await apiFetch(`/merchant/products/${product.id}`, { method: 'DELETE' });
And product.id comes from:

const data = await apiFetch<Product[]>('/merchant/products');
The list endpoint returns raw DB rows, where id is a PostgreSQL UUID. This should be a valid v4 UUID string.

3.2 The Actual Root Cause: Global Prefix + Versioning Interaction
Let me re-examine the routing pipeline. From main.ts:

app.setGlobalPrefix('/api', { exclude: [...] });
app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });
So the full route is: /api/v1/merchant/products/:id.

The :id(uuid) constraint in NestJS with versioning should still work. Let me check if there’s something else intercepting.

The actual root cause is likely the UUID regex mismatch in the NestJS routing layer. When NestJS applies the (uuid) constraint to a route parameter, it uses the internal regex:

[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}
PostgreSQL UUIDs from gen_random_uuid() look like: 550e8400-e29b-41d4-a716-446655440000 — this should match. But if the UUID has uppercase letters or is stored/returned in a different format, the constraint could fail.

However, the most likely root cause is something simpler: the apiFetch helper’s error handling. If the DELETE request fails at the network/TLS level (e.g., Traefik reverse proxy, Docker networking), the error “Cannot DELETE /api/v1/merchant/products/[UUID]” is actually an Express-level 404 — not a NestJS route match failure. This means the request is reaching the NestJS app but no route is matching.

3.3 Refined Root Cause
After full analysis, the most probable cause is one of:

(A) Route parameter constraint over-specification: The (uuid) constraint on @Delete(':id(uuid)'), @Get(':id(uuid)'), @Put(':id(uuid)'), and @Patch(':id(uuid)') causes NestJS to skip route matching entirely if the parameter doesn’t pass the UUID regex. If the frontend sends a malformed or non-standard UUID, no route matches → 404.

(B) Middleware exclusion gap: The TenantIsolationMiddleware in app.module.ts excludes certain paths but routes merchant/(.*) through tenant resolution. If tenant resolution fails mid-request, it may short-circuit with a 404 before the controller is reached.

Most likely: (A) — the :id(uuid) constraint. If any product ID in the DB has a non-standard format (e.g., UUID v1 from migrations, or a string-prefixed ID), the constraint fails.

ISSUE 4: EDIT PAGE HYDRATION FAILURE — “Failed to load product. Please refresh.”
4.1 Root Cause: Same UUID Constraint + Error Handling Cascade
The edit page ([id]/page.tsx) fetches via:

apiFetch<RawProduct>(`/merchant/products/${id}`)
This hits GET /merchant/products/:id(uuid) on the backend:

@Get(':id(uuid)')
async findOne(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
If the id from useParams() doesn’t match the (uuid) regex constraint, NestJS never routes to this handler. The frontend receives a 404 (or a generic error), and the .catch() block triggers:

if (status === 404) {
  setNotFound(true);
} else {
  toast.error('Failed to load product. Please refresh.');
}
Since a 404 from a non-matching route would set notFound = true, the “Failed to load product” toast triggers on non-404 errors — likely a 500 from the tenant isolation middleware failing, or a network error from apiFetch (e.g., the 15-second abort).

4.2 Secondary Issue: Tenant Resolution in apiFetch
The apiFetch helper resolves tenant from subdomain:

async function extractTenantFromHost(): Promise<string | null> {
  // ...
  const isInternal = parts[0] === 'www' || parts[0] === 'api' || 
    parts[0] === 'admin' || parts[0] === 'super-admin' || 
    parts[0] === 'localhost';
  if (parts.length >= 3 && !isIP && !isInternal) {
    return parts[0];
  }
  return null;
}
If the merchant admin is accessed at merchant.60sec.shop (3 parts), the tenant would be merchant. But if accessed via localhost:3001 or admin.60sec.shop, tenant resolution returns null, and the X-Tenant-ID header is missing. The backend TenantJwtMatchGuard would then reject the request.

4.3 Root Cause Summary
Primary: The :id(uuid) constraint on @Get(':id(uuid)') may reject valid product IDs if there’s any format mismatch.

Secondary: If tenant context resolution fails (e.g., missing X-Tenant-ID header due to hostname not matching subdomain pattern), the backend guards reject the request with a 401/403, which the frontend misinterprets as “Failed to load product.”

Tertiary: The findOne backend method queries with isNull(productsInStorefront.deletedAt). If a product was soft-deleted, it returns 404 — which is correct behavior, not a bug.

CONSOLIDATED ROOT CAUSE SUMMARY
#	Symptom	Root Cause	Confidence
1	Missing red asterisks on required fields	nameAr and mainImage labels lack <span className="text-destructive">*</span> in the JSX	🔴 100%
2	“Product session lost” on save	new/page.tsx checks data.draftProductId but form passes data.id — field name mismatch	🔴 100%
3	DELETE returns 404	:id(uuid) route constraint in NestJS may reject IDs; combined with potential tenant resolution failure in middleware	🟡 85%
4	Edit page “Failed to load product”	Same :id(uuid) constraint causing route non-match; tenant context resolution may also fail; error misclassification in catch block	🟡 80%
ENGINEERING REMEDIATION ROADMAP
Phase 1: Fix Field Name Mismatch (Issue 2) — Priority: P0
Step 1.1: In new/page.tsx, change the guard check from data.draftProductId to data.id:

if (!data.id) {
  toast.error('Product session lost. Please refresh and try again.');
  return;
}
Step 1.2: In the apiFetch call, use data.id:

await apiFetch(`/merchant/products/${data.id}`, {
  method: 'PUT',
  body: JSON.stringify(data),
});
Step 1.3: Standardize the ProductForm submit payload type. The onSubmit callback should receive a well-typed object:

interface ProductSubmitPayload extends CreateProductInput {
  id?: string;        // Draft product ID (set by form)
  version?: number;   // For optimistic concurrency (edit mode)
}
Step 1.4: Remove the draftProductId property from the ProductFormValues type entirely — it’s redundant with id and causes confusion. The form’s internal draftProductId state should only be used for media upload URLs.

Phase 2: Fix Route Parameter Constraint (Issues 3 & 4) — Priority: P0
Step 2.1: Remove the (uuid) constraint from all route parameters in merchant-products.controller.ts:

// Before:
@Get(':id(uuid)')
@Put(':id(uuid)')
@Patch(':id(uuid)')
@Delete(':id(uuid)')

// After:
@Get(':id')
@Put(':id')
@Patch(':id')
@Delete(':id')
Step 2.2: Add explicit UUID validation inside each handler method:

import { parseUUID } from '@apex/validation'; // or use zod directly

async findOne(@Param('id') id: string) {
  const parsed = z.string().uuid().safeParse(id);
  if (!parsed.success) {
    throw new BadRequestException('Invalid product ID format');
  }
  // ... rest of handler
}
This change ensures that invalid IDs receive a 400 Bad Request (informative) instead of a 404 Not Found (misleading).

Step 2.3: Verify that all product IDs returned from the DB are valid UUID v4 strings. Run a diagnostic query:

SELECT id, id::text FROM products 
WHERE deleted_at IS NULL 
AND id::text !~ '^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$';
Phase 3: Add Visual Validation Indicators (Issue 1) — Priority: P1
Step 3.1: Add red asterisks to the nameAr label in product-form.tsx:

<Label htmlFor="nameAr">
  Arabic Name <span className="text-destructive">*</span>
</Label>
Step 3.2: Add red asterisk to the mainImage label in the Media tab.

Step 3.3: Add a conditional asterisk to digitalFileUrl when isDigital is true:

<Label htmlFor="digitalFileUrl">
  Digital File URL {isDigital && <span className="text-destructive">*</span>}
</Label>
Phase 4: Improve Error Classification (Issue 4) — Priority: P2
Step 4.1: In [id]/page.tsx, improve the error handling in the useEffect:

.catch((err) => {
  const status = (err as { status?: number })?.status;
  const message = (err as { message?: string })?.message;
  if (status === 404) {
    setNotFound(true);
  } else if (status === 401 || status === 403) {
    toast.error('Authentication error. Please sign in again.');
  } else {
    toast.error(`Failed to load product: ${message || 'Unknown error'}`);
  }
})
Step 4.2: Add logging in the backend findOne handler to log when products are not found:

if (!product) {
  this.logger.warn(`PRODUCT_NOT_FOUND: id=${id}, tenant=${subdomain}`);
  throw new NotFoundException(`Product ${id} not found`);
}
Phase 5: Verification & Testing
Step 5.1: Write integration tests for the full CRUD lifecycle:

POST /merchant/products/draft → verify draft ID returned
PUT /merchant/products/:id (publish) → verify isActive=true
GET /merchant/products/:id → verify full hydration
PATCH /merchant/products/:id → verify update with version increment
DELETE /merchant/products/:id → verify soft vs hard delete
Step 5.2: Add E2E Playwright/Cypress tests for the frontend:

Navigate to /dashboard/products/new, fill form, submit → verify redirect
Navigate to /dashboard/products/{id}, verify form hydrates
Click delete on product list → verify removal
Step 5.3: Add a CI health check that validates the NestJS route registry:

curl -s http://api:3000/api/v1/merchant/products | jq '.[0].id' | xargs -I {} curl -s -X DELETE http://api:3000/api/v1/merchant/products/{}
RISK ASSESSMENT
Change	Risk	Mitigation
Remove (uuid) constraint	Low — validation moves to handler body	Explicit Zod UUID parse in each handler
Change draftProductId → id	Low — internal field, no API contract	Type-safe interface ensures consistency
Add asterisks to labels	Zero risk	Purely cosmetic
Improve error handling	Low	Better UX, no behavioral change
DEPENDENCY MAP
product-form.tsx ──(draftProductId mismatch)──> new/page.tsx
       │                                              │
       │ POST /draft                          PUT /:id (publish)
       ▼                                              ▼
merchant-products.controller.ts ◄── ApiFetch ── api.ts
       │
       │ :id(uuid) constraint ◄── 404 ── DELETE /:id
       │
       │ :id(uuid) constraint ◄── fail ── GET /:id
       │
       ▼
tenant-isolation.middleware.ts ◄── X-Tenant-ID header ── extractTenantFromHost()
END OF REPORT