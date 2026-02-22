#!/bin/bash
# security-audit.sh - فحص أمني شامل ملف بملف

echo "🔍 Starting Apex Security Audit (S1-S15)..."
echo "=========================================="

# ============================================
# S1: Environment Validation
# ============================================
echo ""
echo "🛡️  S1: Environment Validation"
echo "--------------------------------"

for file in apps/api/src/**/*.ts; do
  if [ -f "$file" ]; then
    result=$(grep -n "process\.env" "$file" 2>/dev/null | grep -v "envFilePath\|env\.")
    if [ ! -z "$result" ]; then
      echo "⚠️  $file:"
      echo "$result" | head -3
    fi
  fi
done

# ============================================
# S2: Tenant Isolation (search_path)
# ============================================
echo ""
echo "🛡️  S2: Tenant Isolation"
echo "--------------------------------"

for file in apps/api/src/**/*.ts; do
  if [ -f "$file" ]; then
    result=$(grep -n "search_path\|tenant_\|SCHEMA_NAME" "$file" 2>/dev/null)
    if [ ! -z "$result" ]; then
      echo "⚠️  $file:"
      echo "$result" | head -2
    fi
  fi
done

# ============================================
# S3: Input Validation (any types)
# ============================================
echo ""
echo "🛡️  S3: Input Validation (any types)"
echo "--------------------------------"

count=0
for file in apps/api/src/**/*.ts; do
  if [ -f "$file" ]; then
    result=$(grep -n ": any" "$file" 2>/dev/null)
    if [ ! -z "$result" ]; then
      count=$((count + 1))
      echo "❌ $file:"
      echo "$result" | head -2
    fi
  fi
done
echo "Total files with 'any': $count"

# ============================================
# S4: Audit Logging (error.message)
# ============================================
echo ""
echo "🛡️  S4: Audit Logging Sanitization"
echo "--------------------------------"

for file in apps/api/src/**/*.ts; do
  if [ -f "$file" ]; then
    result=$(grep -n "error\.message" "$file" 2>/dev/null)
    if [ ! -z "$result" ]; then
      echo "⚠️  $file:"
      echo "$result" | head -2
    fi
  fi
done

# ============================================
# S5: Error Filtering
# ============================================
echo ""
echo "🛡️  S5: Error Filtering"
echo "--------------------------------"

for file in apps/api/src/**/*.ts; do
  if [ -f "$file" ]; then
    result=$(grep -n "includeStackTrace\|includeIpDetails\|GlobalExceptionFilter" "$file" 2>/dev/null)
    if [ ! -z "$result" ]; then
      echo "📄 $file:"
      echo "$result" | head -2
    fi
  fi
done

# ============================================
# S6: Rate Limiting (@Public)
# ============================================
echo ""
echo "🛡️  S6: Rate Limiting (@Public)"
echo "--------------------------------"

for file in apps/api/src/**/*.ts; do
  if [ -f "$file" ]; then
    result=$(grep -n "@Public()" "$file" 2>/dev/null)
    if [ ! -z "$result" ]; then
      echo "⚠️  $file:"
      echo "$result"
      # Check if @Get or @Post exists in same file
      hasEndpoint=$(grep -n "@Get\|@Post\|@Put\|@Delete" "$file" 2>/dev/null | head -1)
      if [ ! -z "$hasEndpoint" ]; then
        echo "   ↳ Has endpoints: $hasEndpoint"
      fi
    fi
  fi
done

# ============================================
# S7: Encryption (AES/TLS mentions)
# ============================================
echo ""
echo "🛡️  S7: Encryption"
echo "--------------------------------"

for file in apps/api/src/**/*.ts; do
  if [ -f "$file" ]; then
    result=$(grep -n "AES\|encrypt\|decrypt\|crypto" "$file" 2>/dev/null)
    if [ ! -z "$result" ]; then
      echo "📄 $file:"
      echo "$result" | head -2
    fi
  fi
done

# ============================================
# S8: Security Headers (CSP/Helmet)
# ============================================
echo ""
echo "🛡️  S8: Security Headers"
echo "--------------------------------"

for file in apps/api/src/**/*.ts; do
  if [ -f "$file" ]; then
    result=$(grep -n "randomBytes\|cspNonce\|helmet\|CSP" "$file" 2>/dev/null)
    if [ ! -z "$result" ]; then
      echo "📄 $file:"
      echo "$result" | head -2
    fi
  fi
done

