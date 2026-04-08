# Software Bill of Materials (SBOM)

## Last Updated
2026-04-08

## New Dependencies Added (Sprint 5)

### Runtime Dependencies
| Package | Version | Used In | Purpose | Audit Status |
|---------|---------|---------|---------|--------------|
| `passport-google-oauth20` | ^2.0.0 | `@apex/auth` | Google OAuth2 authentication for storefront customers | ✅ Reviewed |
| `@types/passport-google-oauth20` | ^2.0.17 | `@apex/auth` (dev) | TypeScript definitions for Google OAuth | ✅ Reviewed |

### Vulnerability Assessment

| Dependency | Vulnerability | Severity | Status | Mitigation |
|-----------|--------------|----------|--------|------------|
| `drizzle-orm` | SQL injection via improperly escaped identifiers | High | ⚠️ Accepted | Identifiers are not user-controlled; validated via Zod |
| `@nestjs/core` | Injection (GHSA-36xv-jgw5-4q75) | Moderate | ⚠️ Accepted | Patched in NestJS <=11.1.17; awaiting upstream fix |

### Dependency Graph

```
@apex/auth
├── passport-google-oauth20@^2.0.0
│   ├── passport@^0.7.0
│   ├── oauth@^0.10.0
│   └── @types/passport-google-oauth20@^2.0.17 (dev)
└── @apex/config
    └── validated env schema
```

### License Compliance
- `passport-google-oauth20`: MIT ✅
- `@types/passport-google-oauth20`: MIT ✅

## Complete Dependency List
See `bun.lock` for the full dependency tree. Run `bun audit` for latest vulnerability scan.
