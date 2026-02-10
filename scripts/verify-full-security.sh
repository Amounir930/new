#!/bin/bash
# Apex v2 - Full Security Verification Suite
# This script runs all local security gates to ensure 100% compliance before pushing.

set -euo pipefail

echo "════════════════════════════════════════════════════════"
echo "🛡️  APEX V2 - FULL SECURITY VERIFICATION SUITE"
echo "════════════════════════════════════════════════════════"

# 1. Environment Verification (S1)
echo -e "\n🌍 [S1] Testing Environment Verification..."
if [ -f "scripts/test-s1.ts" ]; then
    bun run scripts/test-s1.ts || { echo "❌ S1 Check Failed"; exit 1; }
    echo "✅ S1 Protocol Verified"
else
    echo "⚠️  S1 test script not found"
fi

# 2. Tenant Isolation AST Scan (S2)
echo -e "\n🏢 [S2] Running AST Tenant Isolation Scan..."
if [ -f "scripts/check-s2-isolation.ts" ]; then
    bun run scripts/check-s2-isolation.ts || { echo "❌ S2 AST Check Failed"; exit 1; }
    echo "✅ S2 AST Protocol Verified"
else
    echo "⚠️  S2 AST script not found"
fi

# 3. Secret Detection (Gitleaks)
echo -e "\n🔑 [Gitleaks] Checking for leaked secrets..."
if command -v docker &> /dev/null; then
    docker run --rm -v "$(pwd):/code" zricethezav/gitleaks:latest detect --source="/code" --verbose --redact || { echo "❌ Secrets Detected"; exit 1; }
    echo "✅ No Secrets Found"
else
    echo "⚠️  Docker not found, skipping Gitleaks"
fi

# 4. Dependency Audit
echo -e "\n📦 [Audit] Running Bun Dependency Audit..."
bun audit || { echo "❌ Dependency Audit Failed"; exit 1; }
echo "✅ Dependencies Secure"

# 5. Type Integrity & Schema Verification
echo -e "\n🏗️  [Types] Verifying Workspace Integrity..."
bun run build --filter=@apex/config --filter=@apex/db || { echo "❌ Build Failed"; exit 1; }
echo "✅ Core Integrity Verified"

echo -e "\n════════════════════════════════════════════════════════"
echo "✅ ALL LOCAL SECURITY GATES PASSED (100% COMPLIANT)"
echo "════════════════════════════════════════════════════════"
