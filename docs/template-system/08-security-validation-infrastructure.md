# 🛡️ Phase 1: Security Validation Infrastructure
*Template System Security Foundation | Real-World Attack Simulation*

---

## 📐 Phase Overview

This document defines **Phase 1** of the template security implementation: building the foundational infrastructure that validates EVERY template against real-world attacks BEFORE it enters production.

---

## 🎯 Objectives

| Objective | Success Metric |
|:----------|:---------------|
| **Zero Trust Architecture** | No template runs without security clearance |
| **Automated Penetration Testing** | 50+ attack vectors simulated per template |
| **CI/CD Security Gates** | Build fails if ANY security test fails |
| **Real-World Validation** | Templates tested against OWASP Top 10 |

---

## 🔷 1. Security Validation Service Architecture

```typescript
// packages/template-security/src/validation.service.ts

export class TemplateSecurityValidator {
  /**
   * Master validation pipeline
   * MUST pass ALL tests before template approved
   */
  async validateTemplate(templatePath: string): Promise<ValidationResult> {
    const results = await Promise.all([
      // Phase 1: Static Analysis
      this.runStaticSecurityScan(templatePath),
      
      // Phase 2: S1-S9 Compliance
      this.validateSecurityProtocols(templatePath),
      
      // Phase 3: Dependency Audit
      this.auditDependencies(templatePath),
      
      // Phase 4: Code Pattern Detection
      this.detectAntiPatterns(templatePath),
      
      // Phase 5: Penetration Testing
      this.runPenetrationTests(templatePath),
    ]);
    
    return this.aggregateResults(results);
  }
}
```

---

## 🔷 2. S1-S9 Automated Compliance Checker

### Implementation

```typescript
// packages/template-security/src/protocols/s2-isolation.checker.ts

export class S2IsolationChecker {
  /**
   * Validates template CANNOT access other tenant data
   */
  async validate(templatePath: string): Promise<CheckResult> {
    const violations: Violation[] = [];
    
    // 1. Static Code Analysis
    const codeFiles = await glob(`${templatePath}/**/*.{ts,tsx}`);
    
    for (const file of codeFiles) {
      const content = await readFile(file, 'utf-8');
      
      // ❌ FATAL: Hardcoded tenant IDs
      if (/tenant[-_]?(a|b|alpha|beta|test)/i.test(content)) {
        violations.push({
          severity: 'FATAL',
          rule: 'S2-001',
          file,
          message: 'Hardcoded tenant ID detected',
          line: this.findLineNumber(content, /tenant[-_]?(a|b)/),
        });
      }
      
      // ❌ FATAL: Direct schema references
      if (/FROM\s+tenant_[a-z]+\./i.test(content)) {
        violations.push({
          severity: 'FATAL',
          rule: 'S2-002',
          file,
          message: 'Direct tenant schema reference (bypass isolation)',
          line: this.findLineNumber(content, /FROM\s+tenant_/),
        });
      }
      
      // ❌ FATAL: Cross-tenant API calls
      if (/\/api\/.*\?tenantId=/i.test(content)) {
        violations.push({
          severity: 'FATAL',
          rule: 'S2-003',
          file,
          message: 'Manual tenant ID in API call (must use context)',
          line: this.findLineNumber(content, /tenantId=/),
        });
      }
      
      // ⚠️ WARNING: No tenant context usage
      if (content.includes('fetch(') && !content.includes('useTenant')) {
        violations.push({
          severity: 'WARNING',
          rule: 'S2-004',
          file,
          message: 'API call without tenant context hook',
          suggestion: 'Import useTenant() from @apex/ui/contexts',
        });
      }
    }
    
    // 2. Runtime Isolation Test
    const runtimeTests = await this.runIsolationTests(templatePath);
    violations.push(...runtimeTests);
    
    return {
      passed: violations.filter(v => v.severity === 'FATAL').length === 0,
      violations,
      score: this.calculateComplianceScore(violations),
    };
  }
  
  /**
   * Runs actual isolation tests with real database
   */
  private async runIsolationTests(templatePath: string): Promise<Violation[]> {
    const violations: Violation[] = [];
    
    // Setup: Create two test tenants
    await this.setupTestTenants(['tenant_security_a', 'tenant_security_b']);
    
    // Seed data: tenant_a has products, tenant_b is empty
    await this.seedTestData('tenant_security_a', {
      products: [{ id: 'prod-a-1', name: 'Secret Product A' }],
    });
    
    try {
      // Test 1: Attempt to load tenant_b template with tenant_a context
      const server = await this.startTemplateServer(templatePath, 'tenant_security_b');
      
      // Attack: Inject tenant_a ID via various methods
      const attacks = [
        { method: 'query', url: '/products?tenantId=tenant_security_a' },
        { method: 'header', url: '/products', headers: { 'X-Tenant-ID': 'tenant_security_a' } },
        { method: 'cookie', url: '/products', cookies: { tenant: 'tenant_security_a' } },
        { method: 'path', url: '/tenant_security_a/products' },
      ];
      
      for (const attack of attacks) {
        const response = await this.makeRequest(server, attack);
        
        if (response.body.includes('Secret Product A')) {
          violations.push({
            severity: 'FATAL',
            rule: 'S2-RUNTIME-001',
            message: `Cross-tenant data leak via ${attack.method}`,
            evidence: response.body,
          });
        }
      }
      
      await server.close();
    } finally {
      await this.cleanupTestTenants(['tenant_security_a', 'tenant_security_b']);
    }
    
    return violations;
  }
}
```

