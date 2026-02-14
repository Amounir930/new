#!/bin/bash
# Apex v2 - Surgical SAST Grep Scanner (S13 Protocol)
# Purpose: Detect dangerous sinks and patterns locally

set -euo pipefail

echo "═══════════════════════════════════════════════════════════════════"
echo "  🎯 APEX V2 - SURGICAL SAST GREP SCANNER (S13)"
echo "═══════════════════════════════════════════════════════════════════"

EXIT_CODE=0
IGNORE_PATHS="(node_modules|\.next/|dist/|build/|\.turbo/|\.test\.|\.spec\.|vitest\.config|scripts/|tooling/|ci-sentinel\.ts|scanner-cli\.ts|rate-limit\.ts|report-orchestrator\.ts|bun-shell\.ts|packages/export/src/strategies/|redis-rate-limit-store\.ts)"

# 1. RCE Detection (Remote Code Execution)
echo -e "\n[*] Scanning for RCE patterns (exec/spawn/child_process)..."
RCE_PATTERNS="\\b(child_process|exec|spawn|fork|vm\\.runInContext)\\b"
RCE_FOUND=$(grep -rlE "$RCE_PATTERNS" packages apps --include="*.ts" --include="*.tsx" --include="*.js" 2>/dev/null | grep -vE "$IGNORE_PATHS" || true)

if [ -n "$RCE_FOUND" ]; then
    echo "🚨 CRITICAL: Dangerous execution patterns (RCE risk) found!"
    echo "$RCE_FOUND"
    EXIT_CODE=1
fi

# 2. XSS Sinks (.innerHTML/.outerHTML)
echo -e "\n[*] Scanning for XSS sinks (innerHTML/outerHTML)..."
DOM_SINK=$(grep -rlE "\.(innerHTML|outerHTML)\s*=" packages apps --include="*.ts" --include="*.tsx" --include="*.js" 2>/dev/null | grep -vE "$IGNORE_PATHS" || true)
if [ -n "$DOM_SINK" ]; then
    echo "⚠️  WARNING: Direct DOM sink (.innerHTML/.outerHTML) found:"
    echo "$DOM_SINK"
fi

# 3. Dynamic Script Execution (eval/Function)
echo -e "\n[*] Scanning for eval() and Function constructor..."
JS_EVAL=$(grep -rlE "\beval\(|new\s+Function\(" packages apps --include="*.ts" --include="*.tsx" --include="*.js" 2>/dev/null | grep -vE "$IGNORE_PATHS" || true)
if [ -n "$JS_EVAL" ]; then
    echo "🚨 CRITICAL: Dangerous execution pattern (eval/Function) found!"
    echo "$JS_EVAL"
    EXIT_CODE=1
fi

# 4. Insecure CORS (Wildcard)
echo -e "\n[*] Scanning for insecure CORS (origin: *)..."
BAD_CORS=$(grep -rl "origin\s*:\s*['\"]\*['\"]" packages apps --include="*.ts" --include="*.js" --include="*.json" 2>/dev/null | grep -vE "$IGNORE_PATHS" || true)
if [ -n "$BAD_CORS" ]; then
    echo "🚨 CRITICAL: Insecure CORS wildcard (origin: '*') detected!"
    echo "$BAD_CORS"
    EXIT_CODE=1
fi

# 5. Insecure JWT
echo -e "\n[*] Scanning for insecure JWT configurations (alg: none)..."
BAD_JWT=$(grep -rlE "alg\s*:\s*['\"]none['\"]" packages apps --include="*.ts" --include="*.js" 2>/dev/null | grep -vE "$IGNORE_PATHS" || true)
if [ -n "$BAD_JWT" ]; then
    echo "🚨 CRITICAL: Insecure JWT 'none' algorithm found!"
    echo "$BAD_JWT"
    EXIT_CODE=1
fi

if [ $EXIT_CODE -eq 0 ]; then
    echo -e "\n✅ Surgical SAST Scan Passed."
else
    echo -e "\n❌ Surgical SAST Scan Failed. Fix critical violations."
fi

exit $EXIT_CODE
