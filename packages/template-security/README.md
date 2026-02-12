# @apex/template-security

Security validation and penetration testing framework for Apex v2 templates.

## 🎯 Purpose

Automated validation pipeline that ensures templates comply with **S1-S9 security protocols** before deployment.

## 🚀 Installation

```bash
bun add @apex/template-security
```

## 📖 Usage

### CLI Validation

```bash
# Validate a template
bun packages/template-security/src/cli.ts ./templates/fashion-boutique

# Output:
# ✅ S2: Tenant Isolation (100/100)
# ✅ S3: Input Validation (100/100)  
# ✅ S7: Encryption (100/100)
# Overall: ✅ PASSED | Score: 100/100
```

### Programmatic Usage

```typescript
import { TemplateSecurityValidator } from '@apex/template-security';

const validator = new TemplateSecurityValidator();
const result = await validator.validateTemplate('./templates/my-template');

if (result.passed) {
  console.log('✅ Template is secure!');
} else {
  console.log(`❌ ${result.summary.fatalViolations} violations found`);
}
```

## 🔍 Validators

### S2: Tenant Isolation Checker

Detects:
- ❌ Hardcoded tenant IDs
- ❌ Direct schema references (`FROM tenant_alpha.products`)
- ❌ Manual tenant ID in API calls
- ⚠️ Missing tenant context hooks

```typescript
import { S2IsolationChecker } from '@apex/template-security';

const checker = new S2IsolationChecker();
const result = await checker.validate('./templates/my-template');
// result.score: 0-100
```

### S3: Input Validation Checker

Detects:
- ❌ `useForm()` without `zodResolver`
- ❌ API routes without `.safeParse()`
- ⚠️ Inline validation (e.g., `.includes('@')`)
- ❌ Unsanitized user input

```typescript
import { S3ValidationChecker } from '@apex/template-security';

const checker = new S3ValidationChecker();
const result = await checker.validate('./templates/my-template');
```

### S7: Encryption Checker

Detects:
- ❌ PII in localStorage
- ⚠️ PII in console.log
- ❌ Raw credit card inputs
- ⚠️ `dangerouslySetInnerHTML` usage

```typescript
import { S7EncryptionChecker } from '@apex/template-security';

const checker = new S7EncryptionChecker();
const result = await checker.validate('./templates/my-template');
```

## 📊 Violation Severity

| Severity | Impact | Deployment |
|----------|--------|------------|
| **FATAL** | Security vulnerability | ❌ Blocks deployment |
| **WARNING** | Best practice violation | ⚠️ Allowed with review |
| **INFO** | Suggestion | ✅ No impact |

## 🎯 Scoring

- **100**: Perfect compliance
- **80-99**: Minor warnings
- **50-79**: Multiple warnings
- **0-49**: Fatal violations present

Templates MUST score **100** on fatal checks to pass.

## 📋 Validation Report

After validation, reports are generated:

```
templates/my-template/
└─ .security-reports/
   ├─ validation-report.json    # Machine-readable
   └─ validation-summary.md     # Human-readable
```

### Example Report

```markdown
# Security Validation Report: fashion-boutique

## Overall Result
- **Status:** ✅ PASSED
- **Score:** 100/100
- **Violations:** 0 fatal, 0 warnings

## Phase Results

### S2: Tenant Isolation
- Score: 100/100
- Status: ✅ PASSED
- Duration: 45ms

### S3: Input Validation
- Score: 100/100
- Status: ✅ PASSED
- Duration: 32ms
```

## 🔧 CI/CD Integration

Add to `.github/workflows/template-validation.yml`:

```yaml
- name: Security Validation
  run: |
    bun packages/template-security/src/cli.ts ./templates/${{ matrix.template }}
    
  # Fails pipeline if fatal violations found
```

## 🛡️ Best Practices

### ✅ DO

```typescript
// ✅ Tenant context from hook
const { tenantId } = useTenant();

// ✅ Zod validation
const form = useForm({
  resolver: zodResolver(CheckoutSchema)
});

// ✅ API validation
const result = OrderSchema.safeParse(body);
if (!result.success) return error;
```

### ❌ DON'T

```typescript
// ❌ Hardcoded tenant
const data = await fetch('/api/tenant_alpha/products');

// ❌ No validation
const form = useForm(); // Missing zodResolver

// ❌ PII in storage
localStorage.setItem('userEmail', email);
```

## 📚 Related

- [Security Protocols Spec](../../docs/template-system/03-security-protocols.md)
- [Security Validation Infrastructure](../../docs/template-system/08-security-validation-infrastructure.md)

## 🤝 Contributing

Found a security vulnerability? Report it immediately.

## 📄 License

MIT