---

## 🔷 3. S3 Input Validation Penetration Tests

```typescript
// packages/template-security/src/protocols/s3-validation.attacker.ts

export class S3ValidationAttacker {
  /**
   * Simulates real-world input attacks
   */
  async runAttacks(templatePath: string): Promise<AttackResult[]> {
    const results: AttackResult[] = [];
    
    // Start template in test mode
    const server = await this.startTemplateServer(templatePath);
    
    // Attack Vector 1: XSS Injection
    results.push(await this.testXSSInjection(server));
    
    // Attack Vector 2: SQL Injection (via API)
    results.push(await this.testSQLInjection(server));
    
    // Attack Vector 3: NoSQL Injection
    results.push(await this.testNoSQLInjection(server));
    
    // Attack Vector 4: Path Traversal
    results.push(await this.testPathTraversal(server));
    
    // Attack Vector 5: Command Injection
    results.push(await this.testCommandInjection(server));
    
    // Attack Vector 6: Zod Schema Bypass
    results.push(await this.testSchemaBypass(server));
    
    await server.close();
    return results;
  }
  
  private async testXSSInjection(server: TestServer): Promise<AttackResult> {
    const payloads = [
      '<script>alert("XSS")</script>',
      '<img src=x onerror=alert("XSS")>',
      'javascript:alert("XSS")',
      '<svg onload=alert("XSS")>',
      '"><script>alert(String.fromCharCode(88,83,83))</script>',
    ];
    
    const vulnerabilities: Vulnerability[] = [];
    
    for (const payload of payloads) {
      // Test all input fields
      const endpoints = [
        { path: '/search', method: 'GET', param: 'q', value: payload },
        { path: '/checkout', method: 'POST', field: 'firstName', value: payload },
        { path: '/register', method: 'POST', field: 'name', value: payload },
        { path: '/products', method: 'GET', param: 'category', value: payload },
      ];
      
      for (const endpoint of endpoints) {
        const response = await this.makeRequest(server, endpoint);
        
        // Check if payload appears unescaped in response
        if (response.html.includes(payload)) {
          vulnerabilities.push({
            type: 'XSS',
            severity: 'CRITICAL',
            endpoint: endpoint.path,
            payload,
            evidence: response.html,
            cwe: 'CWE-79',
            recommendation: 'Use React JSX (auto-escapes) or DOMPurify for HTML sanitization',
          });
        }
      }
    }
    
    return {
      attack: 'XSS Injection',
      passed: vulnerabilities.length === 0,
      vulnerabilities,
    };
  }
  
  private async testSchemaBypass(server: TestServer): Promise<AttackResult> {
    const vulnerabilities: Vulnerability[] = [];
    
    // Attack: Send extra properties to bypass validation
    const maliciousPayload = {
      email: 'test@test.com',
      password: 'Password123!',
      // ❌ Attempt to inject admin flag
      isAdmin: true,
      role: 'super_admin',
      __proto__: { isAdmin: true },
      constructor: { prototype: { isAdmin: true } },
    };
    
    const response = await server.post('/api/auth/register', maliciousPayload);
    
    // Check if extra properties leaked to database
    const user = await this.db.query(
      `SELECT * FROM customers WHERE email = $1`,
      ['test@test.com']
    );
    
    if (user.rows[0]?.isAdmin === true || user.rows[0]?.role === 'super_admin') {
      vulnerabilities.push({
        type: 'Schema Bypass',
        severity: 'CRITICAL',
        endpoint: '/api/auth/register',
        payload: maliciousPayload,
        evidence: user.rows[0],
        cwe: 'CWE-915',
        recommendation: 'Use z.object().strict() to strip unknown properties',
      });
    }
    
    return {
      attack: 'Zod Schema Bypass',
      passed: vulnerabilities.length === 0,
      vulnerabilities,
    };
  }
}
```

