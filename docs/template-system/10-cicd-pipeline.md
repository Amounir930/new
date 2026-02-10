# ⚡ CI/CD Pipeline: Complete Specification
*Automated Security Gates & Quality Enforcement*

---

## 🎯 Purpose

This document defines the **complete CI/CD pipeline** for template validation, security scanning, and deployment. Every template MUST pass ALL gates before production.

---

## 🔷 Pipeline Architecture

```mermaid
flowchart TD
    A[Developer Push] --> B{Files Changed?}
    B -->|templates/**| C[Template Validation Pipeline]
    B -->|Other files| Z[Standard CI]
    
    C --> D[Phase 1: Static Analysis]
    D --> E[Phase 2: Security Scan]
    E --> F[Phase 3: Build & Test]
    F --> G[Phase 4: Penetration Test]
    G --> H[Phase 5: Performance Audit]
    
    H --> I{All Gates Pass?}
    I -->|Yes| J[Approve for Review]
    I -->|No| K[Block PR + Comment]
    
    J --> L[Super Admin Review]
    L --> M{Approved?}
   M -->|Yes| N[Deploy to Registry]
    M -->|No| O[Reject + Feedback]
```

---

## 🔷 GitHub Actions Workflow

### File: `.github/workflows/template-validation.yml`

```yaml
name: Template Validation & Security

on:
  pull_request:
    paths:
      - 'templates/**'
      - 'packages/template-*/**'
  push:
    branches:
      - main
    paths:
      - 'templates/**'

env:
  BUN_VERSION: '1.0.25'
  NODE_VERSION: '20'

jobs:
  # ════════════════════════════════════════════════════════════
  # PHASE 1: Static Code Analysis
  # ════════════════════════════════════════════════════════════
  static-analysis:
    name: 🔍 Static Analysis
    runs-on: ubuntu-latest
    timeout-minutes: 10
    
    steps:
      - name: Checkout
        uses: actions/checkout@v4
        with:
          fetch-depth: 0 # Full history for diff analysis
      
      - name: Setup Bun
        uses: oven-sh/setup-bun@v1
        with:
          bun-version: ${{ env.BUN_VERSION }}
      
      - name: Install Dependencies
        run: bun install --frozen-lockfile
      
      - name: Run Biome Lint
        run: bun run lint
        working-directory: templates
      
      - name: TypeScript Check
        run: bun run type-check
        working-directory: templates
      
      - name: Detect Anti-Patterns
        run: |
          bun run security:scan:patterns \
            --path=templates \
            --output=static-analysis-report.json
      
      - name: Upload Analysis Report
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: static-analysis-report
          path: static-analysis-report.json
          retention-days: 30
  
  # ════════════════════════════════════════════════════════════
  # PHASE 2: Security Protocol Validation (S1-S9)
  # ════════════════════════════════════════════════════════════
  security-protocols:
    name: 🔐 S1-S9 Compliance
    runs-on: ubuntu-latest
    timeout-minutes: 15
    needs: [static-analysis]
    
    steps:
      - name: Checkout
        uses: actions/checkout@v4
      
      - name: Setup Bun
        uses: oven-sh/setup-bun@v1
      
      - name: Install Dependencies
        run: bun install --frozen-lockfile
      
      - name: S1 - Environment Verification
        run: bun run security:validate:s1 --templates=templates
      
      - name: S2 - Tenant Isolation Check
        run: |
          # Static check
          bun run security:validate:s2:static --templates=templates
          
          # Runtime isolation test (requires test DB)
          docker-compose -f docker-compose.test.yml up -d postgres
          sleep 5
          
          bun run security:validate:s2:runtime --templates=templates
          
          docker-compose -f docker-compose.test.yml down
      
      - name: S3 - Input Validation Check
        run: bun run security:validate:s3 --templates=templates
      
      - name: S4 - Audit Logging Verification
        run: bun run security:validate:s4 --templates=templates
      
      - name: S5 - Exception Handling Check
        run: bun run security:validate:s5 --templates=templates
      
      - name: S6 - Rate Limiting Check
        run: bun run security:validate:s6 --templates=templates
      
      - name: S7 - Encryption Validation
        run: bun run security:validate:s7 --templates=templates
      
      - name: S8 - Web Security Headers
        run: bun run security:validate:s8 --templates=templates
      
      - name: S9 - Health Check Verification
        run: bun run security:validate:s9 --templates=templates
      
      - name: Generate S1-S9 Report
        if: always()
        run: |
          bun run security:report:generate \
            --output=s1-s9-report.json
      
      - name: Upload Security Report
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: s1-s9-report
          path: s1-s9-report.json
      
      - name: Security Gate Check
        run: |
          CRITICAL=$(jq '.violations | map(select(.severity == "CRITICAL")) | length' s1-s9-report.json)
          
          if [ "$CRITICAL" -gt 0 ]; then
            echo "❌ SECURITY GATE FAILED"
            echo "Critical violations found: $CRITICAL"
            exit 1
          fi
          
          echo "✅ S1-S9 compliance verified"
  
  # ════════════════════════════════════════════════════════════
  # PHASE 3: Build & Unit Tests
  # ════════════════════════════════════════════════════════════
  build-and-test:
    name: 🏗️ Build & Test
    runs-on: ubuntu-latest
    timeout-minutes: 20
    needs: [security-protocols]
    
    strategy:
      matrix:
        template: 
          - fashion-boutique
          - tech-store
          # Add discovered templates dynamically
    
    steps:
      - name: Checkout
        uses: actions/checkout@v4
      
      - name: Setup Bun
        uses: oven-sh/setup-bun@v1
      
      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
      
      - name: Install Dependencies
        run: bun install --frozen-lockfile
      
      - name: Build Template
        run: |
          cd templates/${{ matrix.template }}
          bun run build
      
      - name: Run Unit Tests
        run: |
          cd templates/${{ matrix.template }}
          bun test --coverage
      
      - name: Coverage Gate
        run: |
          cd templates/${{ matrix.template }}
          
          COVERAGE=$(bun run coverage:check --threshold=80)
          
          if [ $? -ne 0 ]; then
            echo "❌ Coverage below 80%"
            exit 1
          fi
      
      - name: Upload Coverage
        uses: codecov/codecov-action@v4
        with:
          files: templates/${{ matrix.template }}/coverage/coverage-final.json
          flags: templates-${{ matrix.template }}
  
  # ════════════════════════════════════════════════════════════
  # PHASE 4: Penetration Testing
  # ════════════════════════════════════════════════════════════
  penetration-test:
    name: 🏴‍☠️ Penetration Testing
    runs-on: ubuntu-latest
    timeout-minutes: 30
    needs: [build-and-test]
    
    services:
      postgres:
        image: postgres:16-alpine
        env:
          POSTGRES_DB: test
          POSTGRES_USER: test
          POSTGRES_PASSWORD: test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432
      
      redis:
        image: redis:7-alpine
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 6379:6379
    
    steps:
      - name: Checkout
        uses: actions/checkout@v4
      
      - name: Setup Bun
        uses: oven-sh/setup-bun@v1
      
      - name: Install Dependencies
        run: bun install --frozen-lockfile
      
      - name: Setup Test Database
        run: |
          bun run db:migrate:test
          bun run db:seed:test
        env:
          DATABASE_URL: postgresql://***REDACTED***
      
      - name: Start Template Server
        run: |
          cd templates
          bun run dev &
          
          # Wait for server
          npx wait-on http://localhost:3000 --timeout 60000
        env:
          DATABASE_URL: postgresql://***REDACTED***
          REDIS_URL: redis://localhost:6379
          JWT_SECRET: test-jwt-secret-key
          MINIO_ENDPOINT: localhost
          MINIO_PORT: 9000
          MINIO_ACCESS_KEY: minio-test-access-key
          MINIO_SECRET_KEY: minio-test-secret-key-for-ci-only
      
      - name: Run XSS Attack Simulation
        run: |
          bun run security:attack:xss \
            --target=http://localhost:3000 \
            --report=xss-report.json
      
      - name: Run SQL Injection Attack
        run: |
          bun run security:attack:sql \
            --target=http://localhost:3000 \
            --report=sql-report.json
      
      - name: Run CSRF Attack Simulation
        run: |
          bun run security:attack:csrf \
            --target=http://localhost:3000 \
            --report=csrf-report.json
      
      - name: Run Authentication Bypass Tests
        run: |
          bun run security:attack:auth-bypass \
            --target=http://localhost:3000 \
            --report=auth-report.json
      
      - name: Run Rate Limit Stress Test
        run: |
          bun run security:attack:rate-limit \
            --target=http://localhost:3000 \
            --report=ratelimit-report.json
      
      - name: OWASP ZAP Baseline Scan
        uses: zaproxy/action-baseline@v0.7.0
        with:
          target: 'http://localhost:3000'
          rules_file_name: '.zap/rules.tsv'
          cmd_options: '-a'
      
      - name: Aggregate Penetration Test Results
        if: always()
        run: |
          bun run security:report:aggregate \
            --input=*-report.json \
            --output=penetration-test-full-report.json
      
      - name: Upload Penetration Report
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: penetration-test-report
          path: penetration-test-full-report.json
      
      - name: Penetration Test Gate
        run: |
          CRITICAL=$(jq '.vulnerabilities | map(select(.severity == "CRITICAL")) | length' penetration-test-full-report.json)
          
          if [ "$CRITICAL" -gt 0 ]; then
            echo "❌ PENETRATION TEST FAILED"
            echo "Critical vulnerabilities: $CRITICAL"
            exit 1
          fi
  
  # ════════════════════════════════════════════════════════════
  # PHASE 5: Performance Audit
  # ════════════════════════════════════════════════════════════
  performance-audit:
    name: ⚡ Performance Audit
    runs-on: ubuntu-latest
    timeout-minutes: 15
    needs: [penetration-test]
    
    steps:
      - name: Checkout
        uses: actions/checkout@v4
      
      - name: Setup Bun
        uses: oven-sh/setup-bun@v1
      
      - name: Install Dependencies
        run: bun install --frozen-lockfile
      
      - name: Build Template
        run: |
          cd templates
          bun run build
      
      - name: Analyze Bundle Size
        run: |
          bun run bundle:analyze \
            --templates=templates \
            --max-size=500kb \
            --output=bundle-report.json
      
      - name: Lighthouse CI
        uses: treosh/lighthouse-ci-action@v10
        with:
          urls: |
            http://localhost:3000
            http://localhost:3000/products
            http://localhost:3000/cart
            http://localhost:3000/checkout
          budgetPath: ./.lighthouserc.json
          uploadArtifacts: true
      
      - name: Performance Gate
        run: |
          SCORE=$(jq '.lighthouse.performance' performance-report.json)
          
          if (( $(echo "$SCORE < 90" | bc -l) )); then
            echo "❌ Performance score below 90: $SCORE"
            exit 1
          fi
  
  # ════════════════════════════════════════════════════════════
  # FINAL: Security Score & PR Comment
  # ════════════════════════════════════════════════════════════
  security-score:
    name: 📊 Calculate Security Score
    runs-on: ubuntu-latest
    needs: [static-analysis, security-protocols, penetration-test, performance-audit]
    if: always()
    
    steps:
      - name: Download All Reports
        uses: actions/download-artifact@v4
      
      - name: Calculate Security Score
        run: |
          bun run security:score:calculate \
            --reports=. \
            --output=final-security-score.json
      
      - name: Generate PR Comment
        uses: actions/github-script@v7
        with:
          script: |
            const fs = require('fs');
            const report = JSON.parse(fs.readFileSync('final-security-score.json'));
            
            const comment = `
            ## 🛡️ Template Security Validation Report
            
            **Overall Security Score:** ${report.score}/100
            
            ### Phase Results
            | Phase | Status | Issues |
            |:------|:-------|:-------|
            | Static Analysis | ${report.phases.static.passed ? '✅' : '❌'} | ${report.phases.static.issues} |
            | S1-S9 Compliance | ${report.phases.protocols.passed ? '✅' : '❌'} | ${report.phases.protocols.issues} |
            | Penetration Tests | ${report.phases.penetration.passed ? '✅' : '❌'} | ${report.phases.penetration.issues} |
            | Performance | ${report.phases.performance.passed ? '✅' : '❌'} | ${report.phases.performance.issues} |
            
            ${report.score === 100 ? '🎉 **Perfect Score! Template approved for review.**' : '⚠️ **Issues found. Review required.**'}
            
            <details>
            <summary>Detailed Report</summary>
            
            \`\`\`json
            ${JSON.stringify(report, null, 2)}
            \`\`\`
            </details>
            `;
            
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.name,
              body: comment
            });
      
      - name: Final Gate
        run: |
          SCORE=$(jq '.score' final-security-score.json)
          
          if [ "$SCORE" -lt 85 ]; then
            echo "❌ Security score below minimum (85): $SCORE"
            exit 1
          fi
          
          echo "✅ All security gates passed. Score: $SCORE/100"