# ============================================
# S9: Supply Chain (package.json)
# ============================================
echo ""
echo "🛡️  S9: Supply Chain"
echo "--------------------------------"

if [ -f "package.json" ]; then
  echo "📄 package.json found"
  if grep -q "audit" package.json; then
    echo "✅ Has audit script"
  else
    echo "❌ Missing audit script"
  fi
fi

# ============================================
# S10: Secret Detection
# ============================================
echo ""
echo "🛡️  S10: Secret Detection"
echo "--------------------------------"

if [ -f ".pre-commit-config.yaml" ]; then
  echo "✅ .pre-commit-config.yaml exists"
  if grep -q "gitleaks" .pre-commit-config.yaml; then
    echo "✅ gitleaks configured"
  else
    echo "⚠️  gitleaks not found in pre-commit"
  fi
else
  echo "❌ Missing: .pre-commit-config.yaml"
fi

# Check for hardcoded secrets
echo "Checking for hardcoded secrets..."
for file in apps/api/src/**/*.ts; do
  if [ -f "$file" ]; then
    result=$(grep -n "password.*=\|secret.*=\|key.*=" "$file" 2>/dev/null | grep -v "process.env")
    if [ ! -z "$result" ]; then
      echo "⚠️  $file:"
      echo "$result" | head -2
    fi
  fi
done

# ============================================
# S11: Bot Protection (Middleware exclusions)
# ============================================
echo ""
echo "🛡️  S11: Bot Protection"
echo "--------------------------------"

for file in apps/api/src/**/*.ts; do
  if [ -f "$file" ]; then
    result=$(grep -n "\.exclude(\|BotProtection\|ActiveDefense" "$file" 2>/dev/null)
    if [ ! -z "$result" ]; then
      echo "📄 $file:"
      echo "$result" | head -5
    fi
  fi
done

# ============================================
# S12: DDoS Mitigation (Rate limiting)
# ============================================
echo ""
echo "🛡️  S12: DDoS Mitigation"
echo "--------------------------------"

for file in apps/api/src/**/*.ts; do
  if [ -f "$file" ]; then
    result=$(grep -n "RateLimit\|throttler\|Throttler" "$file" 2>/dev/null)
    if [ ! -z "$result" ]; then
      echo "📄 $file:"
      echo "$result" | head -2
    fi
  fi
done

# ============================================
# S13: Penetration Testing
# ============================================
echo ""
echo "🛡️  S13: Penetration Testing"
echo "--------------------------------"

if [ -d ".github/workflows" ]; then
  for file in .github/workflows/*.yml; do
    if [ -f "$file" ]; then
      result=$(grep -l "zap\|ZAP\|security" "$file" 2>/dev/null)
      if [ ! -z "$result" ]; then
        echo "✅ Found security check in: $file"
      fi
    fi
  done
else
  echo "❌ No .github/workflows directory"
fi

# ============================================
# S14: Fraud Detection
# ============================================
echo ""
echo "🛡️  S14: Fraud Detection"
echo "--------------------------------"

for file in apps/api/src/**/*.ts; do
  if [ -f "$file" ]; then
    result=$(grep -n "FraudGuard\|fraud\|riskScore" "$file" 2>/dev/null)
    if [ ! -z "$result" ]; then
      echo "📄 $file:"
      echo "$result" | head -2
    fi
  done
done

# ============================================
# S15: Active Defense (Honey Tokens)
# ============================================
echo ""
echo "🛡️  S15: Active Defense"
echo "--------------------------------"

for file in apps/api/src/security/*.ts; do
  if [ -f "$file" ]; then
    echo "📄 Checking: $file"
    result=$(grep -n "handleHoneypot\|HoneyTokens\|honeypot" "$file" 2>/dev/null)
    if [ ! -z "$result" ]; then
      echo "$result" | head -5
    fi
    
    # Check for IP blocking
    hasBlocking=$(grep -n "block\|ban\|redis.*ip" "$file" 2>/dev/null)
    if [ -z "$hasBlocking" ]; then
      echo "   ⚠️  No IP blocking implementation found"
    fi
  fi
done

# ============================================
# Summary
# ============================================
echo ""
echo "=========================================="
echo "📊 Audit Summary"
echo "=========================================="

echo ""
echo "✅ Audit complete. Review findings above."
echo ""
echo "Next steps:"
echo "1. Fix all ❌ items"
echo "2. Review all ⚠️ items"  
echo "3. Verify 📄 items manually"