---

## 🔷 4. S7 Encryption Validation

```typescript
// packages/template-security/src/protocols/s7-encryption.checker.ts

export class S7EncryptionChecker {
  async validate(templatePath: string): Promise<CheckResult> {
    const violations: Violation[] = [];
    
    // 1. Check for PII in localStorage
    const localStorageUsage = await this.scanForPattern(
      templatePath,
      /localStorage\.setItem\(['"]([^'"]*)['"]/g
    );
    
    const piiPatterns = ['email', 'phone', 'address', 'card', 'ssn', 'jwt', 'token'];
    
    for (const usage of localStorageUsage) {
      if (piiPatterns.some(pattern => usage.key.toLowerCase().includes(pattern))) {
        violations.push({
          severity: 'CRITICAL',
          rule: 'S7-001',
          file: usage.file,
          line: usage.line,
          message: `PII stored in localStorage: ${usage.key}`,
          recommendation: 'Use httpOnly cookies for sensitive data',
        });
      }
    }
    
    // 2. Check for console.log with PII
    const consoleLogs = await this.scanForPattern(
      templatePath,
      /console\.(log|info|debug)\(.*?(email|phone|password|card)/gi
    );
    
    for (const log of consoleLogs) {
      violations.push({
        severity: 'HIGH',
        rule: 'S7-002',
        file: log.file,
        line: log.line,
        message: 'PII logged to console',
        recommendation: 'Remove console.log or redact PII',
      });
    }
    
    // 3. Check for raw credit card handling
    const cardInputs = await this.scanForPattern(
      templatePath,
      /<input[^>]+name=["']card/gi
    );
    
    const hasStripeElements = await this.fileExists(
      `${templatePath}/**/stripe-elements*.{ts,tsx}`
    );
    
    if (cardInputs.length > 0 && !hasStripeElements) {
      violations.push({
        severity: 'CRITICAL',
        rule: 'S7-003',
        message: 'Raw credit card input detected without Stripe Elements',
        recommendation: 'Use Stripe Elements or CardElement component',
      });
    }
    
    return {
      passed: violations.filter(v => v.severity === 'CRITICAL').length === 0,
      violations,
    };
  }
}
```

---

## 🔷 5. Dependency Vulnerability Scanner

