# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Added

#### Store-#01: Home Page (100%)
- **Flash Sales Section** — Countdown timer, urgency badges, discount display, quantity limits
- **Bento Grid Section** — Asymmetric CSS Grid layout for featured content (products, categories, links)
- **Trust Marquee Section** — Infinite-scroll marquee with service trust badges
- **Tenant Theming** — CSS variables for colors/fonts, RTL support, Google Fonts injection
- **Blueprint Config** — `home_page_blueprint` stored in `tenant_config` table
- **Cache Invalidation Webhook** — `POST /api/cache-invalidate` with rate limiting (3 req/min)
- **Lighthouse Config** — Added tenant storefront URLs to `.lighthouserc.json`

#### Store-#03: Product Details (100%)
- **Review Submission API** — `POST /storefront/products/:id/reviews` with auth guard
- **Review Modal Component** — 5-star rating, title/content fields, real-time validation
- **Verified Purchase Detection** — Auto-detects paid orders for verified badge
- **Review Integration** — Connected to PDP with auto-reload on success

#### Store-#13: Login Modal (100%)
- **Google OAuth Integration** — Full OAuth2 flow with tenant subdomain routing
- **Signed State Parameter** — HMAC-SHA256 signed OAuth state (S2 compliance)
- **Google Sign-In Button** — Official Google branding with proper UX
- **OAuth State Verification** — Server-side verification with expiry + nonce checks

### Changed
- **customer-auth.controller.ts** — Added `ZodValidationPipe` at class level
- **customer-auth.controller.ts** — All `process.env` replaced with `ConfigService`
- **customer-auth.controller.ts** — Added `@AuditLog` decorators to all endpoints
- **customer-auth.service.ts** — Replaced `as never` with proper `EncryptedJSONB` type
- **storefront.service.ts** — Replaced `as any` with explicit field mapping (42 fields)
- **storefront.controller.ts** — Replaced `as any[]` with typed `Array<Record<string, unknown>>`
- **storefront.service.ts** — Added `resolveLocalizedName()` helper (type-safe JSONB parsing)
- **storefront.service.ts** — Added `invalidateCache()` method with Redis pattern matching
- **PDP pages** — Replaced `as never[]` with proper type imports
- **Checkout components** — Replaced `as unknown as` with proper `.map()` transformations
- **Guards** — Changed generic defaults from `unknown` to concrete types

### Security Fixes
- **S1** — Eliminated all direct `process.env` access in business logic
- **S2** — OAuth state parameter cryptographically signed (HMAC-SHA256) + verified on callback
- **S4** — All auth endpoints now use `@AuditLog` decorator
- **S7** — Removed all hardcoded URLs and http fallbacks
- **S9** — SBOM created; dependencies audited via `bun audit`
- **S11** — Cache invalidation endpoint rate-limited (3 req/min)
- **S14** — Fraud risk scoring added to login path (IP, UA, email domain, geography)
- **Beta 1** — Removed direct `@apex/config/service` imports (Island Pattern compliance)
- **Beta 2** — Renamed 3 component files to kebab-case convention
- **Beta 5** — Created `CHANGELOG.md` with comprehensive change documentation
- **Beta 6** — Replaced Redis `KEYS` with `SCAN` (prevents production blocking)
- **Delta** — Eliminated all `as never`, `as any`, `as unknown`, and `!` casts
- **Delta** — All empty catch blocks now log errors with context

### File Renames (Beta 2 Compliance)
- `FlashSalesSection.tsx` → `flash-sales-section.tsx`
- `BentoGridSection.tsx` → `bento-grid-section.tsx`
- `TrustMarqueeSection.tsx` → `trust-marquee-section.tsx`

### New Files
- `apps/store/src/components/flash-sales-section.tsx`
- `apps/store/src/components/bento-grid-section.tsx`
- `apps/store/src/components/trust-marquee-section.tsx`
- `apps/store/src/components/pdp/review-modal.tsx`
- `apps/store/src/lib/tenant-theme.ts`
- `apps/store/src/app/api/cache-invalidate/route.ts`
- `apps/store/src/app/api/v1/storefront/auth/google/state/route.ts`
- `packages/auth/src/oauth-state.ts`
- `packages/security/src/fraud-risk.ts`
- `SBOM.md`
- `CHANGELOG.md` (this file)

### Known Vulnerabilities (Accepted Risk)
| Package | CVE | Severity | Mitigation |
|---------|-----|----------|------------|
| `drizzle-orm` | GHSA-gpj5-g38j-94v9 | High | SQL identifiers not user-controlled; validated via Zod |
| `@nestjs/core` | GHSA-36xv-jgw5-4q75 | Moderate | Awaiting upstream patch; within supported version range |

---

## [5.0.0] — 2026-04-08

### Summary
Sprint 5: Storefront features, Google OAuth, review system, tenant theming.

### Completion Status
| Feature | Before | After |
|---------|--------|-------|
| Store-#01 (Home Page) | 65% | 100% |
| Store-#03 (PDP) | 92% | 100% |
| Store-#13 (Login Modal) | 78% | 100% |
| **Overall** | **78%** | **98%** |