```

---

## 🔷 Lighthouse CI Configuration

```json
// .lighthouserc.json
{
  "ci": {
    "collect": {
      "numberOfRuns": 3,
      "startServerCommand": "bun run dev",
      "url": [
        "http://localhost:3000",
        "http://localhost:3000/products",
        "http://localhost:3000/cart"
      ]
    },
    "assert": {
      "assertions": {
        "categories:performance": ["error", { "minScore": 0.9 }],
        "categories:accessibility": ["error", { "minScore": 0.9 }],
        "categories:best-practices": ["error", { "minScore": 0.9 }],
        "categories:seo": ["error", { "minScore": 0.9 }],
        "first-contentful-paint": ["error", { "maxNumericValue": 2000 }],
        "interactive": ["error", { "maxNumericValue": 3500 }],
        "total-byte-weight": ["error", { "maxNumericValue": 512000 }]
      }
    }
  }
}
```

---

## ✅ Pipeline Success Criteria

| Gate | Threshold | Action on Failure |
|:-----|:----------|:------------------|
| Static Analysis | 0 critical issues | Block PR |
| S1-S9 Compliance | 100% pass | Block PR |
| Coverage | ≥ 80% | Block PR |
| Penetration Tests | 0 critical vulnerabilities | Block PR |
| Security Score | ≥ 85/100 | Block PR |
| Performance | Lighthouse ≥ 90 | Block PR |

---

*Pipeline Version: 1.0.0 | Last Updated: 2026-02-08*