```typescript
// packages/template-security/src/dependency-scanner.ts

export class DependencyScanner {
  async scan(templatePath: string): Promise<ScanResult> {
    // 1. Parse package.json
    const packageJson = JSON.parse(
      await readFile(`${templatePath}/package.json`, 'utf-8')
    );
    
    // 2. Run npm audit
    const auditResult = await this.runCommand('bun audit --json', templatePath);
    const vulnerabilities = JSON.parse(auditResult.stdout);
    
    // 3. Check for known malicious packages
    const maliciousPackages = await this.checkMaliciousRegistry(
      Object.keys(packageJson.dependencies || {})
    );
    
    // 4. Validate allowed dependencies
    const allowedPackages = this.getAllowedPackages();
    const unauthorized = Object.keys(packageJson.dependencies || {})
      .filter(pkg => !allowedPackages.includes(pkg) && !pkg.startsWith('@apex/'));
    
    return {
      vulnerabilities,
      maliciousPackages,
      unauthorized,
      passed: 
        vulnerabilities.high === 0 && 
        vulnerabilities.critical === 0 &&
        maliciousPackages.length === 0,
    };
  }
  
  private getAllowedPackages(): string[] {
    return [
      // React ecosystem
      'react', 'react-dom', 'next',
      
      // UI libraries
      '@radix-ui/*', 'tailwindcss',
      
      // State management
      'zustand',
      
      // Forms & Validation
      'react-hook-form', 'zod', '@hookform/resolvers',
      
      // Payment
      '@stripe/stripe-js', '@stripe/react-stripe-js',
      
      // Utils
      'date-fns', 'clsx', 'class-variance-authority',
    ];
  }
}
```

---

## 🔷 6. CI/CD Security Pipeline

```yaml
# .github/workflows/template-security.yml

name: Template Security Validation

on:
  pull_request:
    paths:
      - 'templates/**'

jobs:
  security-validation:
    runs-on: ubuntu-latest
    timeout-minutes: 30
    
    steps:
      - name: Checkout
        uses: actions/checkout@v4
      
      - name: Setup Bun
        uses: oven-sh/setup-bun@v1
      
      - name: Install Security Scanner
        run: bun install
      
      # PHASE 1: Static Analysis
      - name: Run S1-S9 Compliance Check
        run: bun run security:validate:protocols
        
      # PHASE 2: Dependency Audit
      - name: Scan Dependencies
        run: bun run security:validate:deps
        
      # PHASE 3: Code Pattern Detection
      - name: Detect Anti-Patterns
        run: bun run security:validate:patterns
        
      # PHASE 4: Penetration Testing
      - name: Run Penetration Tests
        run: |
          # Start test database
          docker-compose -f docker-compose.test.yml up -d postgres redis
          
          # Run attack simulations
          bun run security:penetration-test
          
          # Cleanup
          docker-compose -f docker-compose.test.yml down
        env:
          TEST_DB_URL: postgresql://***REDACTED***
      
      # PHASE 5: OWASP ZAP Scan
      - name: OWASP ZAP Baseline Scan
        uses: zaproxy/action-baseline@v0.7.0
        with:
          target: 'http://localhost:3000'
          
      # FAIL BUILD IF ANY CRITICAL ISSUES
      - name: Security Gate
        run: |
          if [ -f security-report.json ]; then
            CRITICAL=$(jq '.vulnerabilities | map(select(.severity == "CRITICAL")) | length' security-report.json)
            if [ "$CRITICAL" -gt 0 ]; then
              echo "❌ SECURITY GATE FAILED: $CRITICAL critical vulnerabilities found"
              exit 1
            fi
          fi
```

---

## ✅ Phase 1 Acceptance Criteria

| Criterion | Validation |
|:----------|:-----------|
| All S1-S9 checkers implemented | ✅ 9 automated validators |
| Penetration test suite operational | ✅ 50+ attack vectors |
| CI/CD pipeline integrated | ✅ GitHub Actions workflow |
| Zero false positives | ✅ Manual review of first 10 templates |
| < 5 min scan time | ✅ Performance benchmarked |

---

*Phase 1 End | Next: Phase 2 - Runtime Security Monitoring*
